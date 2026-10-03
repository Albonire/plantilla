import { describe, expect, it } from 'vitest';
import { es_correcta, opciones_barajadas, registrar_intento, resumir } from '../../src/lib/quiz';

const preguntas = [
  {
    id: 'q1',
    correcta: 'a',
    opciones: [
      { id: 'a', texto: 'uno' },
      { id: 'b', texto: 'dos' },
      { id: 'c', texto: 'tres' },
    ],
  },
  {
    id: 'q2',
    correcta: 'a',
    opciones: [
      { id: 'a', texto: 'uno' },
      { id: 'b', texto: 'dos' },
      { id: 'c', texto: 'tres' },
    ],
  },
];

describe('quiz', () => {
  it('shuffles options with a stable seed and keeps all of them', () => {
    const uno = opciones_barajadas(preguntas[0], 'u1').map((o) => o.id);
    const dos = opciones_barajadas(preguntas[0], 'u1').map((o) => o.id);
    expect(uno).toEqual(dos);
    expect([...uno].sort()).toEqual(['a', 'b', 'c']);
  });

  it('recognizes the correct option', () => {
    expect(es_correcta(preguntas[0], 'a')).toBe(true);
    expect(es_correcta(preguntas[0], 'b')).toBe(false);
  });

  it('records attempts without repeating an option', () => {
    let intentos = registrar_intento({}, 'q1', 'b');
    intentos = registrar_intento(intentos, 'q1', 'b');
    intentos = registrar_intento(intentos, 'q1', 'a');
    expect(intentos).toEqual({ q1: ['b', 'a'] });
  });

  it('summarizes solved questions and first-try hits', () => {
    const intentos = { q1: ['b', 'a'], q2: ['a'] };
    expect(resumir(preguntas, intentos)).toEqual({ total: 2, resueltas: 2, a_la_primera: 1 });
    expect(resumir(preguntas, { q1: ['b'] })).toEqual({ total: 2, resueltas: 0, a_la_primera: 0 });
  });
});
