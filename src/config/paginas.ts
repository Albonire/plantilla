// pages of the book. Each case is split in four pages that mirror the four moments of the course path.
// The unit MDX keeps the whole case in one file; each route shows the sections that belong to its page.

export type SlugPagina = 'abrir' | 'pistas' | 'lupa' | 'cerrar';

export interface PaginaCaso {
  slug: SlugPagina;
  // path segment after /unidad/N ('' for the first page)
  segmento: string;
  titulo: string;
  momento: string;
  descripcion: string;
  // ids of the sections of the design sheet that live on this page
  secciones: string[];
}

export const paginas_caso: PaginaCaso[] = [
  {
    slug: 'abrir',
    segmento: '',
    titulo: 'Abrir el caso',
    momento: 'Exploración',
    descripcion: 'Activamos lo que ya sabemos, miramos imágenes y títulos, predecimos.',
    secciones: ['portada', 'mision', 'introduccion', 'contenidos'],
  },
  {
    slug: 'pistas',
    segmento: '/pistas',
    titulo: 'Seguir las pistas',
    momento: 'Estructuración',
    descripcion:
      'Leemos con pausas, vemos el material de estudio y aprendemos los conceptos del caso.',
    secciones: ['desarrollo'],
  },
  {
    slug: 'lupa',
    segmento: '/lupa',
    titulo: 'Entrenar la lupa',
    momento: 'Práctica',
    descripcion:
      'Resolvemos actividades interactivas con retroalimentación inmediata. Nos podemos equivocar y volver a intentar.',
    secciones: ['practica'],
  },
  {
    slug: 'cerrar',
    segmento: '/cerrar',
    titulo: 'Cerrar el caso',
    momento: 'Valoración',
    descripcion: 'Hacemos el reto del caso, nos autoevaluamos y ganamos la insignia.',
    secciones: ['reto', 'cierre-caso'],
  },
];

export const TOTAL_CASOS = 5;

export function pagina_por_slug(slug: string): PaginaCaso | undefined {
  return paginas_caso.find((p) => p.slug === slug);
}

export function pagina_de_seccion(id_seccion: string): PaginaCaso | undefined {
  return paginas_caso.find((p) => p.secciones.includes(id_seccion));
}

export function ruta_pagina(caso: number, slug: SlugPagina = 'abrir'): string {
  const pagina = pagina_por_slug(slug);
  if (!pagina) throw new Error(`pagina desconocida: ${slug}`);
  return `/unidad/${caso}${pagina.segmento}`;
}

// link to a section of the design sheet, wherever it lives now
export function ruta_seccion(caso: number, id_seccion: string): string {
  const pagina = pagina_de_seccion(id_seccion);
  if (!pagina) throw new Error(`seccion desconocida: ${id_seccion}`);
  return `${ruta_pagina(caso, pagina.slug)}#${id_seccion}`;
}

// key used to remember which pages the student already read
export function id_pagina(caso: number, slug: SlugPagina): string {
  return `${caso}/${slug}`;
}

export function folio(slug: SlugPagina): string {
  const indice = paginas_caso.findIndex((p) => p.slug === slug);
  return `Página ${indice + 1} de ${paginas_caso.length}`;
}

export type Ubicacion =
  | { tipo: 'inicio' }
  | { tipo: 'programa' }
  | { tipo: 'caso'; caso: number; pagina: SlugPagina }
  | { tipo: 'cierre' }
  | { tipo: 'referencias' };

export interface Destino {
  href: string;
  titulo: string;
  contexto: string;
}

// reading order of the whole book: cover, program, five cases of four pages, closing, references
export function orden_libro(total_casos: number = TOTAL_CASOS): Ubicacion[] {
  const orden: Ubicacion[] = [{ tipo: 'inicio' }, { tipo: 'programa' }];
  for (let caso = 1; caso <= total_casos; caso += 1) {
    for (const pagina of paginas_caso) orden.push({ tipo: 'caso', caso, pagina: pagina.slug });
  }
  orden.push({ tipo: 'cierre' }, { tipo: 'referencias' });
  return orden;
}

export function destino_de(
  ubicacion: Ubicacion,
  titulos_casos: Record<number, string> = {},
): Destino {
  switch (ubicacion.tipo) {
    case 'inicio':
      return { href: '/', titulo: 'Índice del curso', contexto: 'Portada' };
    case 'programa':
      return { href: '/programa', titulo: 'Programa del curso', contexto: 'Antes de empezar' };
    case 'cierre':
      return { href: '/cierre', titulo: 'Expediente y certificado', contexto: 'Cierre del curso' };
    case 'referencias':
      return { href: '/referencias', titulo: 'Referencias', contexto: 'Última página del libro' };
    case 'caso': {
      const pagina = pagina_por_slug(ubicacion.pagina);
      if (!pagina) throw new Error(`pagina desconocida: ${ubicacion.pagina}`);
      const nombre = titulos_casos[ubicacion.caso];
      return {
        href: ruta_pagina(ubicacion.caso, ubicacion.pagina),
        titulo: pagina.titulo,
        contexto: nombre ? `Caso ${ubicacion.caso}: ${nombre}` : `Caso ${ubicacion.caso}`,
      };
    }
  }
}

function coincide(a: Ubicacion, b: Ubicacion): boolean {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === 'caso' && b.tipo === 'caso') return a.caso === b.caso && a.pagina === b.pagina;
  return true;
}

export interface Vecinos {
  anterior: Destino | null;
  siguiente: Destino | null;
}

// previous and next page in reading order (the last page of a case leads to the next case)
export function vecinos(
  ubicacion: Ubicacion,
  titulos_casos: Record<number, string> = {},
  total_casos: number = TOTAL_CASOS,
): Vecinos {
  const orden = orden_libro(total_casos);
  const indice = orden.findIndex((u) => coincide(u, ubicacion));
  if (indice === -1) return { anterior: null, siguiente: null };
  const previa = orden[indice - 1];
  const proxima = orden[indice + 1];
  return {
    anterior: previa ? destino_de(previa, titulos_casos) : null,
    siguiente: proxima ? destino_de(proxima, titulos_casos) : null,
  };
}
