"""Cache service for storing analysis results."""

import hashlib
import json
import time
from typing import Any, Optional
from pathlib import Path
import diskcache
import logging

from app.config import settings
from app.models.schemas import AnalysisResult

logger = logging.getLogger(__name__)

class CacheService:
    """Service for caching analysis results."""
    
    def __init__(self):
        """Initialize cache service."""
        self.enabled = settings.cache_enabled
        
        if self.enabled:
            # Initialize disk cache
            cache_path = settings.cache_dir / "analysis_cache"
            self.cache = diskcache.Cache(
                str(cache_path),
                size_limit=1e9,  # 1GB size limit
                eviction_policy='least-recently-used'
            )
            logger.info(f"Cache initialized at {cache_path}")
        else:
            self.cache = None
            logger.info("Cache disabled")
    
    def generate_key(self, text: str, topic: Optional[str] = None) -> str:
        """Generate cache key from text and topic.
        
        Args:
            text: Text content
            topic: Optional topic
            
        Returns:
            Cache key string
        """
        # Create a unique key based on text content and topic
        content = f"{text}:{topic if topic else ''}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[AnalysisResult]:
        """Get result from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached result or None
        """
        if not self.enabled or not self.cache:
            return None
        
        try:
            cached_data = self.cache.get(key)
            if cached_data:
                # Check if cache is still valid
                if self._is_cache_valid(cached_data):
                    logger.info(f"Cache hit for key: {key[:8]}...")
                    return AnalysisResult(**cached_data['result'])
                else:
                    # Remove expired cache
                    await self.delete(key)
                    
        except Exception as e:
            logger.error(f"Cache get error: {e}")
        
        return None
    
    async def set(self, key: str, result: AnalysisResult) -> bool:
        """Store result in cache.
        
        Args:
            key: Cache key
            result: Analysis result to cache
            
        Returns:
            True if successful
        """
        if not self.enabled or not self.cache:
            return False
        
        try:
            cache_data = {
                'result': result.dict(),
                'timestamp': time.time(),
                'version': '1.0.0'
            }
            
            self.cache.set(
                key, 
                cache_data,
                expire=settings.cache_ttl
            )
            
            logger.info(f"Cached result for key: {key[:8]}...")
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete item from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful
        """
        if not self.enabled or not self.cache:
            return False
        
        try:
            return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all cache entries.
        
        Returns:
            True if successful
        """
        if not self.enabled or not self.cache:
            return False
        
        try:
            self.cache.clear()
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        if not self.enabled or not self.cache:
            return {'enabled': False}
        
        return {
            'enabled': True,
            'size': len(self.cache),
            'size_bytes': self.cache.volume(),
            'hits': self.cache.stats(enable=True)['hits'],
            'misses': self.cache.stats(enable=True)['misses'],
            'hit_rate': self._calculate_hit_rate()
        }
    
    async def cleanup(self):
        """Cleanup expired cache entries."""
        if not self.enabled or not self.cache:
            return
        
        try:
            # Disk cache handles expiration automatically
            # This is called on shutdown
            self.cache.close()
            logger.info("Cache cleanup completed")
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
    
    def _is_cache_valid(self, cached_data: Dict[str, Any]) -> bool:
        """Check if cached data is still valid.
        
        Args:
            cached_data: Cached data dictionary
            
        Returns:
            True if valid
        """
        # Check version compatibility
        if cached_data.get('version') != '1.0.0':
            return False
        
        # Check timestamp (handled by disk cache expiration)
        return True
    
    def _calculate_hit_rate(self) -> float:
        """Calculate cache hit rate.
        
        Returns:
            Hit rate percentage
        """
        if not self.cache:
            return 0.0
        
        stats = self.cache.stats(enable=True)
        total = stats['hits'] + stats['misses']
        
        if total == 0:
            return 0.0
        
        return (stats['hits'] / total) * 100