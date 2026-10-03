import { describe, expect, it } from 'vitest';
import { codificar, combinar, decodificar, type Muro } from '../../src/lib/muro';

const muro: Muro = {
  version: 1,
  muro_id: 'caso_5',
  notas: [
    {
      id: 'n1',
      columna: 'constancia',
      autor: 'Detective Lupa',
      texto: 'Yo pienso que la constancia es más importante porque quien no se rinde llega.',
      respuestas: [],
    },
  ],
};

describe('muro', () => {
  it('survives an encode and decode round trip', async () => {
    const cadena = await codificar(muro);
    expect(cadena).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodificar(cadena)).toEqual(muro);
  });

  it('returns null for garbage input', async () => {
    expect(await decodificar('esto-no-es-un-muro')).toBeNull();
    expect(await decodificar('')).toBeNull();
  });

  it('merges shared notes and replies without duplicates', () => {
    const recibido: Muro = {
      ...muro,
      notas: [
        {
          ...muro.notas[0],
          respuestas: [{ id: 'r1', autor: 'Detective Sol', texto: 'Entiendo tu idea, pero...' }],
        },
        {
          id: 'n2',
          columna: 'velocidad',
          autor: 'Detective Sol',
          texto: 'La velocidad ayuda.',
          respuestas: [],
        },
      ],
    };
    const resultado = combinar(muro, recibido);
    expect(resultado.notas).toHaveLength(2);
    expect(resultado.notas[0].respuestas).toHaveLength(1);
    expect(combinar(resultado, recibido).notas[0].respuestas).toHaveLength(1);
  });
});
