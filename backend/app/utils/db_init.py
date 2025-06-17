"""Database initialization script."""

import logging
from pathlib import Path
from app.config import settings
from app.utils.db_migrations import run_migrations

logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database directory and run migrations."""
    try:
        # Create data directory if it doesn't exist
        data_dir = settings.data_dir
        data_dir.mkdir(parents=True, exist_ok=True)
        
        # Run migrations
        if not run_migrations():
            logger.error("Database migrations failed")
            return False
        
        logger.info(f"Database initialized at {data_dir / 'analysis.db'}")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        return False 