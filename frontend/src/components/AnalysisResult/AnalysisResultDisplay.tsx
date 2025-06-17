import React from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { AnalysisResult } from '../../types';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
  onViewDetails: () => void;
}

const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result, onViewDetails }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Grammar Score</h3>
          <div className="mt-2 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${result.grammar.score * 100}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.grammar.feedback}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700">Coherence Score</h3>
          <div className="mt-2 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${result.coherence.score * 100}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.coherence.feedback}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700">Relevance Score</h3>
          <div className="mt-2 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full"
              style={{ width: `${result.relevance.score * 100}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.relevance.feedback}</p>
        </div>
      </div>

      <button
        onClick={onViewDetails}
        className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        View Detailed Analysis
        <FiArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
};

export default AnalysisResultDisplay; 