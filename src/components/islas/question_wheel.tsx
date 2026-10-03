import { useMemo, useRef, useState } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';
import { usar_movimiento } from './hooks';
import { Superficie, boton_primario } from './ui';

interface Props {
  preguntas: string[];
  titulo?: string;
  etiqueta?: string;
}

const COLORES = ['#8ed462', '#2ba0ff', '#f5e211', '#ff705d'];

function punto(radio: number, angulo: number): [number, number] {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return [100 + radio * Math.cos(rad), 100 + radio * Math.sin(rad)];
}

function sector(i: number, n: number): string {
  const paso = 360 / n;
  const [x1, y1] = punto(94, i * paso);
  const [x2, y2] = punto(94, (i + 1) * paso);
  return `M100 100 L${x1.toFixed(2)} ${y1.toFixed(2)} A94 94 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export function QuestionWheel({ preguntas, titulo = 'Ruleta de preguntas', etiqueta }: Props) {
  const movimiento = usar_movimiento();
  const [rotacion, set_rotacion] = useState(0);
  const [elegida, set_elegida] = useState<number | null>(null);
  const [girando, set_girando] = useState(false);
  const temporizador = useRef<number>(0);
  const n = preguntas.length;
  const paso = 360 / n;

  const sectores = useMemo(() => Array.from({ length: n }, (_, i) => i), [n]);

  function girar() {
    if (girando) return;
    const destino = Math.floor(Math.random() * n);
    set_elegida(null);
    if (!movimiento) {
      set_elegida(destino);
      return;
    }
    set_girando(true);
    const vueltas = 360 * (Math.floor(rotacion / 360) + 5);
    const ajuste = (360 - (destino * paso + paso / 2)) % 360;
    set_rotacion(vueltas + ajuste);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      set_girando(false);
      set_elegida(destino);
    }, 3300);
  }

  return (
    <Superficie tipo="conversa" titulo={titulo} etiqueta={etiqueta}>
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="relative mx-auto w-full max-w-[22rem]">
          <svg viewBox="0 0 200 212" className="w-full" aria-hidden="true" focusable="false">
            <g
              style={{
                transformOrigin: '100px 100px',
                transform: `rotate(${rotacion}deg)`,
                transition: movimiento ? 'transform 3.2s cubic-bezier(0.15, 0.7, 0.15, 1)' : 'none',
              }}
            >
              {sectores.map((i) => {
                const [tx, ty] = punto(66, i * paso + paso / 2);
                return (
                  <g key={i}>
                    <path
                      d={sector(i, n)}
                      fill={COLORES[i % COLORES.length]}
                      stroke="#2c2e2a"
                      strokeWidth="2"
                    />
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="15"
                      fontWeight="500"
                      fill="#2c2e2a"
                    >
                      {i + 1}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="14" fill="#f5f1e4" stroke="#2c2e2a" strokeWidth="2" />
            </g>
            <path d="M92 4 L108 4 L100 22 Z" fill="#2c2e2a" transform="translate(0 -2)" />
          </svg>
        </div>

        <div>
          <button type="button" className={boton_primario} onClick={girar} disabled={girando}>
            <ArrowClockwise size={20} weight="bold" aria-hidden="true" />
            {girando ? 'Girando...' : 'Girar la ruleta'}
          </button>
          <div
            role="status"
            aria-live="polite"
            className="mt-6 min-h-24 rounded-soft bg-cream-paper p-5"
          >
            {elegida === null ? (
              <p className="text-body text-stone-text">
                Gira la ruleta y responde en voz alta o con tu pareja.
              </p>
            ) : (
              <>
                <p className="text-body-sm font-medium text-stone-text">Pregunta {elegida + 1}</p>
                <p className="mt-1 text-subheading font-medium">{preguntas[elegida]}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <details className="mt-8 rounded-soft bg-cream-paper">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-body-sm font-medium">
          Ver todas las preguntas
        </summary>
        <ol className="list-decimal space-y-2 px-4 pb-5 pl-9 text-body">
          {preguntas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </details>
    </Superficie>
  );
}
