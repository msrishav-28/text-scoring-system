"""Topic relevance analyzer for text analysis."""

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, Any, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from collections import Counter

from app.analyzers.base_analyzer import BaseAnalyzer
from app.models.schemas import RelevanceScore
from app.services.gemini_service import GeminiService
from app.config import settings

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class RelevanceAnalyzer(BaseAnalyzer):
    """Analyzer for topic relevance and coverage."""
    
    def __init__(self):
        super().__init__("RelevanceAnalyzer")
        
        # Initialize sentence transformer
        self.sentence_model = SentenceTransformer(settings.embedding_model)
        
        # Initialize TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Initialize Gemini service
        self.gemini_service = GeminiService() if settings.gemini_api_key else None
        
        # Thread pool for CPU-bound operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Stop words
        self.stop_words = set(stopwords.words('english'))
    
    async def analyze(self, text: str, topic: Optional[str] = None, 
                     topics: Optional[List[str]] = None, use_api: bool = True, 
                     **kwargs) -> RelevanceScore:
        """Analyze text relevance to given topic(s).
        
        Args:
            text: Text to analyze
            topic: Single topic string
            topics: List of topics
            use_api: Whether to use Gemini API
            
        Returns:
            RelevanceScore object with analysis results
        """
        # Preprocess text
        processed_text = self.preprocess_text(text)
        
        # Handle topic input
        all_topics = []
        if topic:
            all_topics.append(topic)
        if topics:
            all_topics.extend(topics)
        
        if not all_topics:
            # If no topic provided, return neutral score
            return RelevanceScore(
                score=50.0,
                topic_coverage={},
                key_terms_found=[],
                missing_aspects=[],
                topic_drift=[],
                suggestions=["Please provide a topic to analyze relevance against"]
            )
        
        # Extract key terms from text
        key_terms = await self._extract_key_terms(processed_text)
        
        # Calculate topic coverage
        topic_coverage = await self._calculate_topic_coverage(processed_text, all_topics)
        
        # Find missing aspects
        missing_aspects = await self._identify_missing_aspects(processed_text, all_topics, key_terms)
        
        # Analyze topic drift
        topic_drift = await self._analyze_topic_drift(processed_text, all_topics)
        
        # Use API for advanced analysis if available
        api_analysis = None
        if use_api and self.gemini_service and len(processed_text) < 2000:
            try:
                api_analysis = await self._get_api_analysis(processed_text, all_topics)
            except Exception as e:
                self.logger.warning(f"API analysis failed: {e}")
        
        # Calculate final score
        score = self._calculate_relevance_score(
            topic_coverage,
            key_terms,
            topic_drift,
            api_analysis
        )
        
        # Generate suggestions
        suggestions = self._generate_suggestions(
            topic_coverage,
            missing_aspects,
            topic_drift,
            api_analysis
        )
        
        return RelevanceScore(
            score=score,
            topic_coverage=topic_coverage,
            key_terms_found=key_terms[:20],  # Top 20 key terms
            missing_aspects=missing_aspects,
            topic_drift=topic_drift,
            suggestions=suggestions
        )
    
    async def _extract_key_terms(self, text: str) -> List[str]:
        """Extract key terms from text using TF-IDF."""
        loop = asyncio.get_event_loop()
        
        # Tokenize and filter
        tokens = word_tokenize(text.lower())
        filtered_tokens = [
            token for token in tokens 
            if token.isalnum() and token not in self.stop_words and len(token) > 2
        ]
        
        # If text is too short, return most common words
        if len(filtered_tokens) < 20:
            return list(Counter(filtered_tokens).most_common(10))
        
        try:
            # Fit TF-IDF on the text
            tfidf_matrix = await loop.run_in_executor(
                self.executor,
                self.tfidf_vectorizer.fit_transform,
                [text]
            )
            
            # Get feature names and scores
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Sort by score
            term_scores = [(feature_names[i], scores[i]) for i in range(len(scores))]
            term_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [term for term, score in term_scores if score > 0]
        except Exception as e:
            self.logger.error(f"Error extracting key terms: {e}")
            # Fallback to simple frequency-based extraction
            return [word for word, _ in Counter(filtered_tokens).most_common(20)]
    
    async def _calculate_topic_coverage(self, text: str, topics: List[str]) -> Dict[str, float]:
        """Calculate how well the text covers each topic."""
        loop = asyncio.get_event_loop()
        
        # Get embeddings for text and topics
        text_embedding = await loop.run_in_executor(
            self.executor,
            self.sentence_model.encode,
            [text]
        )
        
        topic_embeddings = await loop.run_in_executor(
            self.executor,
            self.sentence_model.encode,
            topics
        )
        
        # Calculate similarities
        coverage = {}
        for i, topic in enumerate(topics):
            similarity = cosine_similarity(
                text_embedding[0].reshape(1, -1),
                topic_embeddings[i].reshape(1, -1)
            )[0][0]
            coverage[topic] = float(similarity) * 100
        
        return coverage
    
    async def _identify_missing_aspects(self, text: str, topics: List[str], 
                                      key_terms: List[str]) -> List[str]:
        """Identify aspects of the topic that might be missing."""
        missing_aspects = []
        
        # Common aspects to check based on topic keywords
        aspect_keywords = {
            'technical': ['implementation', 'architecture', 'performance', 'scalability'],
            'business': ['roi', 'cost', 'benefit', 'strategy', 'market'],
            'research': ['methodology', 'results', 'conclusion', 'hypothesis', 'data'],
            'educational': ['examples', 'explanation', 'definition', 'practice', 'theory'],
            'analysis': ['comparison', 'evaluation', 'metrics', 'findings', 'insights']
        }
        
        # Determine topic type and check for missing aspects
        text_lower = text.lower()
        for topic in topics:
            topic_lower = topic.lower()
            
            # Check which aspect category the topic might belong to
            for category, aspects in aspect_keywords.items():
                if any(keyword in topic_lower for keyword in [category]):
                    for aspect in aspects:
                        if aspect not in text_lower and aspect not in key_terms:
                            missing_aspects.append(f"{aspect} related to {topic}")
        
        # Limit to top 5 missing aspects
        return missing_aspects[:5]
    
    async def _analyze_topic_drift(self, text: str, topics: List[str]) -> List[Dict[str, Any]]:
        """Analyze how the text drifts from the main topics."""
        # Split text into chunks (paragraphs or sections)
        paragraphs = self._split_paragraphs(text)
        
        if len(paragraphs) < 2:
            return []
        
        loop = asyncio.get_event_loop()
        
        # Get embeddings for topics
        topic_embeddings = await loop.run_in_executor(
            self.executor,
            self.sentence_model.encode,
            topics
        )
        
        # Analyze each paragraph
        drift_analysis = []
        for i, paragraph in enumerate(paragraphs):
            if len(paragraph.strip()) < 50:  # Skip very short paragraphs
                continue
            
            # Get paragraph embedding
            para_embedding = await loop.run_in_executor(
                self.executor,
                self.sentence_model.encode,
                [paragraph]
            )
            
            # Calculate relevance to each topic
            relevances = []
            for topic_emb in topic_embeddings:
                similarity = cosine_similarity(
                    para_embedding[0].reshape(1, -1),
                    topic_emb.reshape(1, -1)
                )[0][0]
                relevances.append(float(similarity))
            
            # Check if this paragraph has low relevance to all topics
            max_relevance = max(relevances) if relevances else 0
            if max_relevance < 0.3:  # Threshold for topic drift
                drift_analysis.append({
                    'paragraph_index': i,
                    'relevance_score': max_relevance,
                    'preview': paragraph[:100] + '...' if len(paragraph) > 100 else paragraph,
                    'suggestion': 'This section seems to drift from the main topic'
                })
        
        return drift_analysis
    
    async def _get_api_analysis(self, text: str, topics: List[str]) -> Dict[str, Any]:
        """Get relevance analysis from Gemini API."""
        if not self.gemini_service:
            return {}
        
        topics_str = ', '.join(topics)
        prompt = f"""Analyze how well the following text addresses the topic(s): {topics_str}
        
        Provide analysis in JSON format:
        {{
            "overall_relevance": "excellent|good|fair|poor",
            "well_covered_aspects": ["aspect1", "aspect2"],
            "missing_aspects": ["aspect1", "aspect2"],
            "off_topic_sections": ["description1", "description2"],
            "improvement_suggestions": ["suggestion1", "suggestion2"]
        }}
        
        Text to analyze:
        {text}
        """
        
        try:
            response = await self.gemini_service.analyze_text(prompt)
            return self._parse_api_response(response)
        except Exception as e:
            self.logger.error(f"Error getting API analysis: {e}")
            return {}
    
    def _calculate_relevance_score(self, topic_coverage: Dict[str, float],
                                 key_terms: List[str],
                                 topic_drift: List[Dict[str, Any]],
                                 api_analysis: Dict[str, Any]) -> float:
        """Calculate overall relevance score."""
        # Base score from topic coverage
        if topic_coverage:
            avg_coverage = sum(topic_coverage.values()) / len(topic_coverage)
        else:
            avg_coverage = 50
        
        # Penalty for topic drift
        drift_penalty = len(topic_drift) * 5
        
        # Bonus for having relevant key terms
        term_bonus = min(10, len(key_terms) / 2)
        
        # API adjustment
        api_adjustment = 0
        if api_analysis and 'overall_relevance' in api_analysis:
            relevance_map = {
                'excellent': 10,
                'good': 5,
                'fair': 0,
                'poor': -10
            }
            api_adjustment = relevance_map.get(api_analysis['overall_relevance'], 0)
        
        # Calculate final score
        score = avg_coverage - drift_penalty + term_bonus + api_adjustment
        
        return max(0, min(100, score))
    
    def _generate_suggestions(self, topic_coverage: Dict[str, float],
                            missing_aspects: List[str],
                            topic_drift: List[Dict[str, Any]],
                            api_analysis: Dict[str, Any]) -> List[str]:
        """Generate relevance improvement suggestions."""
        suggestions = []
        
        # Based on topic coverage
        low_coverage_topics = [
            topic for topic, score in topic_coverage.items() 
            if score < 50
        ]
        if low_coverage_topics:
            suggestions.append(
                f"Expand coverage of: {', '.join(low_coverage_topics[:3])}"
            )
        
        # Based on missing aspects
        if missing_aspects:
            suggestions.append(
                f"Consider addressing: {', '.join(missing_aspects[:3])}"
            )
        
        # Based on topic drift
        if len(topic_drift) > 2:
            suggestions.append(
                "Several sections drift from the main topic. Consider refocusing or removing them"
            )
        
        # From API analysis
        if api_analysis and 'improvement_suggestions' in api_analysis:
            suggestions.extend(api_analysis['improvement_suggestions'][:2])
        
        # General suggestions
        if not suggestions:
            if all(score > 80 for score in topic_coverage.values()):
                suggestions.append("Good topic coverage! Consider adding more depth or examples")
            else:
                suggestions.append("Ensure all sections clearly relate to the main topic")
        
        return suggestions[:5]
    
    def _split_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs."""
        import re
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _parse_api_response(self, response: str) -> Dict[str, Any]:
        """Parse API response."""
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
            self.logger.error(f"Failed to parse API response: {e}")
            return {}