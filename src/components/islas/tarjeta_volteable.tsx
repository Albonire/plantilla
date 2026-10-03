import type { ReactNode } from 'react';
import { usar_movimiento } from './hooks';

interface Props {
  volteada: boolean;
  frente: ReactNode;
  reverso: ReactNode;
  className?: string;
}

// both faces share one grid cell, so the card is as tall as the taller face.
// Only the visible face is exposed to assistive technology.
export function TarjetaVolteable({ volteada, frente, reverso, className = '' }: Props) {
  const movimiento = usar_movimiento();
  const transicion = movimiento ? 'transition-transform duration-500 ease-out' : '';
  const cara =
    'col-start-1 row-start-1 [backface-visibility:hidden] rounded-card p-7 md:p-10 flex flex-col justify-center';
  return (
    <div className={`[perspective:1400px] ${className}`}>
      <div
        className={`grid ${transicion} [transform-style:preserve-3d]`}
        style={{ transform: volteada ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <div
          className={`${cara} bg-pure-white`}
          aria-hidden={volteada}
          {...(volteada ? { inert: true } : {})}
          style={{ visibility: movimiento || !volteada ? 'visible' : 'hidden' }}
        >
          {frente}
        </div>
        <div
          className={`${cara} bg-sunshine-pop`}
          style={{
            transform: 'rotateY(180deg)',
            visibility: movimiento || volteada ? 'visible' : 'hidden',
          }}
          aria-hidden={!volteada}
          {...(!volteada ? { inert: true } : {})}
        >
          {reverso}
        </div>
      </div>
    </div>
  );
}
