"""Main FastAPI application."""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import logging
import sys
from pathlib import Path
import uuid
from typing import List, Dict, Any
import json

from app.config import settings
from app.models.schemas import (
    TextInput, BatchTextInput, AnalysisResult, 
    ExportRequest, ExportResponse, HistoryItem
)
from app.analyzers.grammar_analyzer import GrammarAnalyzer
from app.analyzers.coherence_analyzer import CoherenceAnalyzer
from app.analyzers.relevance_analyzer import RelevanceAnalyzer
from app.services.export_service import ExportService
from app.services.cache_service import CacheService
from app.utils.text_preprocessor import TextPreprocessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Text Scoring System",
    description="Advanced text analysis system with grammar, coherence, and relevance scoring",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
grammar_analyzer = GrammarAnalyzer()
coherence_analyzer = CoherenceAnalyzer()
relevance_analyzer = RelevanceAnalyzer()
export_service = ExportService()
cache_service = CacheService()
text_preprocessor = TextPreprocessor()

# Store for analysis history (in production, use a database)
analysis_history: Dict[str, AnalysisResult] = {}

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting Text Scoring System...")
    
    # Create necessary directories
    settings.cache_dir.mkdir(exist_ok=True)
    settings.export_dir.mkdir(exist_ok=True)
    
    # Initialize NLTK data
    import nltk
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    
    logger.info("Text Scoring System started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down Text Scoring System...")
    await cache_service.cleanup()

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Text Scoring System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "grammar_analyzer": "ready",
            "coherence_analyzer": "ready",
            "relevance_analyzer": "ready",
            "cache": "ready" if settings.cache_enabled else "disabled"
        }
    }

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_text(input_data: TextInput):
    """Analyze a single text."""
    try:
        # Check cache first
        cache_key = cache_service.generate_key(input_data.text, input_data.topic)
        cached_result = await cache_service.get(cache_key)
        
        if cached_result:
            logger.info("Returning cached result")
            return cached_result
        
        # Preprocess text
        processed_text = text_preprocessor.process(input_data.text)
        
        # Run analyses in parallel
        import asyncio
        grammar_task = grammar_analyzer.analyze(processed_text)
        coherence_task = coherence_analyzer.analyze(processed_text)
        relevance_task = relevance_analyzer.analyze(
            processed_text, 
            topic=input_data.topic,
            topics=input_data.topics
        )
        
        grammar_score, coherence_score, relevance_score = await asyncio.gather(
            grammar_task, coherence_task, relevance_task
        )
        
        # Get text statistics
        stats = grammar_analyzer.get_text_statistics(processed_text)
        
        # Calculate overall score
        weights = {
            'grammar': settings.grammar_weight,
            'coherence': settings.coherence_weight,
            'relevance': settings.relevance_weight
        }
        
        # Apply custom weights if provided
        if input_data.custom_weights:
            weights.update(input_data.custom_weights)
            # Normalize weights
            total = sum(weights.values())
            weights = {k: v/total for k, v in weights.items()}
        
        overall_score = (
            grammar_score.score * weights['grammar'] +
            coherence_score.score * weights['coherence'] +
            relevance_score.score * weights['relevance']
        )
        
        # Generate feedback summary
        feedback_summary = _generate_feedback_summary(
            overall_score, grammar_score, coherence_score, relevance_score
        )
        
        # Identify strengths and areas for improvement
        strengths = _identify_strengths(grammar_score, coherence_score, relevance_score)
        improvements = _identify_improvements(grammar_score, coherence_score, relevance_score)
        
        # Create result
        result = AnalysisResult(
            overall_score=round(overall_score, 2),
            grammar=grammar_score,
            coherence=coherence_score,
            relevance=relevance_score,
            word_count=stats['word_count'],
            sentence_count=stats['sentence_count'],
            paragraph_count=stats['paragraph_count'],
            avg_sentence_length=round(stats['avg_sentence_length'], 2),
            processing_time=sum([
                getattr(grammar_score, 'processing_time', 0),
                getattr(coherence_score, 'processing_time', 0),
                getattr(relevance_score, 'processing_time', 0)
            ]),
            feedback_summary=feedback_summary,
            strengths=strengths,
            areas_for_improvement=improvements
        )
        
        # Cache result
        await cache_service.set(cache_key, result)
        
        # Store in history
        result_id = str(uuid.uuid4())
        analysis_history[result_id] = result
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/batch")
async def analyze_batch(input_data: BatchTextInput):
    """Analyze multiple texts."""
    try:
        results = []
        
        for text_input in input_data.texts:
            result = await analyze_text(text_input)
            results.append(result)
        
        # Comparative analysis if requested
        comparative_analysis = None
        if input_data.compare and len(results) > 1:
            comparative_analysis = _perform_comparative_analysis(results)
        
        # Summary statistics
        summary_stats = _calculate_summary_statistics(results)
        
        return {
            "results": results,
            "comparative_analysis": comparative_analysis,
            "summary_statistics": summary_stats
        }
        
    except Exception as e:
        logger.error(f"Batch analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/file")
