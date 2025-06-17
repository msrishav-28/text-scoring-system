import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { getAnalysisResult } from '../services/api';
import { AnalysisResult } from '../types';
import DetailedFeedback from '../components/DetailedFeedback/DetailedFeedback';
import ExportOptions from '../components/ExportOptions/ExportOptions';

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisResult();
  }, [id]);

  const loadAnalysisResult = async () => {
    if (!id) return;

    try {
      const data = await getAnalysisResult(id);
      setResult(data);
    } catch (error) {
      console.error('Failed to load analysis result:', error);
      toast.error('Failed to load analysis result');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Analysis result not found</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Return to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/history')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to History
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Analysis Details</h1>
          <p className="text-xl text-gray-600 mt-2">
            Detailed results from your text analysis
          </p>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <DetailedFeedback result={result} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ExportOptions result={result} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetailsPage; 