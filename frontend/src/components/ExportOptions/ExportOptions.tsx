import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDownload,
  FiFileText,
  FiFile,
  FiBarChart2,
  FiCheck,
  FiX,
  FiSettings,
  FiShare2,
  FiMail,
  FiPrinter,
  FiCopy
} from 'react-icons/fi';

interface ExportOptionsProps {
  result: {
    overall_score: number;
    word_count: number;
    result_id: string;
    timestamp: string;
  };
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ result }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json' | 'docx'>('pdf');
  const [includeVisualizations, setIncludeVisualizations] = useState(true);
  const [includeDetailedFeedback, setIncludeDetailedFeedback] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional report with charts',
      icon: FiFileText,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      id: 'docx',
      name: 'Word Document',
      description: 'Editable document format',
      icon: FiFile,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Raw data for analysis',
      icon: FiBarChart2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'json',
      name: 'JSON Format',
      description: 'Developer-friendly format',
      icon: FiFile,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 2000);
  };

  const handleShare = (method: string) => {
    console.log(`Sharing via ${method}`);
    setShowShareModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Export Your Analysis</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShareModal(true)}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <FiShare2 className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Format Selection Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {formats.map((format) => (
            <motion.button
              key={format.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFormat(format.id as any)}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedFormat === format.id
                  ? `${format.borderColor} ${format.bgColor}`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {selectedFormat === format.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${format.color} flex items-center justify-center`}>
                    <FiCheck className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              )}
              
              <div className="flex items-start">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${format.color} flex items-center justify-center mr-3 flex-shrink-0`}>
                  <format.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">{format.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Export Options */}
        <AnimatePresence>
          {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FiSettings className="w-5 h-5 mr-2" />
                  Export Settings
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <span className="text-gray-700 group-hover:text-gray-900">Include visualizations</span>
                      <p className="text-xs text-gray-500">Add charts and graphs to the report</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={includeVisualizations}
                        onChange={(e) => setIncludeVisualizations(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        includeVisualizations ? 'bg-primary-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          includeVisualizations ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <span className="text-gray-700 group-hover:text-gray-900">Detailed feedback</span>
                      <p className="text-xs text-gray-500">Include all suggestions and improvements</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={includeDetailedFeedback}
                        onChange={(e) => setIncludeDetailedFeedback(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        includeDetailedFeedback ? 'bg-primary-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          includeDetailedFeedback ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Summary */}
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Export Preview</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Overall Score</span>
              <span className="font-medium text-gray-900">{result.overall_score}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Word Count</span>
              <span className="font-medium text-gray-900">{result.word_count?.toLocaleString() || '1,234'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Analysis Date</span>
              <span className="font-medium text-gray-900">
                {new Date(result.timestamp || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Format</span>
              <span className="font-medium text-gray-900">{selectedFormat.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center ${
              isExporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : exportSuccess
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-lg'
            }`}
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Preparing Export...
              </>
            ) : exportSuccess ? (
              <>
                <FiCheck className="w-5 h-5 mr-2" />
                Export Successful!
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </motion.button>

          <div className="grid grid-cols-3 gap-2">
            <button className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
              <FiPrinter className="w-4 h-4 mr-1" />
              Print
            </button>
            <button className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
              <FiMail className="w-4 h-4 mr-1" />
              Email
            </button>
            <button className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center">
              <FiCopy className="w-4 h-4 mr-1" />
              Copy
            </button>
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Share Analysis</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-2">
                {['Email', 'Copy Link', 'Download'].map((method) => (
                  <button
                    key={method}
                    onClick={() => handleShare(method)}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium text-gray-700 transition-colors"
                  >
                    {method}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExportOptions;