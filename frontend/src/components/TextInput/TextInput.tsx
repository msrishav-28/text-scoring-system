import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

interface TextInputProps {
  onAnalyze: (data: { text: string; file?: File }, topic?: string) => void;
  loading: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ onAnalyze, loading }) => {
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size exceeds 10MB');
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['txt', 'pdf', 'docx', 'doc'];

      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        setUploadedFile(file); // Store the uploaded file
        if (fileExtension === 'txt') {
          const reader = new FileReader();
          reader.onload = () => {
            setText(reader.result as string);
          };
          reader.readAsText(file);
        } else {
          // For other file types, just show the file name in the text area
          setText(`File ready to analyze: ${file.name}`);
        }
      } else {
        toast.error('Unsupported file type. Please upload a .txt, .pdf, .doc, or .docx file.');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleAnalyze = () => {
    if (!text.trim() && !uploadedFile) {
      toast.error('Please enter some text or upload a file to analyze');
      return;
    }
    onAnalyze({ text, file: uploadedFile || undefined }, topic || undefined);
  };

  const handleClear = () => {
    setText('');
    setTopic('');
    setUploadedFile(null);
    toast.success('Cleared text and file.');
  };

  return (
    <div {...getRootProps()} className={`bg-gray-800 border-2 border-dashed rounded-lg p-6 transition-colors ${isDragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600'}`}>
      <input {...getInputProps()} />
      <h2 className="text-2xl font-bold mb-4 text-white">Enter Text or Upload File</h2>
      <textarea
        className="w-full h-64 p-4 bg-gray-900 text-gray-200 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isDragActive ? "Drop the file to upload..." : "Type your text here, or drag and drop a .txt, .pdf, .doc, or .docx file..."}
      />
      <div className="mt-4">
        <input
          type="text"
          className="w-full p-3 bg-gray-900 text-gray-200 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a topic for the text (optional)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Clear
        </button>
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>
    </div>
  );
};

export default TextInput;