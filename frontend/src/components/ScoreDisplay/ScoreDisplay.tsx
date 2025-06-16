import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

interface ScoreCardProps {
  title: string;
  score: number;
  description: string;
  trend?: number;
  color: string;
  delay?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  description,
  trend = 0,
  color,
  delay = 0,
}) => {
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTrendIcon = () => {
    if (trend > 0) return <FiTrendingUp className="w-4 h-4" />;
    if (trend < 0) return <FiTrendingDown className="w-4 h-4" />;
    return <FiMinus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, delay, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
            {score}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className={`flex items-center text-sm ${getTrendColor()}`}>
        {getTrendIcon()}
        <span className="ml-1">
          {trend > 0 && '+'}
          {trend !== 0 && `${trend}%`}
          {trend === 0 && 'No change'}
        </span>
        <span className="text-gray-400 ml-2">from last analysis</span>
      </div>
    </motion.div>
  );
};

interface ScoreDisplayProps {
  scores: {
    overall: number;
    grammar: number;
    coherence: number;
    relevance: number;
  };
  trends?: {
    grammar?: number;
    coherence?: number;
    relevance?: number;
  };
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores, trends = {} }) => {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-primary-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl text-center"
      >
        <h3 className="text-2xl font-semibold mb-4">Overall Score</h3>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 56}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 56 - (scores.overall / 100) * 2 * Math.PI * 56 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{scores.overall}</span>
            <span className="text-sm opacity-90">/100</span>
          </div>
        </div>
        <p className="text-xl font-medium">{getScoreLabel(scores.overall)}</p>
      </motion.div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard
          title="Grammar"
          score={scores.grammar}
          description="Spelling, punctuation, and sentence structure"
          trend={trends.grammar}
          color="#3b82f6"
          delay={0.1}
        />
        <ScoreCard
          title="Coherence"
          score={scores.coherence}
          description="Flow, organization, and readability"
          trend={trends.coherence}
          color="#8b5cf6"
          delay={0.2}
        />
        <ScoreCard
          title="Relevance"
          score={scores.relevance}
          description="Topic focus and content coverage"
          trend={trends.relevance}
          color="#22c55e"
          delay={0.3}
        />
      </div>

      {/* Score Breakdown Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Score Breakdown</h4>
        <div className="space-y-4">
          {[
            { label: 'Grammar', score: scores.grammar, color: 'bg-primary-500' },
            { label: 'Coherence', score: scores.coherence, color: 'bg-purple-500' },
            { label: 'Relevance', score: scores.relevance, color: 'bg-green-500' },
          ].map((item, index) => (
            <div key={index} className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-600">{item.label}</span>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-sm font-semibold text-gray-700">
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ScoreDisplay;