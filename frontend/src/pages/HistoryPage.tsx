import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, 
  FiTrash2, 
  FiSearch, 
  FiFilter,
  FiTrendingUp,
  FiFileText,
  FiCalendar,
  FiChevronRight
} from 'react-icons/fi';
import { getHistory, deleteHistoryItem } from '../services/api';
import { HistoryItem } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        await deleteHistoryItem(id);
        setHistoryItems(items => items.filter(item => item.id !== id));
        toast.success('Analysis deleted successfully');
      } catch (error) {
        toast.error('Failed to delete item');
        console.error('Delete error:', error);
      }
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const filteredItems = historyItems
    .filter(item => {
      const matchesSearch = item.text_preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.topic && item.topic.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterScore === 'all' ||
        (filterScore === 'high' && item.overall_score >= 80) ||
        (filterScore === 'medium' && item.overall_score >= 60 && item.overall_score < 80) ||
        (filterScore === 'low' && item.overall_score < 60);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return b.overall_score - a.overall_score;
      }
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const stats = {
    total: historyItems.length,
    avgScore: historyItems.length > 0 
      ? Math.round(historyItems.reduce((acc, item) => acc + item.overall_score, 0) / historyItems.length)
      : 0,
    highScoring: historyItems.filter(item => item.overall_score >= 80).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
            <p className="mt-2 text-lg text-gray-600">
              View and manage your previous text analyses
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-6 border border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Analyses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <FiFileText className="w-10 h-10 text-primary-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgScore}</p>
                </div>
                <FiTrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Scoring</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.highScoring}</p>
                </div>
                <FiClock className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search analyses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
              </select>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <FiFilter className="w-5 h-5 text-gray-600" />
              <select
                value={filterScore}
                onChange={(e) => setFilterScore(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* History List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl shadow-md"
          >
            <FiClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {searchTerm || filterScore !== 'all' ? 'No matching results' : 'No history yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterScore !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your analysis history will appear here'}
            </p>
            <button
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <FiFileText className="w-5 h-5 mr-2" />
              New Analysis
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleViewDetails(item.id)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center text-sm text-gray-500">
                            <FiCalendar className="w-4 h-4 mr-1" />
                            {new Date(item.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          {item.topic && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                              {item.topic}
                            </span>
                          )}
                        </div>

                        {/* Preview Text */}
                        <p className="text-gray-800 font-medium mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {item.text_preview}
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center">
                            <span className="text-gray-500">Words:</span>
                            <span className="ml-1 font-medium text-gray-700">
                              {item.word_count.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500">Score:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(item.overall_score)}`}>
                              {item.overall_score}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center ml-4 space-x-2">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getScoreGradient(item.overall_score)} flex items-center justify-center text-white font-bold text-xl`}>
                          {item.overall_score}
                        </div>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                        <div className="text-gray-400 group-hover:text-primary-600 transition-colors">
                          <FiChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getScoreGradient(item.overall_score)}`}
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
            <button className="px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors">
              Load More
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;