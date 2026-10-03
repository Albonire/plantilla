import { describe, expect, it } from 'vitest';
import {
  destino_de,
  folio,
  id_pagina,
  orden_libro,
  pagina_de_seccion,
  paginas_caso,
  ruta_pagina,
  ruta_seccion,
  vecinos,
} from '../../src/config/paginas';

const titulos = { 1: 'Leo y comprendo', 2: 'Descubro el sendero de los textos' };

describe('paginas del caso', () => {
  it('has four pages and every section of the sheet lives on exactly one of them', () => {
    expect(paginas_caso.map((p) => p.slug)).toEqual(['abrir', 'pistas', 'lupa', 'cerrar']);
    const todas = paginas_caso.flatMap((p) => p.secciones);
    expect(new Set(todas).size).toBe(todas.length);
    expect(todas).toEqual([
      'portada',
      'mision',
      'introduccion',
      'contenidos',
      'desarrollo',
      'practica',
      'reto',
      'cierre-caso',
    ]);
  });

  it('builds routes and section links', () => {
    expect(ruta_pagina(3)).toBe('/unidad/3');
    expect(ruta_pagina(3, 'pistas')).toBe('/unidad/3/pistas');
    expect(ruta_seccion(2, 'mision')).toBe('/unidad/2#mision');
    expect(ruta_seccion(2, 'desarrollo')).toBe('/unidad/2/pistas#desarrollo');
    expect(ruta_seccion(5, 'reto')).toBe('/unidad/5/cerrar#reto');
    expect(pagina_de_seccion('practica')?.slug).toBe('lupa');
    expect(() => ruta_seccion(1, 'no-existe')).toThrow();
  });

  it('numbers pages and builds the key used to remember them', () => {
    expect(folio('abrir')).toBe('Página 1 de 4');
    expect(folio('cerrar')).toBe('Página 4 de 4');
    expect(id_pagina(4, 'lupa')).toBe('4/lupa');
  });
});

describe('orden del libro', () => {
  it('goes from the cover to the references through twenty case pages', () => {
    const orden = orden_libro();
    expect(orden).toHaveLength(2 + 20 + 2);
    expect(orden[0]).toEqual({ tipo: 'inicio' });
    expect(orden[1]).toEqual({ tipo: 'programa' });
    expect(orden.at(-2)).toEqual({ tipo: 'cierre' });
    expect(orden.at(-1)).toEqual({ tipo: 'referencias' });
  });

  it('reaches every route with next and ends on the references', () => {
    let actual = orden_libro()[0];
    const visitadas = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      const { siguiente } = vecinos(actual, titulos);
      if (!siguiente) break;
      visitadas.add(siguiente.href);
      const orden = orden_libro();
      actual = orden.find((u) => destino_de(u, titulos).href === siguiente.href) ?? actual;
    }
    expect(visitadas.size).toBe(23);
    expect(destino_de(actual).href).toBe('/referencias');
  });

  it('links the last page of a case to the first page of the next one', () => {
    const { siguiente, anterior } = vecinos({ tipo: 'caso', caso: 1, pagina: 'cerrar' }, titulos);
    expect(siguiente).toEqual({
      href: '/unidad/2',
      titulo: 'Abrir el caso',
      contexto: 'Caso 2: Descubro el sendero de los textos',
    });
    expect(anterior?.href).toBe('/unidad/1/lupa');
  });

  it('links the last case to the closing and the first page back to the program', () => {
    expect(vecinos({ tipo: 'caso', caso: 5, pagina: 'cerrar' }).siguiente?.href).toBe('/cierre');
    expect(vecinos({ tipo: 'caso', caso: 1, pagina: 'abrir' }).anterior?.href).toBe('/programa');
    expect(vecinos({ tipo: 'programa' }).anterior?.href).toBe('/');
    expect(vecinos({ tipo: 'referencias' }).siguiente).toBeNull();
    expect(vecinos({ tipo: 'inicio' }).anterior).toBeNull();
  });
});
