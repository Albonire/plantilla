import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function memoria(): Storage {
  const datos = new Map<string, string>();
  return {
    get length() {
      return datos.size;
    },
    clear: () => datos.clear(),
    getItem: (k) => datos.get(k) ?? null,
    key: (i) => [...datos.keys()][i] ?? null,
    removeItem: (k) => void datos.delete(k),
    setItem: (k, v) => void datos.set(k, v),
  };
}

describe('almacen', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads and writes with the site prefix', async () => {
    const almacen = memoria();
    vi.stubGlobal('localStorage', almacen);
    const { guardar, leer } = await import('../../src/lib/almacen');
    expect(guardar('nombre', { a: 1 })).toBe(true);
    expect(almacen.getItem('aventura_lectora:nombre')).toBe('{"a":1}');
    expect(leer('nombre', null)).toEqual({ a: 1 });
  });

  it('returns the default when the value is corrupt', async () => {
    const almacen = memoria();
    almacen.setItem('aventura_lectora:roto', '{no es json');
    vi.stubGlobal('localStorage', almacen);
    const { leer } = await import('../../src/lib/almacen');
    expect(leer('roto', 'por_defecto')).toBe('por_defecto');
  });

  it('survives a storage that throws on every access', async () => {
    const roto = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cuota llena');
      },
      removeItem: () => {
        throw new Error('bloqueado');
      },
      key: () => {
        throw new Error('bloqueado');
      },
      get length(): number {
        throw new Error('bloqueado');
      },
    };
    vi.stubGlobal('localStorage', roto);
    const { borrar, claves_con_prefijo, guardar, leer } = await import('../../src/lib/almacen');
    expect(leer('x', 7)).toBe(7);
    expect(guardar('x', 1)).toBe(false);
    expect(borrar('x')).toBe(false);
    expect(claves_con_prefijo('x')).toEqual([]);
  });

  it('works when localStorage does not exist', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { guardar, leer } = await import('../../src/lib/almacen');
    expect(leer('x', 'ok')).toBe('ok');
    expect(guardar('x', 1)).toBe(false);
  });

  it('lists keys by prefix', async () => {
    const almacen = memoria();
    vi.stubGlobal('localStorage', almacen);
    const { claves_con_prefijo, guardar } = await import('../../src/lib/almacen');
    guardar('reto:1', 1);
    guardar('reto:2', 2);
    guardar('otro', 3);
    almacen.setItem('ajeno:reto', 'x');
    expect(claves_con_prefijo('reto:').sort()).toEqual(['reto:1', 'reto:2']);
  });
});
