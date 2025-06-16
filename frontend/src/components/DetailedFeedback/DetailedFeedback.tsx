import React from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTrendingUp,
  FiBookOpen,
  FiEdit3,
} from 'react-icons/fi';
import { AnalysisResult } from '../../types';

interface DetailedFeedbackProps {
  result: AnalysisResult;
}

const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ result }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <FiInfo className="w-5 h-5" />;
      case 'medium':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'high':
        return <FiAlertCircle className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FiBookOpen className="w-6 h-6 mr-2 text-primary-500" />
          Analysis Summary
        </h3>
        <p className="text-gray-700 leading-relaxed">{result.feedback_summary}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Word Count</p>
            <p className="text-2xl font-semibold text-gray-800">
              {result.word_count.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Sentences</p>
            <p className="text-2xl font-semibold text-gray-800">
              {result.sentence_count}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Avg. Sentence Length</p>
            <p className="text-2xl font-semibold text-gray-800">
              {result.avg_sentence_length.toFixed(1)} words
            </p>
          </div>
        </div>
      </motion.div>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiCheckCircle className="w-6 h-6 mr-2 text-green-500" />
            Strengths
          </h3>
          <ul className="space-y-3">
            {result.strengths.map((strength, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiTrendingUp className="w-6 h-6 mr-2 text-yellow-500" />
            Areas for Improvement
          </h3>
          <ul className="space-y-3">
            {result.areas_for_improvement.map((improvement, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{improvement}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Grammar Errors */}
      {result.grammar.errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FiEdit3 className="w-6 h-6 mr-2 text-primary-500" />
            Grammar & Style Issues
          </h3>
          <div className="space-y-3">
            {result.grammar.errors.slice(0, 5).map((error, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-4 rounded-lg border ${getSeverityColor(error.severity)}`}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">{getSeverityIcon(error.severity)}</div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">{error.message}</p>
                    {error.suggestion && (
                      <p className="text-sm opacity-90 mb-2">
                        <span className="font-medium">Suggestion:</span> {error.suggestion}
                      </p>
                    )}
                    <p className="text-xs opacity-75">
                      Position: {error.position[0]}-{error.position[1]}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {result.grammar.errors.length > 5 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                And {result.grammar.errors.length - 5} more issues...
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Coherence Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Coherence Analysis
        </h3>
        
        {/* Readability Scores */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Readability Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(result.coherence.readability_scores || {}).slice(0, 4).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Connections */}
        {result.coherence.weak_connections.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-3">Weak Connections</h4>
            <div className="space-y-2">
              {result.coherence.weak_connections.slice(0, 3).map((connection, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Weak transition between sentences {connection.sentence_index + 1} and {connection.sentence_index + 2}
                  </p>
                  {connection.suggestion && (
                    <p className="text-xs text-yellow-700 mt-1">
                      {connection.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Topic Relevance */}
      {Object.keys(result.relevance.topic_coverage).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Topic Relevance
          </h3>
          
          {/* Topic Coverage */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Topic Coverage</h4>
            <div className="space-y-2">
              {Object.entries(result.relevance.topic_coverage).map(([topic, coverage]) => (
                <div key={topic} className="flex items-center">
                  <span className="w-32 text-sm text-gray-600">{topic}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${coverage}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {coverage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Terms */}
          {result.relevance.key_terms_found.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-3">Key Terms Found</h4>
              <div className="flex flex-wrap gap-2">
                {result.relevance.key_terms_found.slice(0, 10).map((term, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DetailedFeedback;