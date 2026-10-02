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
