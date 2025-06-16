import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult } from '../types';

interface AnalysisContextType {
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  analysisHistory: AnalysisResult[];
  addToHistory: (analysis: AnalysisResult) => void;
  clearHistory: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};

interface AnalysisProviderProps {
  children: ReactNode;
}

export const AnalysisProvider: React.FC<AnalysisProviderProps> = ({ children }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const addToHistory = (analysis: AnalysisResult) => {
    setAnalysisHistory((prev) => [...prev, analysis].slice(-10)); // Keep last 10
  };

  const clearHistory = () => {
    setAnalysisHistory([]);
  };

  return (
    <AnalysisContext.Provider
      value={{
        currentAnalysis,
        setCurrentAnalysis,
        analysisHistory,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};