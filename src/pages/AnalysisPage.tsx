import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { analyzeText, analyzeFile } from '../services/api';
import { useAnalysis } from '../contexts/AnalysisContext';
import TextInput from '../components/TextInput/TextInput';
import ScoreDisplay from '../components/ScoreDisplay/ScoreDisplay';
import DetailedFeedback from '../components/DetailedFeedback/DetailedFeedback';
import ExportOptions from '../components/ExportOptions/ExportOptions';
import { AnalysisResult } from '../types';

export interface Error {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'clarity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  position: [number, number]; // character indices in the text
  message: string;            // description of the error
  suggestion?: string;        // how to fix it (optional)
  explanation?: string;       // why it's an error (optional)
  confidence: number;         // confidence score (0-1)
}

const AnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { currentAnalysis, setCurrentAnalysis, addToHistory } = useAnalysis();

  const handleAnalyze = async (data: { text: string; file?: File }, topic?: string) => {
    setLoading(true);
    try {
      let response: AnalysisResult;
      // If a file is present and it's not a plain text file, or it is a file and the text is the placeholder text, use the analyzeFile service.
      if (data.file && (data.file.type !== 'text/plain' || (data.file && data.text.startsWith('File ready to analyze:')))) {
        response = await analyzeFile(data.file, topic);
      } else {
        // Otherwise, use the analyzeText service
        response = await analyzeText(data.text, topic);
      }
      setCurrentAnalysis(response);
      addToHistory(response);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <TextInput onAnalyze={handleAnalyze} loading={loading} />
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Analyzing your text...</p>
          </div>
        )}
        {currentAnalysis && (
          <div className="mt-12 space-y-12">
            <ScoreDisplay
              scores={{
                overall: currentAnalysis.overall_score,
                grammar: currentAnalysis.grammar.score,
                coherence: currentAnalysis.coherence.score,
                relevance: currentAnalysis.relevance.score,
              }}
            />
            <DetailedFeedback result={currentAnalysis} />
            <ExportOptions result={currentAnalysis} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;