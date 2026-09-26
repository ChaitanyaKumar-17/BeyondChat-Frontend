export default function StoryRing({ stories, type }) {
  const count = stories.length;
  const size = 68;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const gap = count > 1 ? 6 : 0;
  const segmentLength = (circumference / count) - gap;
  const dasharray = `${Math.max(0, segmentLength)} ${circumference}`;

  return (
    <svg width={size} height={size} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 rotate-[-90deg] pointer-events-none">
      <defs>
        <linearGradient id="standardGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="privateGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="myGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {stories.map((story, i) => {
        const angle = (360 / count) * i;
        const isViewed = story.viewed;
        let strokeColor = "url(#standardGradient)";
        if (isViewed) strokeColor = "#3f3f46";
        else if (type === 'private') strokeColor = "url(#privateGradient)";
        else if (type === 'mine') strokeColor = "url(#myGradient)";

        return (
          <circle
            key={story.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dasharray}
            strokeDashoffset={0}
            transform={`rotate(${angle}, ${size / 2}, ${size / 2})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
