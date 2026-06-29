export function VexRobotSvg({
  className = "",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="metal-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      <circle cx="250" cy="250" r="220" fill="url(#glow)" />

      <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1">
        {[...Array(11)].map((_, i) => (
          <line key={`v-${i}`} x1={50 + i * 40} y1="50" x2={50 + i * 40} y2="450" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`h-${i}`} x1="50" y1={50 + i * 40} x2="450" y2={50 + i * 40} />
        ))}
      </g>

      <circle cx="250" cy="250" r="180" stroke="#f97316" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="5 10" />
      <circle cx="250" cy="250" r="140" stroke="#f97316" strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="250" cy="250" r="100" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="1 4" />

      <rect x="110" y="160" width="40" height="180" rx="12" stroke="#64748b" strokeWidth="3" fill="#1e293b" />
      <g stroke="#334155" strokeWidth="2">
        <line x1="110" y1="185" x2="150" y2="185" />
        <line x1="110" y1="210" x2="150" y2="210" />
        <line x1="110" y1="235" x2="150" y2="235" />
        <line x1="110" y1="260" x2="150" y2="260" />
        <line x1="110" y1="285" x2="150" y2="285" />
        <line x1="110" y1="310" x2="150" y2="310" />
      </g>
      <circle cx="130" cy="190" r="12" fill="#334155" stroke="#94a3b8" />
      <circle cx="130" cy="310" r="12" fill="#334155" stroke="#94a3b8" />

      <rect x="350" y="160" width="40" height="180" rx="12" stroke="#64748b" strokeWidth="3" fill="#1e293b" />
      <g stroke="#334155" strokeWidth="2">
        <line x1="350" y1="185" x2="390" y2="185" />
        <line x1="350" y1="210" x2="390" y2="210" />
        <line x1="350" y1="235" x2="390" y2="235" />
        <line x1="350" y1="260" x2="390" y2="260" />
        <line x1="350" y1="285" x2="390" y2="285" />
        <line x1="350" y1="310" x2="390" y2="310" />
      </g>
      <circle cx="370" cy="190" r="12" fill="#334155" stroke="#94a3b8" />
      <circle cx="370" cy="310" r="12" fill="#334155" stroke="#94a3b8" />

      <rect x="160" y="200" width="180" height="100" rx="4" stroke="#475569" strokeWidth="3" fill="#0f172a" />
      <line x1="200" y1="200" x2="200" y2="300" stroke="#64748b" strokeWidth="2" />
      <line x1="300" y1="200" x2="300" y2="300" stroke="#64748b" strokeWidth="2" />

      {[...Array(6)].map((_, col) => (
        <g key={`holes-${col}`}>
          <circle cx={175 + col * 30} cy="215" r="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx={175 + col * 30} cy="250" r="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx={175 + col * 30} cy="285" r="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        </g>
      ))}

      <g stroke="#f97316" strokeWidth="3">
        <line x1="200" y1="250" x2="180" y2="110" className={animated ? "animate-pulse" : undefined} />
        <line x1="300" y1="250" x2="320" y2="110" />
        <line x1="180" y1="110" x2="320" y2="110" strokeWidth="4" />
      </g>

      <circle cx="200" cy="250" r="24" fill="#15803d" stroke="#22c55e" strokeWidth="2" />
      <circle cx="200" cy="250" r="12" fill="#020617" stroke="#64748b" />
      <circle cx="300" cy="250" r="24" fill="#15803d" stroke="#22c55e" strokeWidth="2" />
      <circle cx="300" cy="250" r="12" fill="#020617" stroke="#64748b" />

      <circle cx="180" cy="110" r="15" fill="#f97316" fillOpacity="0.2" stroke="#fb923c" strokeWidth="2" />
      <line x1="180" y1="110" x2="160" y2="80" stroke="#f97316" strokeWidth="2" />
      <circle cx="320" cy="110" r="15" fill="#f97316" fillOpacity="0.2" stroke="#fb923c" strokeWidth="2" />
      <line x1="320" y1="110" x2="340" y2="80" stroke="#f97316" strokeWidth="2" />

      <rect x="220" y="85" width="60" height="40" rx="3" stroke="#ea580c" strokeWidth="2.5" fill="#c2410c" fillOpacity="0.1" />
      <line x1="250" y1="85" x2="250" y2="125" stroke="#fb923c" strokeWidth="1.5" />

      <circle cx="210" cy="235" r="4" fill="#22c55e" />
      <circle cx="290" cy="235" r="4" fill="#22c55e" />

      <rect x="215" y="270" width="70" height="18" rx="2" fill="#ef4444" />
      <text x="250" y="283" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="monospace">
        604A
      </text>
    </svg>
  );
}
