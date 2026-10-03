import type { ItemClasificar } from './tipos';

export type Asignaciones = Record<string, string | null>;
export type Resultado = 'bien' | 'mal' | 'sin_ubicar';

export interface Correccion {
  resultados: Record<string, Resultado>;
  aciertos: number;
  total: number;
  completo: boolean;
}

export function ubicar(
  asignaciones: Asignaciones,
  item_id: string,
  caja_id: string | null,
): Asignaciones {
  return { ...asignaciones, [item_id]: caja_id };
}

export function corregir(items: ItemClasificar[], asignaciones: Asignaciones): Correccion {
  const resultados: Record<string, Resultado> = {};
  let aciertos = 0;
  for (const item of items) {
    const puesta = asignaciones[item.id] ?? null;
    if (puesta === null) resultados[item.id] = 'sin_ubicar';
    else if (puesta === item.caja) {
      resultados[item.id] = 'bien';
      aciertos++;
    } else resultados[item.id] = 'mal';
  }
  const completo = items.every((i) => (asignaciones[i.id] ?? null) !== null);
  return { resultados, aciertos, total: items.length, completo };
}
