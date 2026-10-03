import { describe, expect, it } from 'vitest';
import { corregir, ubicar } from '../../src/lib/clasificar';
import { corregir_estrofas, type Estrofa } from '../../src/lib/resaltador';

const items = [
  { id: 'a', texto: 'Había una vez...', caja: 'narrativo' },
  { id: 'b', texto: 'Paso 1: lava las manos.', caja: 'instructivo' },
  { id: 'c', texto: 'Bogotá nació en 1538.', caja: 'informativo' },
];

describe('DragSort correction', () => {
  it('marks each card as right, wrong or not placed', () => {
    let asignaciones = ubicar({}, 'a', 'narrativo');
    asignaciones = ubicar(asignaciones, 'b', 'informativo');
    const r = corregir(items, asignaciones);
    expect(r.resultados).toEqual({ a: 'bien', b: 'mal', c: 'sin_ubicar' });
    expect(r.aciertos).toBe(1);
    expect(r.completo).toBe(false);
  });

  it('is complete and perfect when every card is in its box', () => {
    const asignaciones = { a: 'narrativo', b: 'instructivo', c: 'informativo' };
    const r = corregir(items, asignaciones);
    expect(r.aciertos).toBe(3);
    expect(r.completo).toBe(true);
  });

  it('lets a card go back to the tray', () => {
    const asignaciones = ubicar({ a: 'narrativo' }, 'a', null);
    expect(corregir(items, asignaciones).resultados.a).toBe('sin_ubicar');
  });
});

describe('TextHighlighter correction', () => {
  const estrofas: Estrofa[] = [
    { id: 'e1', versos: ['uno', 'dos'], parte: 'inicio' },
    { id: 'e2', versos: ['tres', 'cuatro'], parte: 'nudo' },
    { id: 'e3', versos: ['cinco', 'seis'], parte: 'desenlace' },
  ];

  it('checks each stanza against its part of the story', () => {
    const r = corregir_estrofas(estrofas, { e1: 'inicio', e2: 'desenlace', e3: 'desenlace' });
    expect(r.resultados).toEqual({ e1: 'bien', e2: 'mal', e3: 'bien' });
    expect(r.aciertos).toBe(2);
    expect(r.total).toBe(3);
  });
});
