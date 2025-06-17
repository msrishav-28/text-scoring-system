import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { analyzeText, analyzeFile } from '../services/api';
import { AnalysisResult } from '../types';
import TextInput from '../components/TextInput/TextInput';
import FileUpload from '../components/FileUpload/FileUpload';
import AnalysisResultDisplay from '../components/AnalysisResult/AnalysisResultDisplay';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [text, setText] = useState('');

  const handleAnalyze = async (data: { text: string; file?: File }, topic?: string) => {
    setLoading(true);
    try {
      let response;
      // If a file is present and it's not a plain text file, use the analyzeFile service.
      // We also check if the text content is just the placeholder.
      if (data.file && data.file.type !== 'text/plain' || (data.file && data.text.startsWith('File ready to analyze:'))) {
        response = await analyzeFile(data.file, topic);
      } else {
        // Otherwise, use the analyzeText service
        response = await analyzeText(data.text, topic);
      }
      setAnalysisResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Text Analysis</h1>
          <p className="mt-2 text-xl text-gray-600">
            Analyze your text for grammar, coherence, and relevance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <TextInput
              value={text}
              onChange={(value) => setText(value)}
              onAnalyze={(text, topic) => handleAnalyze({ text }, topic)}
              loading={loading}
            />
            <FileUpload
              onFileSelect={(file, topic) => handleAnalyze({ text: file.name, file }, topic)}
              loading={loading}
            />
          </div>

          {/* Results Section */}
          <div>
            {analysisResult && (
              <AnalysisResultDisplay
                result={analysisResult}
                onViewDetails={() => navigate(`/analysis/${analysisResult.id}`)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;