/**
 * Circular progress score badge.
 * Color tiers: red < 40, amber 40-69, green >= 70.
 */
const ScoreBadge = ({ score = 0, label = '' }) => {
  const clamped = Math.min(100, Math.max(0, score));

  // SVG circle math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const colorClass =
    clamped >= 70
      ? 'text-green-500'
      : clamped >= 40
      ? 'text-amber-500'
      : 'text-red-500';

  const strokeColor =
    clamped >= 70
      ? '#22c55e'
      : clamped >= 40
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
          {/* Track */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress */}
          <circle
            cx="48" cy="48" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${colorClass}`}>{clamped}</span>
        </div>
      </div>
      {label && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
          {label}
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;
