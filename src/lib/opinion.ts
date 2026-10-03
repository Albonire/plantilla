// building blocks of the opinion text, shared by the argument builder and the challenge card

export interface BloqueOpinion {
  id: string;
  etiqueta: string;
  inicio: string;
  obligatorio: boolean;
}

// bottom of the tower first
export const BLOQUES_OPINION: BloqueOpinion[] = [
  { id: 'opinion', etiqueta: 'Mi opinión', inicio: 'Yo pienso que', obligatorio: true },
  { id: 'razon_1', etiqueta: 'Razón', inicio: 'porque', obligatorio: true },
  { id: 'ejemplo', etiqueta: 'Ejemplo', inicio: 'Por ejemplo,', obligatorio: true },
  { id: 'razon_2', etiqueta: 'Otra razón', inicio: 'Además,', obligatorio: true },
  {
    id: 'contraria',
    etiqueta: 'Otra mirada (opcional)',
    inicio: 'Sin embargo,',
    obligatorio: false,
  },
  { id: 'conclusion', etiqueta: 'Conclusión', inicio: 'En conclusión,', obligatorio: true },
];

export function armar_texto(valores: Record<string, string>): string {
  return BLOQUES_OPINION.filter((b) => (valores[b.id] ?? '').trim())
    .map((b) => {
      const cuerpo = (valores[b.id] ?? '').trim();
      const cierre = /[.!?]$/.test(cuerpo) ? '' : '.';
      return `${b.inicio} ${cuerpo}${cierre}`;
    })
    .join(' ');
}

const plano = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function conectores_usados(texto: string, conectores: string[]): string[] {
  const base = plano(texto);
  return conectores.filter((c) => base.includes(plano(c)));
}

export function contar_palabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}
