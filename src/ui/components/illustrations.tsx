// Decorative illustrations drawn for Evacua (flat vector, no external images). They carry no
// information of their own, so they are hidden from assistive technology. Each one is rendered
// at most once per screen, so the gradient ids below cannot collide.
import type { ProfileId } from '../../domain/profiles.ts';

const SKIN = '#f4c7a6';
const INK = '#1f2a44';

/** Welcome hero: a coastal town, the sea, and a family walking up a path to high ground. */
export function CoastArt() {
  return (
    <svg
      className="coast-art"
      viewBox="0 10 400 200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="art-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fb0f0" />
          <stop offset="1" stopColor="#1468d0" />
        </linearGradient>
        <linearGradient id="art-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cbf6e" />
          <stop offset="1" stopColor="#2f8f4e" />
        </linearGradient>
      </defs>

      {/* Clouds */}
      <g fill="#ffffff">
        <path d="M22 54a12 12 0 0 1 22-6 10 10 0 0 1 18 4 8 8 0 0 1 2 16H24a7 7 0 0 1-2-14Z" />
        <path d="M300 30a10 10 0 0 1 18-5 9 9 0 0 1 16 4 7 7 0 0 1 1 13h-34a6 6 0 0 1-1-12Z" />
      </g>

      {/* Distant hills and coastline town */}
      <path
        d="M0 108 C60 84 110 92 160 100 S260 78 320 86 S380 96 400 92 V140 H0Z"
        fill="#7fbfb0"
      />
      <path d="M120 112 C170 98 230 96 300 104 L300 140 H120Z" fill="#a7d7c5" />
      <g>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i} transform={`translate(${String(150 + i * 17)} ${String(100 + (i % 2) * 4)})`}>
            <rect width="12" height="9" y="4" fill="#ffffff" />
            <path d="M-1 5 6 -1 13 5Z" fill="#e0734f" />
          </g>
        ))}
      </g>

      {/* Sea, beach and waves */}
      <path d="M0 122 C70 116 130 118 190 126 C220 150 236 190 250 230 H0Z" fill="url(#art-sea)" />
      <path
        d="M190 126 C206 124 222 124 236 126 C246 160 258 196 276 230 H250 C236 190 220 150 190 126Z"
        fill="#f3dfae"
      />
      <g fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.85">
        <path d="M20 160 q12 -6 24 0 t24 0" />
        <path d="M90 190 q12 -6 24 0 t24 0" />
        <path d="M150 150 q10 -5 20 0" />
        <path d="M30 210 q12 -6 24 0 t24 0" />
      </g>

      {/* High ground with trees and the evacuation path */}
      <path d="M236 230 C250 170 290 120 400 70 V230Z" fill="url(#art-hill)" />
      <g fill="#2f8f4e">
        <circle cx="384" cy="96" r="14" />
        <circle cx="366" cy="110" r="11" />
        <circle cx="392" cy="140" r="12" />
        <circle cx="262" cy="214" r="10" />
      </g>
      <path
        d="M262 230 C280 200 300 176 324 160 C340 150 352 134 366 118"
        fill="none"
        stroke="#e6eaee"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M280 230 C296 204 314 182 336 166 C350 156 362 142 376 126"
        fill="none"
        stroke="#9aa7b4"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Evacuation route sign */}
      <g transform="translate(2 4)">
        <rect x="345" y="58" width="5" height="56" rx="2" fill="#5b6b7a" />
        <rect
          x="320"
          y="14"
          width="56"
          height="50"
          rx="7"
          fill="#0f8a4c"
          stroke="#ffffff"
          strokeWidth="3"
        />
        <path
          d="M362 50 V26 M354 34 362 25 370 34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="340" cy="28" r="3" fill="#ffffff" stroke="none" />
          <path d="M339 33 336 44 M336 44 342 52 M336 44 330 50 M338 37 345 40 M338 37 331 38" />
        </g>
      </g>

      {/* A family walking up (seen from behind) */}
      <Walker x={300} y={148} scale={1} coat="#2563eb" pack="#1f2a44" hair="#3b2a20" />
      <Walker x={319} y={141} scale={0.78} coat="#ec6aa0" pack="#b8325f" hair="#5a3420" />
      <Walker x={337} y={125} scale={0.95} coat="#8b5cf6" pack="#4b3a7a" hair="#c9ced6" cane />
    </svg>
  );
}

