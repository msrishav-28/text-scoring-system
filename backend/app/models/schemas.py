"""Pydantic models for request/response schemas."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from enum import Enum

class ErrorType(str, Enum):
    """Types of grammar errors."""
    SPELLING = "spelling"
    GRAMMAR = "grammar"
    PUNCTUATION = "punctuation"
    STYLE = "style"
    CLARITY = "clarity"

class Severity(str, Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TextInput(BaseModel):
    """Input model for text analysis."""
    text: str = Field(..., min_length=10, max_length=50000)
    topic: Optional[str] = Field(None, description="Topic for relevance scoring")
    topics: Optional[List[str]] = Field(None, description="Multiple topics for relevance")
    custom_weights: Optional[Dict[str, float]] = Field(None, description="Custom scoring weights")
    
    @field_validator('text')
    def validate_text(cls, v):
        """Validate text input."""
        if not v.strip():
            raise ValueError("Text cannot be empty or only whitespace")
        return v.strip()

class BatchTextInput(BaseModel):
    """Input model for batch text analysis."""
    texts: List[TextInput] = Field(..., min_items=1, max_items=100)
    compare: bool = Field(False, description="Enable comparative analysis")

class Error(BaseModel):
    """Model for an error/issue found in text."""
    type: ErrorType
    severity: Severity
    position: List[int] = Field(..., min_items=2, max_items=2)
    message: str
    suggestion: Optional[str] = None
    explanation: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)

class GrammarScore(BaseModel):
    """Grammar analysis results."""
    score: float = Field(..., ge=0, le=100)
    errors: List[Error] = Field(default_factory=list)
    error_density: float = Field(..., ge=0)
    suggestions: List[str] = Field(default_factory=list)
    details: Dict[str, Any] = Field(default_factory=dict)

class CoherenceScore(BaseModel):
    """Coherence analysis results."""
    score: float = Field(..., ge=0, le=100)
    sentence_flow: List[float] = Field(default_factory=list)
    paragraph_transitions: List[Dict[str, Any]] = Field(default_factory=list)
    weak_connections: List[Dict[str, Any]] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    readability_scores: Dict[str, float] = Field(default_factory=dict)

class RelevanceScore(BaseModel):
    """Topic relevance analysis results."""
    score: float = Field(..., ge=0, le=100)
    topic_coverage: Dict[str, float] = Field(default_factory=dict)
    key_terms_found: List[str] = Field(default_factory=list)
    missing_aspects: List[str] = Field(default_factory=list)
    topic_drift: List[Dict[str, Any]] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)

class AnalysisResult(BaseModel):
    """Complete analysis result."""
    overall_score: float = Field(..., ge=0, le=100)
    grammar: GrammarScore
    coherence: CoherenceScore
    relevance: RelevanceScore
    word_count: int
    sentence_count: int
    paragraph_count: int
    avg_sentence_length: float
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)
    feedback_summary: str
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)

class BatchAnalysisResult(BaseModel):
    """Batch analysis results."""
    results: List[AnalysisResult]
    comparative_analysis: Optional[Dict[str, Any]] = None
    summary_statistics: Dict[str, Any]

class ExportRequest(BaseModel):
    """Export request model."""
    result_id: str
    format: str = Field("pdf", pattern="^(pdf|csv|json|docx)$")
    include_visualizations: bool = True
    include_detailed_feedback: bool = True

class ExportResponse(BaseModel):
    """Export response model."""
    file_path: str
    download_url: str
    file_size: int
    format: str

class WebSocketMessage(BaseModel):
    """WebSocket message model."""
    type: str = Field(..., pattern="^(analyze|progress|result|error)$")
    data: Dict[str, Any]
    
class HistoryItem(BaseModel):
    """Analysis history item."""
    id: str
    timestamp: datetime
    text_preview: str = Field(..., max_length=100)
    overall_score: float
    word_count: int
    topic: Optional[str] = None