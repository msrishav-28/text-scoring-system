"""Coherence analyzer for text flow and structure analysis."""

import numpy as np
from sentence_transformers import SentenceTransformer
from typing import Dict, Any, List, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re
from sklearn.metrics.pairwise import cosine_similarity

from app.analyzers.base_analyzer import BaseAnalyzer
from app.models.schemas import CoherenceScore
from app.services.gemini_service import GeminiService
from app.config import settings

class CoherenceAnalyzer(BaseAnalyzer):
    """Analyzer for text coherence, flow, and structure."""
    
    def __init__(self):
        super().__init__("CoherenceAnalyzer")
        
        # Initialize sentence transformer for semantic similarity
        self.sentence_model = SentenceTransformer(settings.embedding_model)
        
        # Initialize Gemini service
        self.gemini_service = GeminiService() if settings.gemini_api_key else None
        
        # Thread pool for CPU-bound operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Transition words categorized by type
        self.transition_words = {
            'addition': ['furthermore', 'moreover', 'additionally', 'also', 'besides', 
                        'in addition', 'likewise', 'similarly', 'equally important'],
            'contrast': ['however', 'nevertheless', 'nonetheless', 'on the other hand',
                        'conversely', 'in contrast', 'yet', 'although', 'despite'],
            'cause_effect': ['therefore', 'consequently', 'as a result', 'thus', 'hence',
                            'accordingly', 'because', 'since', 'due to'],
            'sequence': ['first', 'second', 'third', 'finally', 'next', 'then',
                        'subsequently', 'meanwhile', 'afterward', 'lastly'],
            'example': ['for example', 'for instance', 'specifically', 'namely',
                       'such as', 'including', 'particularly', 'especially'],
            'conclusion': ['in conclusion', 'to conclude', 'in summary', 'overall',
                          'to sum up', 'finally', 'in brief', 'ultimately']
        }
    
    async def analyze(self, text: str, use_api: bool = True, **kwargs) -> CoherenceScore:
        """Analyze text coherence and flow.
        
        Args:
            text: Text to analyze
            use_api: Whether to use Gemini API for advanced analysis
            
        Returns:
            CoherenceScore object with analysis results
        """
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        # Split into sentences and paragraphs
        sentences = self._split_sentences(processed_text)
        paragraphs = self._split_paragraphs(processed_text)
        
        # Calculate sentence flow using embeddings
        sentence_flow = await self._calculate_sentence_flow(sentences)
        
        # Analyze paragraph transitions
        paragraph_transitions = self._analyze_paragraph_transitions(paragraphs)
        
        # Find weak connections
        weak_connections = self._identify_weak_connections(sentences, sentence_flow)
        
        # Calculate readability scores
        readability_scores = self._calculate_readability_metrics(processed_text)
        
        # Use API for advanced analysis if available
        api_feedback = None
        if use_api and self.gemini_service and len(processed_text) < 2000:
            try:
                api_feedback = await self._get_api_feedback(processed_text)
            except Exception as e:
                self.logger.warning(f"API analysis failed: {e}")
        
        # Calculate final score
        score = self._calculate_coherence_score(
            sentence_flow, 
            paragraph_transitions, 
            weak_connections,
            readability_scores
        )
        
        # Generate suggestions
        suggestions = self._generate_suggestions(
            sentence_flow,
            paragraph_transitions,
            weak_connections,
            api_feedback
        )
        
        return CoherenceScore(
            score=score,
            sentence_flow=sentence_flow,
            paragraph_transitions=paragraph_transitions,
            weak_connections=weak_connections,
            suggestions=suggestions,
            readability_scores=readability_scores
        )
    
    async def _calculate_sentence_flow(self, sentences: List[str]) -> List[float]:
        """Calculate semantic similarity between consecutive sentences."""
        if len(sentences) < 2:
            return []
        
        # Get embeddings for all sentences
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            self.executor,
            self.sentence_model.encode,
            sentences
        )
        
        # Calculate similarities between consecutive sentences
        similarities = []
        for i in range(len(embeddings) - 1):
            similarity = cosine_similarity(
                embeddings[i].reshape(1, -1),
                embeddings[i + 1].reshape(1, -1)
            )[0][0]
            similarities.append(float(similarity))
        
        return similarities
    
    def _analyze_paragraph_transitions(self, paragraphs: List[str]) -> List[Dict[str, Any]]:
        """Analyze transitions between paragraphs."""
        transitions = []
        
        for i in range(len(paragraphs) - 1):
            current_para = paragraphs[i]
            next_para = paragraphs[i + 1]
            
            # Check for transition words
            transition_type = self._identify_transition_type(next_para)
            
            # Analyze thematic connection
            current_sentences = self._split_sentences(current_para)
            next_sentences = self._split_sentences(next_para)
            
            if current_sentences and next_sentences:
                # Get last sentence of current and first of next
                connection_strength = self._calculate_connection_strength(
                    current_sentences[-1], 
                    next_sentences[0]
                )
            else:
                connection_strength = 0.0
            
            transitions.append({
                'paragraph_index': i,
                'transition_type': transition_type,
                'connection_strength': connection_strength,
                'has_explicit_transition': transition_type is not None
            })
        
        return transitions
    
    def _identify_weak_connections(self, sentences: List[str], 
                                 sentence_flow: List[float]) -> List[Dict[str, Any]]:
        """Identify weak connections in text flow."""
        weak_connections = []
        
        # Threshold for weak connection
        weak_threshold = 0.3
        
        for i, similarity in enumerate(sentence_flow):
            if similarity < weak_threshold:
                weak_connections.append({
                    'sentence_index': i,
                    'similarity_score': similarity,
                    'sentence_before': sentences[i][:100] + '...' if len(sentences[i]) > 100 else sentences[i],
                    'sentence_after': sentences[i+1][:100] + '...' if len(sentences[i+1]) > 100 else sentences[i+1],
                    'suggestion': self._suggest_connection_improvement(sentences[i], sentences[i+1])
                })
        
        return weak_connections
    
    def _calculate_readability_metrics(self, text: str) -> Dict[str, float]:
        """Calculate various readability metrics."""
        import textstat
        
        return {
            'flesch_reading_ease': textstat.flesch_reading_ease(text),
            'flesch_kincaid_grade': textstat.flesch_kincaid_grade(text),
            'gunning_fog': textstat.gunning_fog(text),
            'smog_index': textstat.smog_index(text),
            'automated_readability_index': textstat.automated_readability_index(text),
            'coleman_liau_index': textstat.coleman_liau_index(text),
            'linsear_write_formula': textstat.linsear_write_formula(text),
            'dale_chall_readability': textstat.dale_chall_readability_score(text)
        }
    
    def _calculate_coherence_score(self, sentence_flow: List[float],
                                 paragraph_transitions: List[Dict[str, Any]],
                                 weak_connections: List[Dict[str, Any]],
                                 readability_scores: Dict[str, float]) -> float:
        """Calculate overall coherence score."""
        # Base score from sentence flow
        if sentence_flow:
            avg_flow = sum(sentence_flow) / len(sentence_flow)
            flow_score = avg_flow * 100
        else:
            flow_score = 100
        
        # Penalty for weak connections
        weak_penalty = len(weak_connections) * 5
        
        # Bonus for good paragraph transitions
        transition_bonus = sum(
            10 for t in paragraph_transitions 
            if t['has_explicit_transition'] and t['connection_strength'] > 0.5
        )
        
        # Readability factor (normalize Flesch score to 0-1)
        flesch_score = readability_scores.get('flesch_reading_ease', 60)
        readability_factor = min(100, max(0, flesch_score)) / 100
        
        # Calculate final score
        score = (flow_score - weak_penalty + transition_bonus) * readability_factor
        
        return max(0, min(100, score))
    
    async def _get_api_feedback(self, text: str) -> Dict[str, Any]:
        """Get coherence feedback from Gemini API."""
        if not self.gemini_service:
            return {}
        
        prompt = f"""Analyze the coherence and flow of the following text. 
        Provide feedback on:
        1. Overall logical flow and organization
        2. Transitions between ideas
        3. Clarity of argument or narrative
        4. Any sections that seem disconnected or confusing
        
        Return your analysis in JSON format:
        {{
            "overall_coherence": "excellent|good|fair|poor",
            "main_issues": ["issue1", "issue2"],
            "strengths": ["strength1", "strength2"],
            "specific_improvements": ["improvement1", "improvement2"]
        }}
        
        Text to analyze:
        {text}
        """
        
        try:
            response = await self.gemini_service.analyze_text(prompt)
            return self._parse_api_feedback(response)
        except Exception as e:
            self.logger.error(f"Error getting API feedback: {e}")
            return {}
    
    def _generate_suggestions(self, sentence_flow: List[float],
                            paragraph_transitions: List[Dict[str, Any]],
                            weak_connections: List[Dict[str, Any]],
                            api_feedback: Dict[str, Any]) -> List[str]:
        """Generate coherence improvement suggestions."""
        suggestions = []
        
        # Based on sentence flow
        if sentence_flow and sum(sentence_flow) / len(sentence_flow) < 0.4:
            suggestions.append("Consider using more transitional phrases to connect sentences")
        
        # Based on weak connections
        if len(weak_connections) > 3:
            suggestions.append("Several sentences appear disconnected. Try to establish clearer logical connections")
        
        # Based on paragraph transitions
        no_transition_count = sum(1 for t in paragraph_transitions if not t['has_explicit_transition'])
        if no_transition_count > len(paragraph_transitions) / 2:
            suggestions.append("Add transition words or phrases at the beginning of paragraphs")
        
        # From API feedback
        if api_feedback and 'specific_improvements' in api_feedback:
            suggestions.extend(api_feedback['specific_improvements'][:2])
        
        # General suggestions based on patterns
        if any(wc['similarity_score'] < 0.2 for wc in weak_connections):
            suggestions.append("Some sentences seem to jump to new topics abruptly. Consider adding bridging sentences")
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # More sophisticated sentence splitting
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _split_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs."""
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _identify_transition_type(self, paragraph: str) -> str:
        """Identify the type of transition used in a paragraph."""
        paragraph_lower = paragraph.lower()
        
        for transition_type, words in self.transition_words.items():
            for word in words:
                if paragraph_lower.startswith(word) or f" {word}" in paragraph_lower[:50]:
                    return transition_type
        
        return None
    
    def _calculate_connection_strength(self, sentence1: str, sentence2: str) -> float:
        """Calculate semantic connection strength between two sentences."""
        embeddings = self.sentence_model.encode([sentence1, sentence2])
        similarity = cosine_similarity(
            embeddings[0].reshape(1, -1),
            embeddings[1].reshape(1, -1)
        )[0][0]
        return float(similarity)
    
    def _suggest_connection_improvement(self, sentence1: str, sentence2: str) -> str:
        """Suggest how to improve connection between sentences."""
        # Simple heuristic-based suggestions
        if len(sentence2.split()) < 10:
            return "Consider expanding the second sentence or combining it with the previous one"
        
        # Check if sentences discuss completely different topics
        words1 = set(sentence1.lower().split())
        words2 = set(sentence2.lower().split())
        common_words = words1.intersection(words2) - {'the', 'a', 'an', 'is', 'are', 'was', 'were'}
        
        if len(common_words) < 2:
            return "Add a transitional sentence to bridge these topics"
        
        return "Use transitional phrases to clarify the relationship between these ideas"
    
    def _parse_api_feedback(self, response: str) -> Dict[str, Any]:
        """Parse API feedback response."""
        import json
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                return json.loads(json_str)
            else:
                return {}
        except Exception as e:
            self.logger.error(f"Failed to parse API feedback: {e}")
            return {}