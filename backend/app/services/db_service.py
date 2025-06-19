"""Database service for storing analysis results."""

import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
import json
from datetime import datetime
import logging

from app.config import settings
from app.models.schemas import AnalysisResult, HistoryItem

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for database operations."""
    
    def __init__(self):
        """Initialize database service."""
        self.db_path = settings.data_dir / "analysis.db"
        self._init_db()
    
    def _init_db(self):
        """Initialize database tables."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Create analysis_results table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_results (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                topic TEXT,
                result_data TEXT NOT NULL,
                timestamp DATETIME NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def store_result(self, result_id: str, text: str, topic: Optional[str], result: AnalysisResult) -> bool:
        """Store analysis result in database.
        
        Args:
            result_id: Unique identifier for the result
            text: Original text that was analyzed
            topic: Optional topic
            result: Analysis result to store
            
        Returns:
            True if successful
        """
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                '''
                INSERT INTO analysis_results (id, text, topic, result_data, timestamp)
                VALUES (?, ?, ?, ?, ?)
                ''',
                (
                    result_id,
                    text,
                    topic,
                    result.model_dump_json(),
                    datetime.now().isoformat()
                )
            )
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Database store error: {e}")
            return False
    
    def get_result(self, result_id: str) -> Optional[AnalysisResult]:
        """Get analysis result from database.
        
        Args:
            result_id: Result identifier
            
        Returns:
            AnalysisResult if found, None otherwise
        """
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                'SELECT result_data FROM analysis_results WHERE id = ?',
                (result_id,)
            )
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                result_data = json.loads(row[0])
                # Ensure id field exists
                if 'id' not in result_data:
                    result_data['id'] = result_id
                if 'result_id' not in result_data:
                    result_data['result_id'] = result_id
                return AnalysisResult(**result_data)
            return None
            
        except Exception as e:
            logger.error(f"Database get error: {e}")
            return None
    
    def get_history(self, limit: int = 10) -> List[HistoryItem]:
        """Get analysis history.
        
        Args:
            limit: Maximum number of results to return
            
        Returns:
            List of HistoryItem objects
        """
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                '''
                SELECT id, text, topic, result_data, timestamp
                FROM analysis_results
                ORDER BY timestamp DESC
                LIMIT ?
                ''',
                (limit,)
            )
            
            rows = cursor.fetchall()
            conn.close()
            
            history_items = []
            for row in rows:
                result_data = json.loads(row[3])
                history_items.append(HistoryItem(
                    id=row[0],
                    timestamp=datetime.fromisoformat(row[4]),
                    text_preview=row[1][:100],  # First 100 characters
                    overall_score=result_data['overall_score'],
                    word_count=result_data['word_count'],
                    topic=row[2]
                ))
            
            return history_items
            
        except Exception as e:
            logger.error(f"Database history error: {e}")
            return []
    
    def delete_result(self, result_id: str) -> bool:
        """Delete analysis result.
        
        Args:
            result_id: Result identifier
            
        Returns:
            True if successful
        """
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                'DELETE FROM analysis_results WHERE id = ?',
                (result_id,)
            )
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Database delete error: {e}")
            return False