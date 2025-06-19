import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, 
  FiFileText, 
  FiZap, 
  FiX, 
  FiFile, 
  FiType,
  FiInfo,
  FiRotateCcw,
  FiRotateCw,
  FiSave
} from 'react-icons/fi';
import { analyzeText, analyzeFile } from '../services/api';
import { AnalysisResult } from '../types';
import { useAnalysis } from '../contexts/AnalysisContext';
import ExportOptions from '../components/ExportOptions/ExportOptions';

// Custom hooks for UX improvements
const useAutosave = (text: string, delay: number = 1000) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) {
        localStorage.setItem('draft_analysis', text);
        console.log('Draft saved');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);
};

const useTextHistory = () => {
  const [history, setHistory] = useState<string[]>(['']);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const push = useCallback((text: string) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(text);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex]);
  
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);
  
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);
  
  return { 
    push, 
    undo, 
    redo, 
    canUndo: currentIndex > 0, 
    canRedo: currentIndex < history.length - 1 
  };
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-gray-200 rounded-xl"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Progress indicator component
const AnalysisProgress = ({ stage }: { stage: number }) => {
  const stages = [
    { id: 1, label: 'Analyzing grammar...', icon: '📝' },
    { id: 2, label: 'Checking coherence...', icon: '🔍' },
    { id: 3, label: 'Evaluating relevance...', icon: '🎯' },
    { id: 4, label: 'Generating report...', icon: '📊' },
  ];

  return (
    <div className="space-y-3">
      {stages.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: s.id * 0.2 }}
          className="flex items-center space-x-3"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            stage >= s.id 
              ? 'bg-primary-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {stage > s.id ? '✓' : s.icon}
          </div>
          <span className={`${
            stage >= s.id ? 'text-gray-900 font-medium' : 'text-gray-500'
          }`}>
            {s.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// Character count component
const CharacterCount = ({ current, max }: { current: number; max: number }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = percentage > 100;
  
  return (
    <div className={`text-sm ${
      isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'
    }`}>
      {current.toLocaleString()} / {max.toLocaleString()} characters
      {isOverLimit && (
        <span className="block text-xs mt-1">
          Text exceeds maximum length
        </span>
      )}
    </div>
  );
};

// Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="relative inline-flex group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
    </div>
  </div>
);

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const { currentAnalysis, setCurrentAnalysis, addToHistory } = useAnalysis();
  
  // Use custom hooks
  useAutosave(text);
  const textHistory = useTextHistory();
  
  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft_analysis');
    if (draft && !text) {
      setText(draft);
      toast.success('Draft restored', { icon: '📝' });
    }
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        handleAnalyze();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && textHistory.canUndo) {
        e.preventDefault();
        const previousText = textHistory.undo();
        if (previousText !== null) setText(previousText);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y' && textHistory.canRedo) {
        e.preventDefault();
        const nextText = textHistory.redo();
        if (nextText !== null) setText(nextText);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [text, textHistory]);

  const handleAnalyze = async () => {
    if (inputMethod === 'text' && text.trim()) {
      performAnalysis({ text }, topic.trim() || undefined);
    } else if (inputMethod === 'file' && file) {
      performAnalysis({ text: file.name, file }, topic.trim() || undefined);
    }
  };

  const performAnalysis = async (data: { text: string; file?: File }, topic?: string) => {
    setLoading(true);
    setAnalysisStage(1);
    
    try {
      // Simulate progress stages
      const stageInterval = setInterval(() => {
        setAnalysisStage(prev => Math.min(prev + 1, 4));
      }, 1000);
      
      let response: AnalysisResult;
      if (data.file && (data.file.type !== 'text/plain' || data.text.startsWith('File ready to analyze:'))) {
        response = await analyzeFile(data.file, topic);
      } else {
        response = await analyzeText(data.text, topic);
      }
      
      clearInterval(stageInterval);
      setAnalysisStage(4);
      
      // Clear draft after successful analysis
      localStorage.removeItem('draft_analysis');
      
      setCurrentAnalysis(response);
      addToHistory(response);
      
      // Success feedback
      if (response.overall_score >= 90) {
        toast.success('Excellent score! 🎉', { duration: 5000 });
      } else if (response.overall_score >= 80) {
        toast.success('Great job! 👏', { duration: 4000 });
      } else {
        toast.success('Analysis complete!');
      }
      
    } catch (error: any) {
      console.error('Analysis failed:', error);
      
      // Smart error messages
      let errorMessage = 'Failed to analyze. Please try again.';
      if (error.message?.includes('size')) {
        errorMessage = 'Your file is too large. Please use a file under 10MB.';
      } else if (error.message?.includes('format')) {
        errorMessage = 'This file format is not supported. Try PDF, DOCX, or TXT.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Connection issue. Please check your internet and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setAnalysisStage(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFileType(droppedFile)) {
      setFile(droppedFile);
      toast.success(`File "${droppedFile.name}" ready for analysis`);
    } else {
      toast.error('Invalid file type. Please use TXT, PDF, DOC, or DOCX.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFileType(selectedFile)) {
      setFile(selectedFile);
      toast.success(`File "${selectedFile.name}" ready for analysis`);
    }
  };

  const isValidFileType = (file: File) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    return allowedTypes.some(type => file.name.toLowerCase().endsWith(type));
  };

  const canSubmit = inputMethod === 'text' ? text.trim().length > 0 && text.length <= 50000 : file !== null;

  const resetForm = () => {
    setText('');
    setFile(null);
    setTopic('');
    setCurrentAnalysis(null);
    localStorage.removeItem('draft_analysis');
    toast.success('Ready for new analysis');
  };

  const handleViewDetails = () => {
    if (currentAnalysis && (currentAnalysis.result_id || currentAnalysis.id)) {
      navigate(`/analysis/${currentAnalysis.result_id || currentAnalysis.id}`);
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    textHistory.push(newText);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-center py-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-2"
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 mt-2"
        >
          💡 Tip: Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to analyze
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
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analyze Your Text</h2>
                
                {/* Input Method Toggle */}
                <div className="flex items-center space-x-2">
                  {text && inputMethod === 'text' && (
                    <div className="flex items-center space-x-1 mr-4">
                      <Tooltip content="Undo (Ctrl+Z)">
                        <button
                          onClick={() => {
                            const previousText = textHistory.undo();
                            if (previousText !== null) setText(previousText);
                          }}
                          disabled={!textHistory.canUndo}
                          className={`p-2 rounded-lg transition-colors ${
                            textHistory.canUndo 
                              ? 'text-gray-600 hover:bg-gray-100' 
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <FiRotateCcw className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Redo (Ctrl+Y)">
                        <button
                          onClick={() => {
                            const nextText = textHistory.redo();
                            if (nextText !== null) setText(nextText);
                          }}
                          disabled={!textHistory.canRedo}
                          className={`p-2 rounded-lg transition-colors ${
                            textHistory.canRedo 
                              ? 'text-gray-600 hover:bg-gray-100' 
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <FiRotateCw className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                  
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
              </div>

              {/* Topic Input with Tooltip */}
              <div className="mb-6">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  Topic (Optional)
                  <Tooltip content="Providing a topic helps improve relevance scoring">
                    <span className="ml-2">
                      <FiInfo className="w-4 h-4 text-gray-400" />
                    </span>
                  </Tooltip>
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                      isDragging
                        ? 'border-primary-500 bg-primary-50 scale-[1.02]'
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
                    
                    <motion.div
                      animate={{ scale: isDragging ? 1.1 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiUpload className={`mx-auto h-12 w-12 mb-4 ${
                        file ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </motion.div>
                    
                    {file ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-lg font-medium text-gray-900 mb-1">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            toast.success('File removed');
                          }}
                          className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove file
                        </button>
                      </motion.div>
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
                      onChange={(e) => handleTextChange(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Enter your text here for analysis..."
                      disabled={loading}
                    />
                    <div className="absolute bottom-3 right-3">
                      <CharacterCount current={text.length} max={50000} />
                    </div>
                    {text && (
                      <div className="absolute top-3 right-3">
                        <Tooltip content="Draft auto-saved">
                          <FiSave className="w-4 h-4 text-green-500" />
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <motion.button
                onClick={handleAnalyze}
                disabled={loading || !canSubmit}
                whileHover={{ scale: canSubmit && !loading ? 1.02 : 1 }}
                whileTap={{ scale: canSubmit && !loading ? 0.98 : 1 }}
                className={`w-full mt-6 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  loading || !canSubmit
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-md hover:shadow-lg'
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

              {/* Loading Progress */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-6 bg-gray-50 rounded-xl"
                >
                  <AnalysisProgress stage={analysisStage} />
                </motion.div>
              )}
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
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Overall Score with Animation */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full mb-4 shadow-lg"
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl font-bold text-white"
                    >
                      {currentAnalysis.overall_score.toFixed(0)}
                    </motion.span>
                  </motion.div>
                  <p className="text-lg text-gray-600">Overall Score</p>
                  {currentAnalysis.overall_score >= 90 && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-600 mt-2 font-medium"
                    >
                      🎉 Excellent work!
                    </motion.p>
                  )}
                </div>

                {/* Individual Scores */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Grammar', score: currentAnalysis.grammar.score, color: 'from-blue-500 to-blue-600', delay: 0.1 },
                    { label: 'Coherence', score: currentAnalysis.coherence.score, color: 'from-purple-500 to-purple-600', delay: 0.2 },
                    { label: 'Relevance', score: currentAnalysis.relevance.score, color: 'from-green-500 to-green-600', delay: 0.3 }
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: item.delay }}
                      className="text-center"
                    >
                      <motion.div
                   whileHover={{ scale: 1.05 }}
                   className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${item.color} rounded-full mb-2 shadow-md cursor-pointer`}
                 >
                   <span className="text-xl font-bold text-white">
                     {item.score.toFixed(0)}
                   </span>
                 </motion.div>
                 <p className="text-sm text-gray-600">{item.label}</p>
               </motion.div>
             ))}
           </div>

           {/* Quick Stats */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="bg-gray-50 rounded-xl p-6"
           >
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
           </motion.div>

           {/* Action Buttons */}
           <div className="grid grid-cols-2 gap-4 mt-6">
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleViewDetails}
               className="px-4 py-2.5 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-all duration-200"
             >
               View Details
             </motion.button>
             <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setShowExportModal(true)}
               className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
             >
               Export Report
             </motion.button>
           </div>
         </div>

         {/* Quick Actions */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.5 }}
           className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-6 border border-primary-200"
         >
           <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
           <div className="space-y-2">
             <button
               onClick={() => navigate('/history')}
               className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
             >
               📊 View analysis history
             </button>
             <button
               onClick={resetForm}
               className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
             >
               ✍️ Analyze another text
             </button>
             <button
               onClick={() => window.print()}
               className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
             >
               🖨️ Print this report
             </button>
           </div>
         </motion.div>

         {/* New Analysis Button */}
         <motion.button
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.6 }}
           onClick={resetForm}
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="w-full px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 transition-all duration-200"
         >
           New Analysis
         </motion.button>
       </motion.div>
     )}
   </AnimatePresence>
 </div>

 {/* Export Modal */}
 <AnimatePresence>
   {showExportModal && currentAnalysis && (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
       onClick={() => setShowExportModal(false)}
     >
       <motion.div
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         exit={{ scale: 0.9, opacity: 0 }}
         className="max-w-2xl w-full"
         onClick={(e) => e.stopPropagation()}
       >
         <ExportOptions result={currentAnalysis} />
         <button
           onClick={() => setShowExportModal(false)}
           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
         >
           <FiX className="w-6 h-6" />
         </button>
       </motion.div>
     </motion.div>
   )}
 </AnimatePresence>
    </div>
  );
};

export default AnalysisPage;