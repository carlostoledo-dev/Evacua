// Decorative icons drawn for this project. Always paired with visible text, so hidden from
// assistive technology. Shapes use `currentColor` to follow the surrounding text color.
import type { ComponentType, ReactNode } from 'react';
import type { HazardId } from '../../domain/hazards.ts';

interface IconProps {
  className?: string;
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ?? 'icon'}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 10v5" />
      <path d="M12 18h.01" />
    </Svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Svg>
  );
}

export function HourglassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 5 10 5 10 9s-10 4-10 9" />
      <path d="M17 3c0 5-10 5-10 9s10 4 10 9" />
    </Svg>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </Svg>
  );
}

export function SignalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 9a15 15 0 0 1 20 0" />
      <path d="M5.5 12.5a10 10 0 0 1 13 0" />
      <path d="M9 16a5 5 0 0 1 6 0" />
      <path d="M12 19.5h.01" />
    </Svg>
  );
}

export function NoSignalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 16a5 5 0 0 1 6 0" />
      <path d="M12 19.5h.01" />
      <path d="M5.5 12.5a10 10 0 0 1 4-2.2M14.5 10.3a10 10 0 0 1 4 2.2" />
      <path d="m3 3 18 18" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </Svg>
  );
}

export function WaveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
      <path d="M4 12c0-4 3-8 8-8 3 0 5 2 5 4-2-1-5 0-5 3 0 2 1 3 3 3" />
    </Svg>
  );
}

export function QuakeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 12h3l2-6 3 12 3-9 2 5 2-2h5" />
    </Svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 3 2.5 3-3Z" />
    </Svg>
  );
}

export const HAZARD_ICONS: Record<HazardId, ComponentType<IconProps>> = {
  tsunami: WaveIcon,
  earthquake: QuakeIcon,
  wildfire: FlameIcon,
};

export function MapIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </Svg>
  );
}

export function GuideIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </Svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </Svg>
  );
}

export function AutoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" />
    </Svg>
  );
}

export function ChildIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M12 11.5v5M9 21l3-4.5 3 4.5M8.5 14h7" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </Svg>
  );
}

export function TimerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </Svg>
  );
}

export function InstallIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M12 7v7M9 11l3 3 3-3M10 18h4" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

/** iOS "Share" button: a box with an arrow leaving it. */
export function ShareIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
    </Svg>
  );
}

export function WalkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="13" cy="4" r="2" />
      <path d="m9 21 2.5-6 2.5 2v4M7 11l3-3.5 3.5-.5 2 3.5 2.5 1" />
      <path d="M13.5 7 11.5 15" />
    </Svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}
