import { describe, expect, it } from 'vitest';
import { es_orden_correcto, mover, posiciones_correctas } from '../../src/lib/ordenar';

describe('ordenar pasos', () => {
  it('moves an item without mutating the original', () => {
    const base = ['a', 'b', 'c', 'd'];
    expect(mover(base, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(mover(base, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(base).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ignores moves outside the list', () => {
    expect(mover(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(mover(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
  });

  it('checks positions and full order', () => {
    expect(posiciones_correctas(['a', 'c', 'b'], ['a', 'b', 'c'])).toEqual([true, false, false]);
    expect(es_orden_correcto(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
    expect(es_orden_correcto(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(false);
  });
});
