import { getConfidenceLevel, CONFIDENCE_LEVELS } from '@/lib/ai/config';

interface ConfidenceBadgeProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({ score, showScore = true, size = 'md' }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const config = CONFIDENCE_LEVELS[level];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses[config.color]}`}
      title={`Confidence: ${Math.round(score * 100)}%`}
    >
      <span>{config.emoji}</span>
      {showScore && <span>{Math.round(score * 100)}%</span>}
    </span>
  );
}
