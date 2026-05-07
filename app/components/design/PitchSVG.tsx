export function PitchSVG() {
  return (
    <svg
      viewBox="0 0 600 800"
      className="absolute inset-0 size-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern
          id="grass-stripes"
          x="0"
          y="0"
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="60" height="60" fill="rgba(255,255,255,0)" />
          <rect x="0" y="0" width="60" height="30" fill="rgba(255,255,255,0.025)" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="600" height="800" fill="url(#grass-stripes)" />

      <g
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="18" y="18" width="564" height="764" rx="2" />
        <line x1="18" y1="400" x2="582" y2="400" />
        <circle cx="300" cy="400" r="64" />
        <rect x="180" y="18" width="240" height="120" />
        <rect x="245" y="18" width="110" height="40" />
        <rect x="270" y="6" width="60" height="12" />
        <path d="M 240 138 A 64 64 0 0 0 360 138" />
        <rect x="180" y="662" width="240" height="120" />
        <rect x="245" y="742" width="110" height="40" />
        <rect x="270" y="782" width="60" height="12" />
        <path d="M 240 662 A 64 64 0 0 1 360 662" />
      </g>

      <g fill="rgba(255,255,255,0.7)">
        <circle cx="300" cy="400" r="3" />
        <circle cx="300" cy="100" r="3" />
        <circle cx="300" cy="700" r="3" />
      </g>

      <g stroke="rgba(255,255,255,0.45)" strokeWidth="2" fill="none">
        <path d="M 18 30 A 12 12 0 0 0 30 18" />
        <path d="M 570 18 A 12 12 0 0 0 582 30" />
        <path d="M 18 770 A 12 12 0 0 1 30 782" />
        <path d="M 570 782 A 12 12 0 0 1 582 770" />
      </g>
    </svg>
  );
}
