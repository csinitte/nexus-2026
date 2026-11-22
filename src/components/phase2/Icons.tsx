import type { ReactNode, SVGProps } from 'react';

/** Line icons drawn for the jury screens — 24px grid, 1.6 stroke, NEXUS green via currentColor. */
export type IconName =
  | 'jury'
  | 'grid'
  | 'check'
  | 'trophy'
  | 'key'
  | 'panels'
  | 'timer'
  | 'comments'
  | 'podium'
  | 'innovation'
  | 'relevance'
  | 'technical'
  | 'demo'
  | 'presentation'
  | 'play'
  | 'pause'
  | 'reset'
  | 'next'
  | 'shuffle'
  | 'bell'
  | 'lock'
  | 'user';

const P: Record<IconName, ReactNode> = {
  jury: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.9-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 14.3c2.3.2 4.3 1.9 5 4.7" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
    </>
  ),
  check: (
    <>
      <path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0Z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" />
      <path d="M12 13v4M8.5 20h7M10 17h4" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 7l2 2M14 9l1.5 1.5" />
    </>
  ),
  panels: (
    <>
      <rect x="3.5" y="5" width="7.5" height="14" rx="1" />
      <rect x="13" y="5" width="7.5" height="14" rx="1" />
      <path d="M6 9h2.5M6 12h2.5M15.5 9H18M15.5 12H18" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 9.5v4l2.5 2M9.5 3h5M12 3v3.5" />
    </>
  ),
  comments: (
    <>
      <path d="M4 5h12v8H9l-3 3v-3H4Z" />
      <path d="M16 9h4v8h-2v3l-3-3h-4v-2" />
    </>
  ),
  podium: (
    <>
      <path d="M9 9h6v11H9ZM3 13h6v7H3ZM15 15h6v5h-6Z" />
      <path d="m12 3 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 5.3l2-.3Z" />
    </>
  ),
  innovation: (
    <>
      <path d="M9 17h6M10 20h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  relevance: (
    <>
      <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
      <path d="M5 19 13 11" />
    </>
  ),
  technical: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </>
  ),
  demo: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="m10.5 8 4 2.5-4 2.5ZM8 20h8M12 16.5V20" />
    </>
  ),
  presentation: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7Z" />,
  pause: <path d="M7 5h3.5v14H7ZM13.5 5H17v14h-3.5Z" />,
  reset: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  next: <path d="m6 5 9 7-9 7ZM17 5v14" />,
  shuffle: (
    <>
      <path d="M3 7h3.5c4 0 6.5 10 11 10H21M3 17h3.5c1.7 0 3-1.7 4.2-3.8M13.3 9.8C14.5 8.1 15.8 7 17.5 7H21" />
      <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="p2-icon"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
