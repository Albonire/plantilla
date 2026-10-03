import { describe, expect, it } from 'vitest';
import { armar_texto, conectores_usados, contar_palabras } from '../../src/lib/opinion';

const CONECTORES = ['porque', 'por ejemplo', 'además', 'sin embargo', 'en conclusión'];

describe('opinion text', () => {
  it('assembles the blocks in tower order with their starters and closing dots', () => {
    const texto = armar_texto({
      conclusion: 'vale más no rendirse',
      opinion: 'la constancia es más importante',
      razon_1: 'quien no se rinde llega',
    });
    expect(texto).toBe(
      'Yo pienso que la constancia es más importante. porque quien no se rinde llega. En conclusión, vale más no rendirse.',
    );
  });

  it('keeps existing final punctuation and skips empty blocks', () => {
    expect(armar_texto({ opinion: 'me gusta leer!', razon_1: '   ' })).toBe(
      'Yo pienso que me gusta leer!',
    );
  });

  it('detects connectors ignoring accents and case', () => {
    const texto = 'Yo pienso que sí. Además, ADEMAS no. En conclusión, por ejemplo, porque sí.';
    expect(conectores_usados(texto, CONECTORES)).toEqual([
      'porque',
      'por ejemplo',
      'además',
      'en conclusión',
    ]);
  });

  it('counts words', () => {
    expect(contar_palabras('  uno dos   tres ')).toBe(3);
    expect(contar_palabras('')).toBe(0);
  });
});
