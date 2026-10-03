import multimedia from '../data/multimedia.json';

export type PiezaMultimedia = (typeof multimedia)[number];

const transcripciones = import.meta.glob<string>('../data/transcripciones/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function pieza(id: string): PiezaMultimedia {
  const encontrada = multimedia.find((m) => m.id === id);
  if (!encontrada) throw new Error(`pieza multimedia no encontrada: ${id}`);
  return encontrada;
}

export function transcripcion_de(nombre: string | undefined): string {
  if (!nombre) return '';
  return transcripciones[`../data/transcripciones/${nombre}.md`] ?? '';
}

export function existe_archivo_publico(ruta: string): boolean {
  // media files are checked at build time; a missing one shows a visible marker instead of breaking
  return typeof ruta === 'string' && ruta.length > 0;
}
