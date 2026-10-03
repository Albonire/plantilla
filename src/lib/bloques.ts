// kinds of activity block of a book page. Each one has a verb the student reads first,
// an icon and a fill color (the color never carries the meaning alone: the verb is always written).
export type TipoBloque =
  'lee' | 'mira' | 'escucha' | 'practica' | 'escribe' | 'conversa' | 'web' | 'reto';

export const bloques: Record<TipoBloque, { verbo: string; fondo: string }> = {
  lee: { verbo: 'Lee', fondo: 'bg-sunshine-pop' },
  mira: { verbo: 'Mira', fondo: 'bg-sky-pop' },
  escucha: { verbo: 'Escucha', fondo: 'bg-sky-pop' },
  practica: { verbo: 'Practica', fondo: 'bg-fresh-grass' },
  escribe: { verbo: 'Escribe', fondo: 'bg-sunshine-pop' },
  conversa: { verbo: 'Conversa', fondo: 'bg-fresh-grass' },
  web: { verbo: 'Explora en la web', fondo: 'bg-sandstone' },
  reto: { verbo: 'Reto del caso', fondo: 'bg-coral-pop' },
};

export const clase_pastilla =
  'interfaz inline-flex items-center gap-2 rounded-pill border-2 border-ink-black px-3 py-1 text-body-sm font-medium text-ink-black';
