import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiDownload, 
  FiShare2, 
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiBookOpen,
  FiEdit3,
  FiTarget,
  FiInfo
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { getAnalysisResult } from '../services/api';
import { AnalysisResult } from '../types';
import ExportOptions from '../components/ExportOptions/ExportOptions';

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'grammar' | 'coherence' | 'relevance'>('overview');
  const [showExportModal, setShowExportModal] = useState(false);

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBookOpen },
    { id: 'grammar', label: 'Grammar', icon: FiEdit3 },
    { id: 'coherence', label: 'Coherence', icon: FiTrendingUp },
    { id: 'relevance', label: 'Relevance', icon: FiTarget },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/history')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Back to History
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiDownload className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <FiShare2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="bg-gradient-to-br from-primary-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Analysis Details</h1>
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white bg-opacity-20 backdrop-blur rounded-full mb-6">
              <span className="text-5xl font-bold">{result.overall_score}</span>
            </div>
            <p className="text-xl opacity-90">Overall Score</p>
          </motion.div>

          {/* Sub-scores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto"
          >
            {[
              { label: 'Grammar', score: result.grammar.score },
              { label: 'Coherence', score: result.coherence.score },
              { label: 'Relevance', score: result.relevance.score },
            ].map((item, index) => (
              <div key={item.label} className="text-center">
                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                  <p className="text-3xl font-bold mb-1">{item.score.toFixed(0)}</p>
                  <p className="text-sm opacity-90">{item.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
               <tab.icon className="w-4 h-4 mr-2" />
               {tab.label}
             </button>
           ))}
         </div>
       </div>
     </div>

     {/* Content */}
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-6">
           {activeTab === 'overview' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
               {/* Summary Card */}
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-xl font-semibold text-gray-900 mb-4">
                   Analysis Summary
                 </h3>
                 <p className="text-gray-700 leading-relaxed">
                   {result.feedback_summary}
                 </p>
               </div>

               {/* Strengths & Improvements */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                   <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                     <FiCheckCircle className="w-5 h-5 mr-2 text-green-600" />
                     Strengths
                   </h4>
                   <ul className="space-y-2">
                     {result.strengths.map((strength, index) => (
                       <li key={index} className="flex items-start">
                         <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                         <span className="text-gray-700">{strength}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                   <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                     <FiTrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
                     Areas for Improvement
                   </h4>
                   <ul className="space-y-2">
                     {result.areas_for_improvement.map((improvement, index) => (
                       <li key={index} className="flex items-start">
                         <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                         <span className="text-gray-700">{improvement}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
             </motion.div>
           )}

           {activeTab === 'grammar' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-xl font-semibold text-gray-900 mb-4">
                   Grammar Analysis
                 </h3>
                 
                 <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">Grammar Score</span>
                     <span className="text-2xl font-bold text-gray-900">
                       {result.grammar.score.toFixed(0)}/100
                     </span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-3">
                     <motion.div
                       className="bg-gradient-to-r from-primary-500 to-purple-600 h-3 rounded-full"
                       initial={{ width: 0 }}
                       animate={{ width: `${result.grammar.score}%` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                     />
                   </div>
                 </div>

                 {result.grammar.errors.length > 0 && (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-3">
                       Issues Found ({result.grammar.errors.length})
                     </h4>
                     <div className="space-y-3">
                       {result.grammar.errors.slice(0, 5).map((error, index) => (
                         <div
                           key={index}
                           className={`p-4 rounded-lg border ${getSeverityColor(error.severity)}`}
                         >
                           <div className="flex items-start">
                             <div className="mr-3 mt-0.5">
                               {getSeverityIcon(error.severity)}
                             </div>
                             <div className="flex-1">
                               <p className="font-medium mb-1">{error.message}</p>
                               {error.suggestion && (
                                 <p className="text-sm opacity-90">
                                   <span className="font-medium">Suggestion:</span> {error.suggestion}
                                 </p>
                               )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             </motion.div>
           )}

           {activeTab === 'coherence' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-xl font-semibold text-gray-900 mb-4">
                   Coherence Analysis
                 </h3>
                 
                 <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">Coherence Score</span>
                     <span className="text-2xl font-bold text-gray-900">
                       {result.coherence.score.toFixed(0)}/100
                     </span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-3">
                     <motion.div
                       className="bg-gradient-to-r from-primary-500 to-purple-600 h-3 rounded-full"
                       initial={{ width: 0 }}
                       animate={{ width: `${result.coherence.score}%` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                     />
                   </div>
                 </div>

                 {result.coherence.readability_scores && (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-3">Readability Metrics</h4>
                     <div className="grid grid-cols-2 gap-3">
                       {Object.entries(result.coherence.readability_scores).slice(0, 4).map(([key, value]) => (
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
                 )}
               </div>
             </motion.div>
           )}

           {activeTab === 'relevance' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h3 className="text-xl font-semibold text-gray-900 mb-4">
                   Relevance Analysis
                 </h3>
                 
                 <div className="mb-6">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-600">Relevance Score</span>
                     <span className="text-2xl font-bold text-gray-900">
                       {result.relevance.score.toFixed(0)}/100
                     </span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-3">
                     <motion.div
                       className="bg-gradient-to-r from-primary-500 to-purple-600 h-3 rounded-full"
                       initial={{ width: 0 }}
                       animate={{ width: `${result.relevance.score}%` }}
                       transition={{ duration: 1, ease: "easeOut" }}
                     />
                   </div>
                 </div>

                 {result.relevance.key_terms_found.length > 0 && (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-3">Key Terms Found</h4>
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
               </div>
             </motion.div>
           )}
         </div>

         {/* Sidebar */}
         <div className="space-y-6">
           {/* Statistics Card */}
           <div className="bg-white rounded-xl shadow-lg p-6 sticky top-32">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">
               Text Statistics
             </h3>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-gray-600">Word Count</span>
                 <span className="font-medium text-gray-900">
                   {result.word_count.toLocaleString()}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Sentences</span>
                 <span className="font-medium text-gray-900">
                   {result.sentence_count}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Paragraphs</span>
                 <span className="font-medium text-gray-900">
                   {result.paragraph_count}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-600">Avg. Sentence Length</span>
                 <span className="font-medium text-gray-900">
                   {result.avg_sentence_length.toFixed(1)} words
                 </span>
               </div>
               <hr className="my-3" />
               <div className="flex justify-between">
                 <span className="text-gray-600">Analysis Date</span>
                 <span className="font-medium text-gray-900">
                   {new Date(result.timestamp).toLocaleDateString()}
                 </span>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Export Modal */}
     {showExportModal && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowExportModal(false)}>
         <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
           <ExportOptions result={result} />
         </div>
       </div>
     )}
   </div>
 );
};

export default AnalysisDetailsPage;