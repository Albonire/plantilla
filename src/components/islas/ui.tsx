import type { ReactNode } from 'react';
import {
  BookOpenText,
  ChatsCircle,
  Flag,
  Globe,
  Headphones,
  Laptop,
  MonitorPlay,
  PencilSimpleLine,
  PuzzlePiece,
} from '@phosphor-icons/react';
import { bloques, clase_pastilla, type TipoBloque } from '../../lib/bloques';

export const boton =
  'interfaz inline-flex min-h-11 items-center justify-center gap-2.5 rounded-pill border-2 border-ink-black bg-pure-white px-5 py-2 text-body-sm font-medium text-ink-black transition-colors hover:bg-sandstone disabled:pointer-events-none disabled:opacity-45';

export const boton_primario =
  'interfaz inline-flex min-h-11 items-center justify-center gap-2.5 rounded-pill border-2 border-ink-black bg-fresh-grass px-5 py-2 text-body-sm font-medium text-ink-black transition-colors hover:bg-ink-black hover:text-cream-paper disabled:pointer-events-none disabled:opacity-45';

export const boton_reto =
  'interfaz inline-flex min-h-12 items-center justify-center gap-2.5 rounded-pill border-2 border-ink-black bg-coral-pop px-6 py-3 text-body-sm font-medium text-ink-black transition-colors hover:bg-ink-black hover:text-cream-paper disabled:pointer-events-none disabled:opacity-45';

export const area_texto =
  'w-full rounded-soft border-2 border-transparent bg-sandstone p-4 text-body text-ink-black placeholder:text-stone-text focus:border-ink-black';

export const campo_texto =
  'min-h-11 w-full rounded-soft border-2 border-transparent bg-sandstone px-4 py-2 text-body text-ink-black placeholder:text-stone-text focus:border-ink-black';

const iconos = {
  lee: BookOpenText,
  mira: MonitorPlay,
  escucha: Headphones,
  practica: PuzzlePiece,
  escribe: PencilSimpleLine,
  conversa: ChatsCircle,
  web: Globe,
  reto: Flag,
} as const;

// the pill that names what the student does in a block: "Lee", "Mira", "Practica"...
export function Pastilla({ tipo }: { tipo: TipoBloque }) {
  const Icono = iconos[tipo];
  return (
    <span className={`${clase_pastilla} ${bloques[tipo].fondo}`}>
      <Icono size={18} weight="bold" aria-hidden="true" />
      {bloques[tipo].verbo}
    </span>
  );
}

interface SuperficieProps {
  children: ReactNode;
  tono?: 'blanco' | 'arena';
  className?: string;
  titulo?: string;
  etiqueta?: string;
  tipo?: TipoBloque;
  id?: string;
}

// block of the page that hosts an activity
export function Superficie({
  children,
  tono = 'blanco',
  className = '',
  titulo,
  etiqueta,
  tipo,
  id,
}: SuperficieProps) {
  const fondo = tono === 'blanco' ? 'bg-pure-white' : 'bg-sandstone';
  return (
    <section
      id={id}
      aria-label={titulo}
      className={`${fondo} rounded-card border-2 border-ink-black p-5 text-ink-black md:p-8 ${className}`}
    >
      {(titulo || etiqueta || tipo) && (
        <header className="mb-5 md:mb-6">
          {(tipo || etiqueta) && (
            <p className="interfaz flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm font-medium text-stone-text">
              {tipo && <Pastilla tipo={tipo} />}
              {etiqueta && <span>{etiqueta}</span>}
            </p>
          )}
          {titulo && (
            <h3 className="mt-3 text-[1.375rem] leading-snug md:text-[1.625rem]">{titulo}</h3>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

export function Chip({
  children,
  tono = 'arena',
}: {
  children: ReactNode;
  tono?: 'arena' | 'sol' | 'verde';
}) {
  const fondo = { arena: 'bg-sandstone', sol: 'bg-sunshine-pop', verde: 'bg-fresh-grass' }[tono];
  return (
    <span
      className={`${fondo} inline-flex items-center rounded-pill px-3 py-1 text-micro font-medium text-ink-black`}
    >
      {children}
    </span>
  );
}

// label on every digital piece
export function EtiquetaIA({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-micro text-stone-text ${className}`}>
      <Laptop size={16} weight="bold" aria-hidden="true" />
      Hecho con herramientas digitales y revisado por el equipo
    </p>
  );
}

export function Transcripcion({
  texto,
  titulo = 'Ver transcripción',
}: {
  texto: string;
  titulo?: string;
}) {
  const parrafos = texto.split(/\n+/).filter(Boolean);
  return (
    <details className="group rounded-soft bg-cream-paper">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-soft px-4 py-2 text-body-sm font-medium [&::-webkit-details-marker]:hidden">
        {titulo}
        <span className="text-stone-text group-open:hidden" aria-hidden="true">
          Abrir
        </span>
        <span className="hidden text-stone-text group-open:inline" aria-hidden="true">
          Cerrar
        </span>
      </summary>
      <div className="max-w-reading space-y-3 px-4 pb-5 text-body">
        {parrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}