interface WalkerProps {
  x: number;
  y: number;
  scale: number;
  coat: string;
  pack: string;
  hair: string;
  cane?: boolean;
}

function Walker({ x, y, scale, coat, pack, hair, cane = false }: WalkerProps) {
  return (
    <g transform={`translate(${String(x)} ${String(y)}) scale(${String(scale)})`}>
      <rect x="-5" y="12" width="4" height="12" rx="2" fill={INK} />
      <rect x="1" y="12" width="4" height="12" rx="2" fill={INK} />
      <rect x="-8" y="-6" width="16" height="22" rx="7" fill={coat} />
      <rect x="-6" y="-3" width="12" height="13" rx="4" fill={pack} />
      <circle cx="0" cy="-12" r="7" fill={SKIN} />
      <path d="M-7 -12 a7 7 0 0 1 14 0 v2 h-14Z" fill={hair} />
      {cane && <path d="M9 0 L13 22" stroke="#6b4a2f" strokeWidth="2.5" strokeLinecap="round" />}
    </g>
  );
}

/** Install step: a phone with Evacua on its home screen. */
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

interface AvatarSpec {
  bg: string;
  shirt: string;
  hair: string;
  /** Hair outline (and bun) drawn over the head. */
  hairPath: string;
  headY: number;
  headR: number;
  glasses?: boolean;
  cheeks?: boolean;
}

// Drawing data per profile preset; the component itself has no per-profile logic.
const AVATARS: Record<ProfileId, AvatarSpec> = {
  adult: {
    bg: '#dbeafe',
    shirt: '#2563eb',
    hair: '#3b2a20',
    hairPath: 'M20 26 C20 14 30 11 37 13 C43 14 46 20 44 27 C40 21 32 19 26 22 C24 23 22 25 20 26Z',
    headY: 27,
    headR: 12,
  },
  senior: {
    bg: '#ede9fe',
    shirt: '#7c3aed',
    hair: '#c9ced6',
    hairPath:
      'M26 13 a6 6 0 1 1 12 0 a6 6 0 1 1 -12 0Z M19 28 C18 17 26 13 32 14 C39 14 46 18 45 28 C42 21 36 19 32 20 C27 20 22 22 19 28Z',
    headY: 27,
    headR: 12,
    glasses: true,
  },
  child: {
    bg: '#dcfce7',
    shirt: '#22a35a',
    hair: '#6b3f1f',
    hairPath:
      'M19 31 C17 19 27 15 33 17 C41 18 46 24 45 32 C42 26 36 23 30 25 C26 23 22 26 19 31Z M28 17 C29 13 32 12 34 14',
    headY: 31,
    headR: 13,
    cheeks: true,
  },
};

function Avatar({ spec }: { spec: AvatarSpec }) {
  const { bg, shirt, hair, hairPath, headY, headR } = spec;
  return (
    <svg className="avatar" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="32" fill={bg} />
      <path d="M8 64 C10 49 20 44 32 44 S54 49 56 64Z" fill={shirt} />
      <rect x="27" y={headY + 8} width="10" height="7" rx="3" fill={SKIN} />
      <circle cx="32" cy={headY} r={headR} fill={SKIN} />
      <path d={hairPath} fill={hair} />
      <circle cx="27.5" cy={headY + 1} r="1.6" fill={INK} />
      <circle cx="36.5" cy={headY + 1} r="1.6" fill={INK} />
      <path
        d={`M28 ${String(headY + 6)} q4 3.5 8 0`}
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {spec.glasses && (
        <g fill="none" stroke={INK} strokeWidth="1.4">
          <circle cx="27.5" cy={headY + 1} r="3.8" />
          <circle cx="36.5" cy={headY + 1} r="3.8" />
          <path d={`M31.3 ${String(headY + 1)}h1.4`} />
        </g>
      )}
      {spec.cheeks && (
        <g fill="#f59fb0">
          <circle cx="24" cy={headY + 5} r="2" />
          <circle cx="40" cy={headY + 5} r="2" />
        </g>
      )}
    </svg>
  );
}

/** Avatar for a profile preset. */
export function ProfileAvatar({ profile }: { profile: ProfileId }) {
  return <Avatar spec={AVATARS[profile]} />;
}
