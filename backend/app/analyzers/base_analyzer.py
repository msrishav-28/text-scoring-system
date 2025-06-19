"""Base analyzer class for all text analyzers."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import time
import logging
import re
from app.config import settings

logger = logging.getLogger(__name__)

class BaseAnalyzer(ABC):
    """Abstract base class for text analyzers."""
    
    def __init__(self, name: str):
        """Initialize the analyzer.
        
        Args:
            name: Name of the analyzer
        """
        self.name = name
        self.logger = logging.getLogger(f"{__name__}.{name}")
        
    @abstractmethod
    async def analyze(self, text: str, **kwargs) -> Dict[str, Any]:
        """Analyze the text and return results.
        
        Args:
            text: Text to analyze
            **kwargs: Additional parameters
            
        Returns:
            Dictionary containing analysis results
        """
        pass
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text before analysis.
        
        Args:
            text: Raw text input
            
        Returns:
            Preprocessed text
        """
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove zero-width characters
        text = text.replace('\u200b', '').replace('\u200c', '').replace('\u200d', '')
        
        # Normalize quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        return text.strip()
    
    def measure_time(self, func):
        """Decorator to measure execution time."""
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            
            self.logger.info(
                f"{self.name} analysis completed in {end_time - start_time:.2f} seconds"
            )
            
            if isinstance(result, dict):
                result['processing_time'] = end_time - start_time
                
            return result
        return wrapper
    
    def validate_text_length(self, text: str) -> bool:
        """Validate if text length is within acceptable range.
        
        Args:
            text: Text to validate
            
        Returns:
            True if valid, False otherwise
        """
        text_length = len(text)
        return settings.min_text_length <= text_length <= settings.max_text_length
    
    def get_text_statistics(self, text: str) -> Dict[str, Any]:
        """Get basic statistics about the text.
    
        Args:
            text: Text to analyze
        
        Returns:
            Dictionary with text statistics
        """
        sentences = self._split_sentences(text)
        paragraphs = text.split('\n\n')
    
        # Improved word counting - matches common word counting tools
        # This regex finds all word characters, including contractions
        words = re.findall(r"\b\w+(?:'\w+)?\b", text)
    
        return {
            'word_count': len(words),
            'sentence_count': len(sentences),
            'paragraph_count': len([p for p in paragraphs if p.strip()]),
            'avg_sentence_length': len(words) / len(sentences) if sentences else 0,
            'avg_paragraph_length': len(sentences) / len([p for p in paragraphs if p.strip()]) if paragraphs else 0
        }
    
    def _split_sentences(self, text: str) -> list:
        """Split text into sentences.
        
        Args:
            text: Text to split
            
        Returns:
            List of sentences
        """
        # Simple sentence splitting - can be improved with spaCy
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def calculate_confidence(self, score: float, factors: Dict[str, float]) -> float:
        """Calculate confidence level for the analysis.
        
        Args:
            score: The calculated score
            factors: Dictionary of factors affecting confidence
            
        Returns:
            Confidence level between 0 and 1
        """
        # Base confidence on score deviation from average
        base_confidence = 1.0 - abs(score - 50) / 50
        
        # Adjust based on factors
        confidence = base_confidence
        for factor, weight in factors.items():
            confidence *= weight
            
        return max(0.0, min(1.0, confidence))