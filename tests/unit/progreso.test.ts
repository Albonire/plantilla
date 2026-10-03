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

describe('progreso', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', memoria());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tracks visited and solved cases', async () => {
    const p = await import('../../src/lib/progreso');
    expect(p.estado_de(1, p.leer_progreso())).toBe('sin_empezar');
    p.marcar_visitado(1);
    expect(p.estado_de(1, p.leer_progreso())).toBe('en_curso');
    p.marcar_resuelto(1);
    p.marcar_resuelto(1);
    const actual = p.leer_progreso();
    expect(actual.resueltos).toEqual([1]);
    expect(p.estado_de(1, actual)).toBe('resuelto');
  });

  it('remembers the last place', async () => {
    const p = await import('../../src/lib/progreso');
    p.guardar_lugar('/unidad/3', 'practica');
    expect(p.leer_progreso().ultimo).toEqual({ ruta: '/unidad/3', seccion: 'practica' });
  });

  it('remembers read pages without duplicates', async () => {
    const p = await import('../../src/lib/progreso');
    p.marcar_pagina_leida('2/pistas');
    p.marcar_pagina_leida('2/pistas');
    p.marcar_pagina_leida('2/lupa');
    expect(p.leer_progreso().paginas_leidas).toEqual(['2/pistas', '2/lupa']);
  });

  it('reads progress saved before pages existed', async () => {
    localStorage.setItem(
      'aventura_lectora:progreso',
      JSON.stringify({ resueltos: [1], visitados: [1, 2], ultimo: null }),
    );
    const p = await import('../../src/lib/progreso');
    const actual = p.leer_progreso();
    expect(actual.paginas_leidas).toEqual([]);
    expect(actual.visitados).toEqual([1, 2]);
    p.marcar_pagina_leida('1/abrir');
    expect(p.leer_progreso().resueltos).toEqual([1]);
  });
});
