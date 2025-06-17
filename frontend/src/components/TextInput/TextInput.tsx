import React, { useState } from 'react';
import { FiSend } from 'react-icons/fi';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: (text: string, topic?: string) => void;
  loading: boolean;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, onAnalyze, loading }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAnalyze(value, topic.trim() || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
          Topic (Optional)
        </label>
        <input
          type="text"
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Enter the topic of your text"
        />
      </div>

      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">
          Text to Analyze
        </label>
        <textarea
          id="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Enter or paste your text here..."
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            Analyze Text
            <FiSend className="ml-2 h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
};

export default TextInput;