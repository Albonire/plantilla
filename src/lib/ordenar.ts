export function mover<T>(lista: readonly T[], desde: number, hasta: number): T[] {
  if (desde === hasta || desde < 0 || hasta < 0 || desde >= lista.length || hasta >= lista.length) {
    return [...lista];
  }
  const copia = [...lista];
  const [pieza] = copia.splice(desde, 1);
  copia.splice(hasta, 0, pieza);
  return copia;
}

export function posiciones_correctas(
  actual: readonly string[],
  correcto: readonly string[],
): boolean[] {
  return actual.map((id, i) => id === correcto[i]);
}

export function es_orden_correcto(actual: readonly string[], correcto: readonly string[]): boolean {
  return actual.length === correcto.length && actual.every((id, i) => id === correcto[i]);
}
