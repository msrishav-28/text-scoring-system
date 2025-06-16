"""Configuration settings for the Text Scoring System."""

import os
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    """Application settings."""
    
    # API Keys
    gemini_api_key: str = ""
    groq_api_key: str = ""
    huggingface_api_key: str = ""
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS
    frontend_url: str = "http://localhost:3000"
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Cache Configuration
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour
    cache_dir: Path = Path("cache")
    
    # API Rate Limits
    gemini_rate_limit: int = 60
    api_timeout: int = 30
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: List[str] = [".txt", ".pdf", ".docx", ".doc"]
    
    # Export Configuration
    export_dir: Path = Path("exports")
    
    # Model Configuration
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    spacy_model: str = "en_core_web_sm"
    
    # Scoring Weights (customizable)
    grammar_weight: float = 0.4
    coherence_weight: float = 0.3
    relevance_weight: float = 0.3
    
    # Analysis Configuration
    min_text_length: int = 50
    max_text_length: int = 50000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @field_validator("cache_dir", "export_dir")
    def create_directories(cls, v):
        """Create directories if they don't exist."""
        v.mkdir(exist_ok=True)
        return v
    
    def get_total_weight(self) -> float:
        """Get total scoring weight."""
        return self.grammar_weight + self.coherence_weight + self.relevance_weight
    
    def normalize_weights(self):
        """Normalize weights to sum to 1.0."""
        total = self.get_total_weight()
        if total > 0:
            self.grammar_weight /= total
            self.coherence_weight /= total
            self.relevance_weight /= total

# Create global settings instance
settings = Settings()
settings.normalize_weights()