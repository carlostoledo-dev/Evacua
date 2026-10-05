// Placeholder illustration drawn in SVG until the owner's image for this step is ready.
// Decorative: hidden from assistive technology.

const SKIN = '#f4c7a6';

// Home-screen grid (3 × 3); the middle slot holds the Evacua icon.
const PHONE_TILES = [
  '#dbeafe',
  '#e5e7eb',
  '#dcfce7',
  '#e5e7eb',
  null,
  '#e5e7eb',
  '#dcfce7',
  '#dbeafe',
  '#e5e7eb',
].map((fill, i) => ({ fill, x: 44 + (i % 3) * 25, y: 44 + Math.floor(i / 3) * 44 }));

export function PhoneArt() {
  return (
    <svg className="phone-art" viewBox="0 0 160 200" aria-hidden="true" focusable="false">
      {/* Hand behind the phone */}
      <path d="M118 120 C150 130 160 170 150 200 H86 C90 180 104 150 118 120Z" fill={SKIN} />
      <rect x="30" y="8" width="96" height="184" rx="18" fill="#0a1a3f" />
      <rect x="36" y="14" width="84" height="172" rx="13" fill="#f5f8ff" />
      <rect x="64" y="18" width="28" height="6" rx="3" fill="#0a1a3f" />
      {PHONE_TILES.map(({ fill, x, y }) =>
        fill ? (
          <rect
            key={`${String(x)}-${String(y)}`}
            x={x}
            y={y}
            width="19"
            height="19"
            rx="5"
            fill={fill}
          />
        ) : (
          <g key="evacua" transform={`translate(${String(x - 4)} ${String(y - 4)})`}>
            <rect width="27" height="27" rx="7" fill="#0d2556" />
            <path
              d="M0 18 C6 18 9 12 14 9 C18 7 24 8 24 13 C24 17 19 18 17 15 C15 19 8 20 4 21 V27 H0Z"
              fill="#ffffff"
            />
            <path d="M0 20 C8 18 16 22 27 19 V27 H0Z" fill="#2f8bff" />
          </g>
        ),
      )}
      {/* "New app" sparkle around the icon */}
      <g stroke="#2f9e57" strokeWidth="3" strokeLinecap="round">
        <path d="M64 78 59 71" />
        <path d="M78.5 75 78.5 67" />
        <path d="M93 78 98 71" />
      </g>
      {/* Thumb and fingers over the phone edge */}
      <rect x="20" y="96" width="22" height="13" rx="6.5" fill={SKIN} />
      <rect x="18" y="112" width="24" height="13" rx="6.5" fill={SKIN} />
      <rect x="20" y="128" width="22" height="13" rx="6.5" fill={SKIN} />
      <path d="M126 150 C134 140 140 128 132 120 C126 130 122 138 120 150Z" fill={SKIN} />
    </svg>
  );
}
