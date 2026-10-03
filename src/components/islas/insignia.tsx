// paper-cut badges, one per case. Colors come from the design tokens.

interface Props {
  caso: number;
  size?: number;
  ganada?: boolean;
  titulo?: string;
}

const TINTA = '#2c2e2a';
const CREMA = '#f5f1e4';

const BASES: Record<number, { base: string; cinta: string }> = {
  1: { base: '#e0dbce', cinta: '#ff705d' },
  2: { base: '#2ba0ff', cinta: '#f5e211' },
  3: { base: '#d5d5d4', cinta: '#2ba0ff' },
  4: { base: '#ff705d', cinta: '#8ed462' },
  5: { base: '#8ed462', cinta: '#f5e211' },
};

function Icono({ caso }: { caso: number }) {
  switch (caso) {
    case 1:
      return (
        <g>
          <path d="M66 62 L80 76" stroke="#8ed462" strokeWidth="9" strokeLinecap="round" />
          <circle cx="54" cy="50" r="16" fill="#ffffff" stroke={TINTA} strokeWidth="5" />
          <path
            d="M45 46 A10 10 0 0 1 52 40"
            stroke={CREMA}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    case 2:
      return (
        <g>
          <circle cx="60" cy="56" r="21" fill="#ffffff" stroke={TINTA} strokeWidth="3" />
          <path
            d="M60 38 L67 56 L53 56 Z"
            fill="#ff705d"
            stroke={TINTA}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M60 74 L67 56 L53 56 Z" fill={TINTA} />
          <circle cx="60" cy="56" r="3" fill={CREMA} stroke={TINTA} strokeWidth="1.5" />
        </g>
      );
    case 3:
      return (
        <g>
          <path d="M72 68 L86 82" stroke={TINTA} strokeWidth="8" strokeLinecap="round" />
          <circle cx="56" cy="52" r="22" fill="#f5e211" stroke={TINTA} strokeWidth="3" />
          <circle cx="56" cy="52" r="14.5" fill={CREMA} stroke={TINTA} strokeWidth="3" />
          <circle cx="56" cy="52" r="7" fill="#ffffff" stroke={TINTA} strokeWidth="3" />
        </g>
      );
    case 4:
      return (
        <g>
          <path
            d="M60 31 L83 40 V58 C83 73 73 81 60 86 C47 81 37 73 37 58 V40 Z"
            fill="#ffffff"
            stroke={TINTA}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M48 58 L56 66 L73 47"
            stroke={TINTA}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      );
    default:
      return (
        <g>
          <path
            d="M82 46 Q91 56 82 66"
            stroke={TINTA}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M88 39 Q102 56 88 73"
            stroke={TINTA}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M42 51 L74 38 L74 74 L42 61 Z"
            fill="#f5e211"
            stroke={TINTA}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect
            x="32"
            y="49"
            width="12"
            height="14"
            rx="3"
            fill="#ff705d"
            stroke={TINTA}
            strokeWidth="3"
          />
        </g>
      );
  }
}

export function Insignia({ caso, size = 120, ganada = true, titulo }: Props) {
  const { base, cinta } = BASES[caso] ?? BASES[1];
  return (
    <svg
      viewBox="0 0 120 132"
      width={size}
      height={(size * 132) / 120}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
      style={{ opacity: ganada ? 1 : 0.35, filter: ganada ? 'none' : 'grayscale(1)' }}
    >
      <path
        d="M40 92 L28 128 L45 119 L53 129 L60 96 Z"
        fill={cinta}
        stroke={TINTA}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M80 92 L92 128 L75 119 L67 129 L60 96 Z"
        fill={cinta}
        stroke={TINTA}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle
        cx="60"
        cy="56"
        r="48"
        fill={base}
        stroke={TINTA}
        strokeWidth="3"
        strokeDasharray={ganada ? undefined : '6 5'}
      />
      <circle cx="60" cy="56" r="38" fill={CREMA} stroke={TINTA} strokeWidth="2" />
      <Icono caso={caso} />
    </svg>
  );
}
