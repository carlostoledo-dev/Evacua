/** Decorative welcome illustration (drawn for Evacua): a map card with a route to safe ground. */
export function WelcomeArt() {
  return (
    <svg
      className="welcome-art"
      viewBox="0 0 240 160"
      width="240"
      height="160"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id="welcome-hatch"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="3" height="10" className="art-hatch" />
        </pattern>
      </defs>
      <rect x="8" y="8" width="224" height="144" rx="22" className="art-card" />
      <path
        d="M8 96 Q60 80 96 104 T176 92 L176 152 L30 152 Q8 152 8 130 Z"
        className="art-danger"
      />
      <path
        d="M8 96 Q60 80 96 104 T176 92 L176 152 L30 152 Q8 152 8 130 Z"
        fill="url(#welcome-hatch)"
      />
      <path
        d="M176 92 Q200 70 232 66 L232 30 Q232 8 210 8 L120 8 Q150 40 176 92 Z"
        className="art-safe"
      />
      <path d="M58 128 C80 118 92 98 118 92 S168 70 196 44" className="art-route" />
      <circle cx="58" cy="128" r="9" className="art-you" />
      <circle cx="196" cy="44" r="12" className="art-goal" />
      <path d="M190 44l4 4 8-9" className="art-check" />
    </svg>
  );
}
