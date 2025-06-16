import axios from 'axios';
import {
  AnalysisResult,
  TextAnalysisRequest,
  BatchAnalysisRequest,
  HistoryItem,
  ExportRequest,
  ExportResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const analyzeText = async (
  text: string,
  topic?: string
): Promise<AnalysisResult> => {
  const request: TextAnalysisRequest = { text, topic };
  const response = await api.post<AnalysisResult>('/analyze', request);
  return response.data;
};

export const analyzeBatch = async (
  texts: TextAnalysisRequest[],
  compare: boolean = false
): Promise<{
  results: AnalysisResult[];
  comparative_analysis?: any;
  summary_statistics: any;
}> => {
  const request: BatchAnalysisRequest = { texts, compare };
  const response = await api.post('/analyze/batch', request);
  return response.data;
};

export const analyzeFile = async (
  file: File,
  topic?: string
): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);
  if (topic) {
    formData.append('topic', topic);
  }

  const response = await api.post<AnalysisResult>('/analyze/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getHistory = async (limit: number = 10): Promise<HistoryItem[]> => {
  const response = await api.get<HistoryItem[]>('/history', {
    params: { limit },
  });
  return response.data;
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
  await api.delete(`/history/${id}`);
};

export const exportAnalysis = async (
  request: ExportRequest
): Promise<ExportResponse> => {
  const response = await api.post<ExportResponse>('/export', request);
  return response.data;
};

export const downloadFile = (filename: string): string => {
  return `${API_BASE_URL}/download/${filename}`;
};

// Health check
export const checkHealth = async (): Promise<{
  status: string;
  services: Record<string, string>;
}> => {
  const response = await api.get('/health');
  return response.data;
};

// WebSocket connection for real-time analysis
export const createWebSocketConnection = (
  onMessage: (data: any) => void,
  onError?: (error: any) => void
): WebSocket => {
  const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws';
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws;
};