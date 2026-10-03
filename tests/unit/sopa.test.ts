import { describe, expect, it } from 'vitest';
import {
  celdas_de_linea,
  generar_sopa,
  normalizar,
  palabra_en_seleccion,
} from '../../src/lib/sopa';

const PALABRAS = [
  'LIEBRE',
  'TORTUGA',
  'CARRERA',
  'META',
  'APUESTA',
  'SIESTA',
  'CONSTANCIA',
  'ORGULLO',
];

describe('sopa de letras', () => {
  it('normalizes accents but keeps the enie', () => {
    expect(normalizar('Cigüeña')).toBe('CIGUEÑA');
    expect(normalizar('canción')).toBe('CANCION');
  });

  it('places every word inside the grid', () => {
    const sopa = generar_sopa(PALABRAS, 12, 'unidad-1');
    expect(sopa.colocaciones).toHaveLength(PALABRAS.length);
    for (const c of sopa.colocaciones) {
      for (let i = 0; i < c.palabra.length; i++) {
        const f = c.fila + c.dfila * i;
        const col = c.col + c.dcol * i;
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThan(12);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(12);
        expect(sopa.celdas[f][col]).toBe(c.palabra[i]);
      }
    }
  });

  it('fills every cell with a letter', () => {
    const sopa = generar_sopa(PALABRAS, 12, 'unidad-1');
    expect(sopa.celdas.flat().every((c) => /^[A-ZÑ]$/.test(c))).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const a = generar_sopa(PALABRAS, 12, 'clase');
    const b = generar_sopa(PALABRAS, 12, 'clase');
    expect(a.celdas).toEqual(b.celdas);
  });

  it('can find every placed word by selecting its ends, in both directions', () => {
    const sopa = generar_sopa(PALABRAS, 12, 'unidad-1');
    for (const c of sopa.colocaciones) {
      const inicio = { fila: c.fila, col: c.col };
      const fin = {
        fila: c.fila + c.dfila * (c.palabra.length - 1),
        col: c.col + c.dcol * (c.palabra.length - 1),
      };
      expect(palabra_en_seleccion(sopa, inicio, fin)).toBe(c.palabra);
      expect(palabra_en_seleccion(sopa, fin, inicio)).toBe(c.palabra);
    }
  });

  it('rejects selections that are not a straight line', () => {
    expect(celdas_de_linea({ fila: 0, col: 0 }, { fila: 1, col: 2 })).toBeNull();
    expect(celdas_de_linea({ fila: 0, col: 0 }, { fila: 2, col: 2 })).toHaveLength(3);
  });

  it('throws when a word cannot fit', () => {
    expect(() => generar_sopa(['ABCDEFGHIJKLM'], 8, 'x')).toThrow();
  });
});
