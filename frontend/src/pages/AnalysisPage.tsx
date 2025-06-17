import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiZap, FiX, FiFile, FiType } from 'react-icons/fi';

interface AnalysisResult {
  overall_score: number;
  grammar: { score: number };
  coherence: { score: number };
  relevance: { score: number };
  result_id: string;
  word_count: number;
  timestamp: string;
}

const AnalysisPage: React.FC = () => {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (inputMethod === 'text' && text.trim()) {
      performAnalysis({ text }, topic.trim() || undefined);
    } else if (inputMethod === 'file' && file) {
      performAnalysis({ text: file.name, file }, topic.trim() || undefined);
    }
  };

  const performAnalysis = async (data: { text: string; file?: File }, topic?: string) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCurrentAnalysis({
        overall_score: 85.5,
        grammar: { score: 88.0 },
        coherence: { score: 82.0 },
        relevance: { score: 86.5 },
        result_id: 'demo-123',
        word_count: 1234,
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const isValidFileType = (file: File) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    return allowedTypes.some(type => file.name.toLowerCase().endsWith(type));
  };

  const canSubmit = inputMethod === 'text' ? text.trim().length > 0 : file !== null;

  const resetForm = () => {
    setText('');
    setFile(null);
    setTopic('');
    setCurrentAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-center py-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 mb-2"
        >
          Text Analysis
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-600"
        >
          Get comprehensive insights about your writing
        </motion.p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          {!currentAnalysis ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analyze Your Text</h2>
                
                {/* Upload File Button */}
                <button
                  onClick={() => setInputMethod(inputMethod === 'text' ? 'file' : 'text')}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  {inputMethod === 'text' ? (
                    <>
                      <FiUpload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  ) : (
                    <>
                      <FiType className="w-4 h-4 mr-2" />
                      Type Text
                    </>
                  )}
                </button>
              </div>

              {/* Topic Input */}
              <div className="mb-6">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic (Optional)
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g., Machine Learning, Business Strategy, Creative Writing"
                  disabled={loading}
                />
              </div>

              {/* Input Area */}
              {inputMethod === 'file' ? (
                <div>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      isDragging
                        ? 'border-primary-500 bg-primary-50'
                        : file
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                  >
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".txt,.pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    
                    <FiUpload className={`mx-auto h-12 w-12 mb-4 ${file ? 'text-green-500' : 'text-gray-400'}`} />
                    
                    {file ? (
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-1">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="mt-3 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 mb-1">
                          {isDragging ? 'Drop your file here' : 'Drag and drop a file here, or click to browse'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Supported formats: TXT, PDF, DOCX (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter your text here for analysis..."
                      disabled={loading}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {text.length} characters
                    </div>
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <motion.button
                onClick={handleAnalyze}
                disabled={loading || !canSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full mt-6 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all ${
                  loading || !canSubmit
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiZap className="w-5 h-5 mr-2" />
                    Analyze Text
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Results Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Overall Score */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full mb-4">
                    <span className="text-4xl font-bold text-white">
                      {currentAnalysis.overall_score.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600">Overall Score</p>
                </div>

                {/* Individual Scores */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Grammar', score: currentAnalysis.grammar.score, color: 'from-blue-500 to-blue-600' },
                    { label: 'Coherence', score: currentAnalysis.coherence.score, color: 'from-purple-500 to-purple-600' },
                    { label: 'Relevance', score: currentAnalysis.relevance.score, color: 'from-green-500 to-green-600' }
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${item.color} rounded-full mb-2`}>
                        <span className="text-xl font-bold text-white">
                          {item.score.toFixed(0)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Word Count:</span>
                      <span className="ml-2 font-medium text-gray-900">{currentAnalysis.word_count.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Analysis Date:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(currentAnalysis.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Export Report
                  </button>
                </div>
              </div>

              {/* New Analysis Button */}
              <motion.button
                onClick={resetForm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 transition-all"
              >
                New Analysis
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalysisPage;