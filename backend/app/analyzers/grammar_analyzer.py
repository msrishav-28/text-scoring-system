"""Grammar analyzer using hybrid approach."""

import spacy
import language_tool_python
from typing import Dict, Any, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re

from app.analyzers.base_analyzer import BaseAnalyzer
from app.models.schemas import Error, ErrorType, Severity, GrammarScore
from app.services.gemini_service import GeminiService
from app.config import settings

class GrammarAnalyzer(BaseAnalyzer):
    """Analyzer for grammar, spelling, and style checking."""
    
    def __init__(self):
        super().__init__("GrammarAnalyzer")
        
        # Initialize spaCy
        try:
            self.nlp = spacy.load(settings.spacy_model)
        except OSError:
            self.logger.warning(f"spaCy model {settings.spacy_model} not found. Downloading...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", settings.spacy_model])
            self.nlp = spacy.load(settings.spacy_model)
        
        # Initialize LanguageTool
        self.language_tool = language_tool_python.LanguageTool('en-US')
        
        # Initialize Gemini service
        self.gemini_service = GeminiService() if settings.gemini_api_key else None
        
        # Thread pool for CPU-bound operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
    async def analyze(self, text: str, use_api: bool = True, **kwargs) -> GrammarScore:
        """Analyze text for grammar errors.
        
        Args:
            text: Text to analyze
            use_api: Whether to use Gemini API for advanced analysis
            
        Returns:
            GrammarScore object with analysis results
        """
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        # Get text statistics
        stats = self.get_text_statistics(processed_text)
        
        # Run local analysis
        local_errors = await self._run_local_analysis(processed_text)
        
        # Run API analysis if enabled and available
        api_errors = []
        if use_api and self.gemini_service and len(processed_text) < 2000:
            try:
                api_errors = await self._run_api_analysis(processed_text)
            except Exception as e:
                self.logger.warning(f"API analysis failed: {e}")
        
        # Merge and deduplicate errors
        all_errors = self._merge_errors(local_errors, api_errors)
        
        # Calculate score
        score = self._calculate_score(all_errors, stats['word_count'])
        
        # Generate suggestions
        suggestions = self._generate_suggestions(all_errors, processed_text)
        
        # Create detailed analysis
        details = {
            "error_counts": self._count_errors_by_type(all_errors),
            "readability": self._calculate_readability(processed_text),
            "sentence_variety": self._analyze_sentence_variety(processed_text),
            "vocabulary_level": self._analyze_vocabulary(processed_text)
        }
        
        return GrammarScore(
            score=score,
            errors=all_errors,
            error_density=len(all_errors) / max(stats['word_count'], 1) * 100,
            suggestions=suggestions,
            details=details
        )
    
    async def _run_local_analysis(self, text: str) -> List[Error]:
        """Run local grammar analysis using spaCy and LanguageTool."""
        errors = []
        
        # LanguageTool analysis
        loop = asyncio.get_event_loop()
        lt_matches = await loop.run_in_executor(
            self.executor, 
            self.language_tool.check, 
            text
        )
        
        for match in lt_matches:
            # Skip certain rule IDs that are too pedantic
            if match.ruleId in ['WHITESPACE_RULE', 'EN_QUOTES', 'COMMA_PARENTHESIS_WHITESPACE']:
                continue
                
            severity = self._map_lt_severity(match.category)
            error_type = self._map_lt_type(match.category)
            
            errors.append(Error(
                type=error_type,
                severity=severity,
                position=[match.offset, match.offset + match.errorLength],
                message=match.message,
                suggestion=match.replacements[0] if match.replacements else None,
                explanation=match.context,
                confidence=0.8
            ))
        
        # spaCy analysis for additional checks
        doc = await loop.run_in_executor(self.executor, self.nlp, text)
        
        # Check for sentence fragments
        for sent in doc.sents:
            if not any(token.dep_ == "ROOT" for token in sent):
                errors.append(Error(
                    type=ErrorType.GRAMMAR,
                    severity=Severity.MEDIUM,
                    position=[sent.start_char, sent.end_char],
                    message="Possible sentence fragment",
                    suggestion="Consider revising this sentence to include a main verb",
                    confidence=0.6
                ))
        
        return errors
    
    async def _run_api_analysis(self, text: str) -> List[Error]:
        """Run advanced grammar analysis using Gemini API."""
        if not self.gemini_service:
            return []
            
        prompt = f"""Analyze the following text for grammar, style, and clarity issues. 
        Return ONLY the errors found in this exact JSON format:
        [
            {{
                "type": "grammar|spelling|punctuation|style|clarity",
                "severity": "low|medium|high",
                "position": [start_char, end_char],
                "message": "Description of the error",
                "suggestion": "How to fix it",
                "explanation": "Why this is an error"
            }}
        ]
        
        If no errors are found, return an empty array [].
        Focus on significant errors that affect readability and professionalism.
        
        Text to analyze:
        {text}
        """
        
        try:
            response = await self.gemini_service.analyze_text(prompt)
            errors_data = self._parse_api_response(response)
            
            return [
                Error(
                    type=ErrorType(e.get('type', 'grammar')),
                    severity=Severity(e.get('severity', 'medium')),
                    position=e.get('position', [0, 10]),
                    message=e.get('message', 'Error detected'),
                    suggestion=e.get('suggestion'),
                    explanation=e.get('explanation'),
                    confidence=0.9
                )
                for e in errors_data
            ]
        except Exception as e:
            self.logger.error(f"Error parsing API response: {e}")
            return []
    
    def _merge_errors(self, local_errors: List[Error], api_errors: List[Error]) -> List[Error]:
        """Merge and deduplicate errors from different sources."""
        all_errors = []
        seen_positions = set()
        
        # Prioritize API errors (higher confidence)
        for error in api_errors:
            pos_key = (error.position[0], error.position[1], error.type)
            if pos_key not in seen_positions:
                all_errors.append(error)
                seen_positions.add(pos_key)
        
        # Add local errors that don't overlap
        for error in local_errors:
            pos_key = (error.position[0], error.position[1], error.type)
            overlap = any(
                abs(error.position[0] - e.position[0]) < 5 and 
                abs(error.position[1] - e.position[1]) < 5
                for e in all_errors
            )
            if not overlap and pos_key not in seen_positions:
                all_errors.append(error)
                seen_positions.add(pos_key)
        
        # Sort by position
        all_errors.sort(key=lambda e: e.position[0])
        
        return all_errors
    
    def _calculate_score(self, errors: List[Error], word_count: int) -> float:
        """Calculate grammar score based on errors."""
        if word_count == 0:
            return 100.0
        
        # Weight errors by severity
        severity_weights = {
            Severity.LOW: 0.5,
            Severity.MEDIUM: 1.0,
            Severity.HIGH: 2.0,
            Severity.CRITICAL: 3.0
        }
        
        total_penalty = sum(
            severity_weights.get(error.severity, 1.0) 
            for error in errors
        )
        
        # Calculate score (deduct points for errors, but not below 0)
        # Assuming 1 error per 50 words is acceptable
        expected_errors = word_count / 50
        error_ratio = total_penalty / max(expected_errors, 1)
        
        score = max(0, 100 - (error_ratio * 20))
        
        return round(score, 2)
    
    def _generate_suggestions(self, errors: List[Error], text: str) -> List[str]:
        """Generate overall suggestions based on errors."""
        suggestions = []
        
        error_types = [e.type for e in errors]
        
        if ErrorType.GRAMMAR in error_types:
            suggestions.append("Review sentence structure and ensure subject-verb agreement")
        
        if ErrorType.SPELLING in error_types:
            suggestions.append("Use spell-check and proofread carefully for typos")
        
        if ErrorType.PUNCTUATION in error_types:
            suggestions.append("Check punctuation, especially comma usage and sentence endings")
        
        if ErrorType.STYLE in error_types:
            suggestions.append("Consider varying sentence structure for better flow")
        
        if ErrorType.CLARITY in error_types:
            suggestions.append("Simplify complex sentences for better readability")
        
        # Add specific suggestions based on error patterns
        if len(errors) > 10:
            suggestions.append("Consider breaking down complex ideas into simpler sentences")
        
        avg_sentence_length = len(text.split()) / max(len(text.split('.')), 1)
        if avg_sentence_length > 25:
            suggestions.append("Try using shorter sentences to improve readability")
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _map_lt_severity(self, category: str) -> Severity:
        """Map LanguageTool category to severity."""
        category_lower = category.lower()
        
        if 'typo' in category_lower or 'spelling' in category_lower:
            return Severity.HIGH
        elif 'grammar' in category_lower:
            return Severity.MEDIUM
        elif 'style' in category_lower:
            return Severity.LOW
        else:
            return Severity.LOW
    
    def _map_lt_type(self, category: str) -> ErrorType:
        """Map LanguageTool category to error type."""
        category_lower = category.lower()
        
        if 'typo' in category_lower or 'spelling' in category_lower:
            return ErrorType.SPELLING
        elif 'grammar' in category_lower:
            return ErrorType.GRAMMAR
        elif 'punctuation' in category_lower:
            return ErrorType.PUNCTUATION
        elif 'style' in category_lower:
            return ErrorType.STYLE
        else:
            return ErrorType.CLARITY
    
    def _count_errors_by_type(self, errors: List[Error]) -> Dict[str, int]:
        """Count errors by type."""
        counts = {error_type.value: 0 for error_type in ErrorType}
        for error in errors:
            counts[error.type.value] += 1
        return counts
    
    def _calculate_readability(self, text: str) -> Dict[str, float]:
        """Calculate various readability scores."""
        import textstat
        
        return {
            "flesch_reading_ease": textstat.flesch_reading_ease(text),
            "flesch_kincaid_grade": textstat.flesch_kincaid_grade(text),
            "gunning_fog": textstat.gunning_fog(text),
            "automated_readability_index": textstat.automated_readability_index(text),
            "coleman_liau_index": textstat.coleman_liau_index(text)
        }
    
    def _analyze_sentence_variety(self, text: str) -> Dict[str, Any]:
        """Analyze sentence variety and structure."""
        sentences = self._split_sentences(text)
        if not sentences:
            return {"variety_score": 0, "patterns": {}}
        
        # Analyze sentence lengths
        lengths = [len(s.split()) for s in sentences]
        
        # Analyze sentence starters
        starters = [s.split()[0].lower() if s.split() else "" for s in sentences]
        starter_variety = len(set(starters)) / len(starters) if starters else 0
        
        return {
            "variety_score": starter_variety * 100,
            "avg_length": sum(lengths) / len(lengths) if lengths else 0,
            "length_variance": self._calculate_variance(lengths),
            "patterns": {
                "short_sentences": sum(1 for l in lengths if l < 10),
                "medium_sentences": sum(1 for l in lengths if 10 <= l < 20),
                "long_sentences": sum(1 for l in lengths if l >= 20)
            }
        }
    
    def _analyze_vocabulary(self, text: str) -> Dict[str, Any]:
        """Analyze vocabulary complexity and diversity."""
        words = text.lower().split()
        unique_words = set(words)
        
        # Simple vocabulary analysis
        return {
            "total_words": len(words),
            "unique_words": len(unique_words),
            "lexical_diversity": len(unique_words) / len(words) if words else 0,
            "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0
        }
    
    def _calculate_variance(self, values: List[float]) -> float:
        """Calculate variance of a list of values."""
        if not values:
            return 0
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / len(values)
    
    def _parse_api_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse API response to extract errors."""
        import json
        
        try:
            # Extract JSON from response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
            else:
                return []
        except Exception as e:
            self.logger.error(f"Failed to parse API response: {e}")
            return []