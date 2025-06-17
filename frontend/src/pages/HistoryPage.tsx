import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiTrash2, FiSearch } from 'react-icons/fi';
import { getHistory, deleteHistoryItem } from '../services/api';
import { HistoryItem } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const items = await getHistory(20);
      setHistoryItems(items);
    } catch (error) {
      toast.error('Failed to load history');
      console.error('History fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setHistoryItems(items => items.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Delete error:', error);
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const filteredItems = historyItems.filter(item =>
    item.text_preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis History</h1>
          <p className="text-xl text-gray-600">
            View and manage your previous text analyses
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
            />
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </motion.div>

        {/* History Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {searchTerm ? 'No matching results' : 'No history yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try a different search term'
                : 'Your analysis history will appear here'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <FiClock className="w-4 h-4 mr-1" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        {item.topic && (
                          <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm mb-3">
                            {item.topic}
                          </span>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </motion.button>
                    </div>

                    {/* Preview */}
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {item.text_preview}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{item.word_count}</span> words
                        </div>
                        <div className={`text-sm font-semibold ${getScoreColor(item.overall_score)}`}>
                          Score: {item.overall_score}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(item.id)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details →
                      </motion.button>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="h-2 bg-gray-200">
                    <motion.div
                      className={`h-full ${
                        item.overall_score >= 80
                          ? 'bg-green-500'
                          : item.overall_score >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.overall_score}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More */}
        {filteredItems.length >= 20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <button className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition">
              Load More
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;