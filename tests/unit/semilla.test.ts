import { describe, expect, it } from 'vitest';
import { aleatorio_con_semilla, barajar, hash_texto } from '../../src/lib/semilla';

describe('semilla', () => {
  it('gives the same sequence for the same seed', () => {
    const a = aleatorio_con_semilla(42);
    const b = aleatorio_con_semilla(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('hashes text deterministically', () => {
    expect(hash_texto('caso 1')).toBe(hash_texto('caso 1'));
    expect(hash_texto('caso 1')).not.toBe(hash_texto('caso 2'));
  });

  it('shuffles into a stable permutation', () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    const uno = barajar(base, 'u1');
    const dos = barajar(base, 'u1');
    expect(uno).toEqual(dos);
    expect([...uno].sort()).toEqual(base);
    expect(base).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('changes the order with another seed', () => {
    const base = Array.from({ length: 20 }, (_, i) => i);
    expect(barajar(base, 'a')).not.toEqual(barajar(base, 'b'));
  });
});
