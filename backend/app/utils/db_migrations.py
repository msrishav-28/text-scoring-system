"""Database migration utilities."""

import logging
import sqlite3
from pathlib import Path
from typing import List, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

class DatabaseMigration:
    """Handle database migrations."""
    
    def __init__(self):
        """Initialize migration handler."""
        self.db_path = settings.data_dir / "analysis.db"
        self.migrations: List[Tuple[int, str]] = [
            # Add new migrations here with version number and SQL
            (1, '''
                CREATE TABLE IF NOT EXISTS analysis_results (
                    id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    topic TEXT,
                    result_data TEXT NOT NULL,
                    timestamp DATETIME NOT NULL
                )
            '''),
            (2, '''
                CREATE INDEX IF NOT EXISTS idx_analysis_timestamp 
                ON analysis_results(timestamp)
            '''),
            (3, '''
                CREATE INDEX IF NOT EXISTS idx_analysis_topic 
                ON analysis_results(topic)
            ''')
        ]
    
    def get_current_version(self) -> int:
        """Get current database version."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Create version table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS db_version (
                    version INTEGER PRIMARY KEY
                )
            ''')
            
            # Get current version
            cursor.execute('SELECT version FROM db_version')
            row = cursor.fetchone()
            
            conn.close()
            return row[0] if row else 0
            
        except Exception as e:
            logger.error(f"Error getting database version: {e}")
            return 0
    
    def set_version(self, version: int):
        """Set database version."""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Update version
            cursor.execute('DELETE FROM db_version')
            cursor.execute('INSERT INTO db_version (version) VALUES (?)', (version,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error setting database version: {e}")
            raise
    
    def run_migrations(self) -> bool:
        """Run pending database migrations."""
        try:
            current_version = self.get_current_version()
            pending_migrations = [
                m for m in self.migrations if m[0] > current_version
            ]
            
            if not pending_migrations:
                logger.info("No pending migrations")
                return True
            
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            for version, sql in pending_migrations:
                logger.info(f"Running migration {version}")
                cursor.executescript(sql)
                self.set_version(version)
            
            conn.commit()
            conn.close()
            
            logger.info("Migrations completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Migration error: {e}")
            return False

def run_migrations():
    """Run database migrations."""
    migrator = DatabaseMigration()
    return migrator.run_migrations() 