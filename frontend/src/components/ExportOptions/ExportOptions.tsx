import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiDownload,
  FiFileText,
  FiFile,
  FiBarChart2,
  FiCheck,
} from 'react-icons/fi';
import { AnalysisResult } from '../../types';
import { exportAnalysis, downloadFile } from '../../services/api';
import toast from 'react-hot-toast';

interface ExportOptionsProps {
  result: AnalysisResult;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ result }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json' | 'docx'>('pdf');
  const [includeVisualizations, setIncludeVisualizations] = useState(true);
  const [includeDetailedFeedback, setIncludeDetailedFeedback] = useState(true);

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional report with charts and formatting',
      icon: FiFileText,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    {
      id: 'docx',
      name: 'Word Document',
      description: 'Editable document for further customization',
      icon: FiFile,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Raw data for spreadsheet analysis',
      icon: FiBarChart2,
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    {
      id: 'json',
      name: 'JSON Format',
      description: 'Complete data for developers',
      icon: FiFile,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // For demo purposes, we'll simulate the export
      // In real implementation, this would use the actual result ID
      const exportRequest = {
        result_id: 'demo-result-id',
        format: selectedFormat,
        include_visualizations: includeVisualizations,
        include_detailed_feedback: includeDetailedFeedback,
      };

      const response = await exportAnalysis(exportRequest);
      
      // Download the file
      const downloadUrl = downloadFile(response.download_url.split('/').pop() || '');
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `text-analysis.${selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${selectedFormat.toUpperCase()} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          Choose Export Format
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formats.map((format) => (
            <motion.button
              key={format.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFormat(format.id as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFormat === format.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                    format.color
                  }`}
                >
                  <format.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-800">{format.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                </div>
                {selectedFormat === format.id && (
                  <div className="ml-2">
                    <FiCheck className="w-5 h-5 text-primary-600" />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Export Options */}
      {(selectedFormat === 'pdf' || selectedFormat === 'docx') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Export Options
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeVisualizations}
                onChange={(e) => setIncludeVisualizations(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-700">
                Include charts and visualizations
              </span>
            </label>
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetailedFeedback}
                onChange={(e) => setIncludeDetailedFeedback(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-700">
                Include detailed feedback and suggestions
              </span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Export Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-6 border border-primary-200"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Export Summary
        </h3>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Score</span>
            <span className="font-semibold text-gray-800">
              {result.overall_score}/100
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Word Count</span>
            <span className="font-semibold text-gray-800">
              {result.word_count.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Analysis Date</span>
            <span className="font-semibold text-gray-800">
              {new Date(result.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
          disabled={isExporting}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
            isExporting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-lg'
          }`}
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <FiDownload className="w-5 h-5" />
              <span>Export {selectedFormat.toUpperCase()}</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> PDF format is best for sharing professional reports,
          while CSV is ideal for further data analysis in spreadsheet applications.
        </p>
      </motion.div>
    </div>
  );
};

export default ExportOptions;