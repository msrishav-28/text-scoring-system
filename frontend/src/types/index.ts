export interface Error {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'clarity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  position: [number, number];
  message: string;
  suggestion?: string;
  explanation?: string;
  confidence: number;
}

export interface GrammarScore {
  score: number;
  errors: Error[];
  error_density: number;
  suggestions: string[];
  details: {
    error_counts: Record<string, number>;
    readability: Record<string, number>;
    sentence_variety: Record<string, any>;
    vocabulary_level: Record<string, any>;
  };
}

export interface CoherenceScore {
  score: number;
  sentence_flow: number[];
  paragraph_transitions: Array<{
    paragraph_index: number;
    transition_type: string | null;
    connection_strength: number;
    has_explicit_transition: boolean;
  }>;
  weak_connections: Array<{
    sentence_index: number;
    similarity_score: number;
    sentence_before: string;
    sentence_after: string;
    suggestion: string;
  }>;
  suggestions: string[];
  readability_scores: Record<string, number>;
}

export interface RelevanceScore {
  score: number;
  topic_coverage: Record<string, number>;
  key_terms_found: string[];
  missing_aspects: string[];
  topic_drift: Array<{
    paragraph_index: number;
    relevance_score: number;
    preview: string;
    suggestion: string;
  }>;
  suggestions: string[];
}

export interface AnalysisResult {
  overall_score: number;
  grammar: GrammarScore;
  coherence: CoherenceScore;
  relevance: RelevanceScore;
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_sentence_length: number;
  processing_time: number;
  timestamp: string;
  feedback_summary: string;
  strengths: string[];
  areas_for_improvement: string[];
}

export interface TextAnalysisRequest {
  text: string;
  topic?: string;
  topics?: string[];
  custom_weights?: {
    grammar?: number;
    coherence?: number;
    relevance?: number;
  };
}

export interface BatchAnalysisRequest {
  texts: TextAnalysisRequest[];
  compare: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  text_preview: string;
  overall_score: number;
  word_count: number;
  topic?: string;
}

export interface ExportRequest {
  result_id: string;
  format: 'pdf' | 'csv' | 'json' | 'docx';
  include_visualizations: boolean;
  include_detailed_feedback: boolean;
}

export interface ExportResponse {
  file_path: string;
  download_url: string;
  file_size: number;
  format: string;
}