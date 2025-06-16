import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface TextInputProps {
  onAnalyze: (text: string, topic?: string) => void;
  isAnalyzing: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const maxChars = 50000;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Check file type
      const allowedTypes = ['.txt', '.pdf', '.docx', '.doc'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('Please upload a TXT, PDF, or DOCX file');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      toast.success('File uploaded successfully');
      
      // For demo purposes, we'll just set some sample text
      // In real implementation, this would be handled by the backend
      if (fileExtension === '.txt') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setText(content.substring(0, maxChars));
        };
        reader.readAsText(file);
      } else {
        // For PDF/DOCX, we'd normally send to backend
        setText(`[File uploaded: ${file.name}]\n\nThis is a demo. In the real application, the file content would be extracted by the backend.`);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    multiple: false,
  });

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    if (text.length < 10) {
      toast.error('Text must be at least 10 characters long');
      return;
    }

    onAnalyze(text, topic || undefined);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setText('');
  };

  const charCount = text.length;
  const charPercentage = (charCount / maxChars) * 100;

  return (
    <div className="bg-gradient-to-br from-primary-500 to-purple-600 p-1 rounded-2xl shadow-xl">
      <div className="bg-white rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-gray-800">Analyze Your Text</h3>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center space-x-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <FiUpload className="w-4 h-4" />
              <span>Upload File</span>
            </motion.button>
          </div>
        </div>

        {/* File Upload Area */}
        {!text && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} id="file-upload" />
            <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">
              {isDragActive
                ? 'Drop your file here...'
                : 'Drag and drop a file here, or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: TXT, PDF, DOCX (max 10MB)
            </p>
          </div>
        )}

        {/* Uploaded File Display */}
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <FiFileText className="w-5 h-5 text-primary-500" />
              <div>
                <p className="font-medium text-gray-700">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </motion.div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.substring(0, maxChars))}
            className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none transition resize-none"
            placeholder="Enter your text here for analysis..."
            disabled={isAnalyzing}
          />
          
          {/* Character Count Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <motion.div
              className={`h-full transition-all ${
                charPercentage > 90
                  ? 'bg-red-500'
                  : charPercentage > 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${charPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none transition"
              disabled={isAnalyzing}
            />
            <span className={`text-sm ${
              charPercentage > 90
                ? 'text-red-600'
                : charPercentage > 70
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}>
              {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing || !text.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              isAnalyzing || !text.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-lg'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <FiFileText className="w-5 h-5" />
                <span>Analyze Text</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TextInput;