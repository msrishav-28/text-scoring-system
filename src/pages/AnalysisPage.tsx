import React, { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { analyzeText, analyzeFile } from '../services/api';
import { AppContext } from '../context/AppContext';

const AnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const { state } = useContext(AppContext);

  const handleAnalyze = async (data: { text: string; file?: File }, topic?: string) => {
    setLoading(true);
    try {
      let response;
      // If a file is present and it's not a plain text file, use the analyzeFile service.
      // We also check if the text content is just the placeholder.
      if (
        (data.file && data.file.type !== 'text/plain') ||
        (data.file && data.text.startsWith('File ready to analyze:'))
      ) {
        response = await analyzeFile(data.file, topic);
      } else {
        // Otherwise, use the analyzeText service
        response = await analyzeText(data.text, topic);
      }
      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your component JSX here */}
    </div>
  );
};

export default AnalysisPage;