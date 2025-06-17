"""Service for interacting with Google Gemini API."""

import google.generativeai as genai
from typing import Dict, Any, Optional
import asyncio
import time
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for Gemini API interactions."""
    
    def __init__(self):
        """Initialize Gemini service."""
        if not settings.gemini_api_key:
            raise ValueError("Gemini API key not configured")
        
        # Configure the API
        genai.configure(api_key=settings.gemini_api_key)
        
        # Initialize the model
        self.model = genai.GenerativeModel(settings.gemini_model)
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 60 / settings.gemini_rate_limit  # seconds between requests
        
        self.logger = logger
    
    async def analyze_text(self, prompt: str, temperature: float = 0.3) -> str:
        """Send a text analysis request to Gemini.
        
        Args:
            prompt: The prompt to send
            temperature: Temperature for response generation
            
        Returns:
            The model's response as a string
        """
        # Rate limiting
        await self._enforce_rate_limit()
        
        try:
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=1000,
                    )
                )
            )
            
            # Update last request time
            self.last_request_time = time.time()
            
            return response.text
            
        except Exception as e:
            self.logger.error(f"Gemini API error: {e}")
            raise Exception(f"Failed to get response from Gemini: {str(e)}")
    
    async def analyze_with_retry(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """Analyze text with retry logic.
        
        Args:
            prompt: The prompt to send
            max_retries: Maximum number of retries
            
        Returns:
            The model's response or None if all retries fail
        """
        for attempt in range(max_retries):
            try:
                return await self.analyze_text(prompt)
            except Exception as e:
                if attempt == max_retries - 1:
                    self.logger.error(f"All retries failed: {e}")
                    return None
                
                # Exponential backoff
                wait_time = (2 ** attempt) * 1
                self.logger.warning(f"Retry {attempt + 1} after {wait_time}s due to: {e}")
                await asyncio.sleep(wait_time)
        
        return None
    
    async def _enforce_rate_limit(self):
        """Enforce rate limiting between requests."""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.min_request_interval:
            wait_time = self.min_request_interval - time_since_last_request
            await asyncio.sleep(wait_time)
    
    def create_grammar_prompt(self, text: str) -> str:
        """Create a prompt for grammar analysis.
        
        Args:
            text: Text to analyze
            
        Returns:
            Formatted prompt
        """
        return f"""Analyze the following text for grammar, spelling, and style issues.
        Focus on significant errors that affect clarity and professionalism.
        
        Return your findings as a JSON array of errors:
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
        
        If no significant errors are found, return an empty array [].
        
        Text to analyze:
        {text}
        """
    
    def create_coherence_prompt(self, text: str) -> str:
        """Create a prompt for coherence analysis.
        
        Args:
            text: Text to analyze
            
        Returns:
            Formatted prompt
        """
        return f"""Analyze the coherence and flow of the following text.
        
        Evaluate:
        1. Logical flow between sentences and paragraphs
        2. Use of transitions and connecting phrases
        3. Consistency of ideas and arguments
        4. Overall organization and structure
        
        Return your analysis as JSON:
        {{
            "overall_coherence": "excellent|good|fair|poor",
            "main_issues": ["issue1", "issue2"],
            "strengths": ["strength1", "strength2"],
            "specific_improvements": ["improvement1", "improvement2"],
            "problematic_sections": [
                {{
                    "location": "paragraph X" or "sentences X-Y",
                    "issue": "description of the problem",
                    "suggestion": "how to improve"
                }}
            ]
        }}
        
        Text to analyze:
        {text}
        """
    
    def create_relevance_prompt(self, text: str, topics: str) -> str:
        """Create a prompt for relevance analysis.
        
        Args:
            text: Text to analyze
            topics: Topic(s) to check relevance against
            
        Returns:
            Formatted prompt
        """
        return f"""Analyze how well the following text addresses the topic(s): {topics}
        
        Evaluate:
        1. Coverage of key aspects of the topic
        2. Depth of treatment
        3. Relevance of examples and supporting details
        4. Any off-topic sections or digressions
        
        Return your analysis as JSON:
        {{
            "overall_relevance": "excellent|good|fair|poor",
            "relevance_percentage": 85,
            "well_covered_aspects": ["aspect1", "aspect2"],
            "missing_aspects": ["aspect1", "aspect2"],
            "off_topic_sections": ["description1"],
            "improvement_suggestions": ["suggestion1", "suggestion2"],
            "key_insights": ["insight1", "insight2"]
        }}
        
        Text to analyze:
        {text}
        """