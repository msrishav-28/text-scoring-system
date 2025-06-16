import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextInput from '../components/TextInput/TextInput';
import ScoreDisplay from '../components/ScoreDisplay/ScoreDisplay';
import DetailedFeedback from '../components/DetailedFeedback/DetailedFeedback';
import ExportOptions from '../components/ExportOptions/ExportOptions';
import { analyzeText } from '../services/api';
import { AnalysisResult } from '../types';
import toast from 'react-hot-toast';

const AnalysisPage: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'scores' | 'feedback' | 'export'>('scores');

  const handleAnalyze = async (text: string, topic?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeText(text, topic);
      setAnalysisResult(result);
      toast.success('Analysis completed successfully!');
    } catch (error) {
      toast.error('Failed to analyze text. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'scores', label: 'Scores', icon: '📊' },
    { id: 'feedback', label: 'Detailed Feedback', icon: '💡' },
    { id: 'export', label: 'Export', icon: '📥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Text Analysis</h1>
          <p className="text-xl text-gray-600">
            Get comprehensive insights about your writing
          </p>
        </motion.div>

        {/* Text Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <TextInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Tabs */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg shadow-md p-1 flex space-x-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'bg-primary-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'scores' && (
                  <motion.div
                    key="scores"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ScoreDisplay
                      scores={{
                        overall: analysisResult.overall_score,
                        grammar: analysisResult.grammar.score,
                        coherence: analysisResult.coherence.score,
                        relevance: analysisResult.relevance.score,
                      }}
                    />
                  </motion.div>
                )}

                {activeTab === 'feedback' && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DetailedFeedback result={analysisResult} />
                  </motion.div>
                )}

                {activeTab === 'export' && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExportOptions result={analysisResult} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!analysisResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No analysis yet
            </h3>
            <p className="text-gray-500">
              Enter your text above to get started
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Analyzing your text...
            </h3>
            <p className="text-gray-500">
              This may take a few moments
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;