async def analyze_file(
    file: UploadFile = File(...),
    topic: str = None,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Analyze text from uploaded file."""
    try:
        # Validate file
        if not file.filename.endswith(tuple(settings.allowed_extensions)):
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed types: {settings.allowed_extensions}"
            )
        
        # Check file size
        contents = await file.read()
        if len(contents) > settings.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024}MB"
            )
        
        # Extract text based on file type
        text = await text_preprocessor.extract_text_from_file(
            contents, 
            file.filename
        )
        
        # Create input and analyze
        text_input = TextInput(text=text, topic=topic)
        result = await analyze_text(text_input)
        
        return result
        
    except Exception as e:
        logger.error(f"File analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export", response_model=ExportResponse)
async def export_analysis(export_request: ExportRequest):
    """Export analysis results."""
    try:
        # Get result from history
        if export_request.result_id not in analysis_history:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        
        result = analysis_history[export_request.result_id]
        
        # Generate export
        file_path = await export_service.export_result(
            result,
            export_request.format,
            export_request.include_visualizations,
            export_request.include_detailed_feedback
        )
        
        # Generate download URL (in production, use proper file serving)
        download_url = f"/download/{file_path.name}"
        
        return ExportResponse(
            file_path=str(file_path),
            download_url=download_url,
            file_size=file_path.stat().st_size,
            format=export_request.format
        )
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download exported file."""
    file_path = settings.export_dir / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@app.get("/history", response_model=List[HistoryItem])
async def get_history(limit: int = 10):
    """Get analysis history."""
    # Convert history to list of HistoryItems
    history_items = []
    
    for result_id, result in list(analysis_history.items())[-limit:]:
        # Get text preview (first 100 characters)
        # Note: In production, store original text separately
        text_preview = "Text analysis result"
        
        history_items.append(HistoryItem(
            id=result_id,
            timestamp=result.timestamp,
            text_preview=text_preview,
            overall_score=result.overall_score,
            word_count=result.word_count,
            topic=None  # Would need to store this separately
        ))
    
    return history_items

@app.delete("/history/{result_id}")
async def delete_history_item(result_id: str):
    """Delete a history item."""
    if result_id not in analysis_history:
        raise HTTPException(status_code=404, detail="Result not found")
    
    del analysis_history[result_id]
    return {"message": "Deleted successfully"}

# Helper functions
def _generate_feedback_summary(overall_score: float, grammar, coherence, relevance) -> str:
    """Generate a summary of the analysis."""
    if overall_score >= 90:
        level = "excellent"
    elif overall_score >= 80:
        level = "very good"
    elif overall_score >= 70:
        level = "good"
    elif overall_score >= 60:
        level = "fair"
    else:
        level = "needs improvement"
    
    summary = f"Your text scores {overall_score:.1f}/100, which is {level}. "
    
    # Add specific feedback
    scores = {
        "grammar": grammar.score,
        "coherence": coherence.score,
        "relevance": relevance.score
    }
    
    weakest = min(scores.items(), key=lambda x: x[1])
    strongest = max(scores.items(), key=lambda x: x[1])
    
    if strongest[1] - weakest[1] > 20:
        summary += f"Your {strongest[0]} is particularly strong, "
        summary += f"but focus on improving {weakest[0]}."
    else:
        summary += "The text is well-balanced across all criteria."
    
    return summary

def _identify_strengths(grammar, coherence, relevance) -> List[str]:
    """Identify strengths in the text."""
    strengths = []
    
    if grammar.score >= 85:
        strengths.append("Strong grammar and spelling")
    if coherence.score >= 85:
        strengths.append("Excellent flow and organization")
    if relevance.score >= 85:
        strengths.append("Highly relevant to the topic")
    
    # Add specific strengths
    if hasattr(grammar, 'details'):
        if grammar.details.get('vocabulary_level', {}).get('lexical_diversity', 0) > 0.7:
            strengths.append("Rich vocabulary")
    
    return strengths[:3]

def _identify_improvements(grammar, coherence, relevance) -> List[str]:
    """Identify areas for improvement."""
    improvements = []
    
    # Combine suggestions from all analyzers
    all_suggestions = []
    all_suggestions.extend(grammar.suggestions)
    all_suggestions.extend(coherence.suggestions)
    all_suggestions.extend(relevance.suggestions)
    
    # Remove duplicates and limit
    seen = set()
    for suggestion in all_suggestions:
        if suggestion not in seen:
            improvements.append(suggestion)
            seen.add(suggestion)
            if len(improvements) >= 3:
                break
    
    return improvements

def _perform_comparative_analysis(results: List[AnalysisResult]) -> Dict[str, Any]:
    """Perform comparative analysis on multiple results."""
    scores = {
        'overall': [r.overall_score for r in results],
        'grammar': [r.grammar.score for r in results],
        'coherence': [r.coherence.score for r in results],
        'relevance': [r.relevance.score for r in results]
    }
    
    return {
        'average_scores': {k: sum(v)/len(v) for k, v in scores.items()},
        'best_text_index': scores['overall'].index(max(scores['overall'])),
        'consistency': {
            k: max(v) - min(v) < 20 for k, v in scores.items()
        }
    }

def _calculate_summary_statistics(results: List[AnalysisResult]) -> Dict[str, Any]:
    """Calculate summary statistics for batch results."""
    return {
        'total_texts': len(results),
        'average_score': sum(r.overall_score for r in results) / len(results),
        'total_words': sum(r.word_count for r in results),
        'average_words': sum(r.word_count for r in results) / len(results)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)