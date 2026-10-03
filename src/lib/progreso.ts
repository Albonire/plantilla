import { leer, guardar } from './almacen';

export interface Progreso {
  resueltos: number[];
  visitados: number[];
  // pages already read, as "caso/pagina" (for example "2/pistas")
  paginas_leidas: string[];
  ultimo: { ruta: string; seccion: string } | null;
}

const VACIO: Progreso = { resueltos: [], visitados: [], paginas_leidas: [], ultimo: null };

export function leer_progreso(): Progreso {
  const dato = leer<Progreso>('progreso', VACIO);
  return {
    resueltos: Array.isArray(dato.resueltos) ? dato.resueltos : [],
    visitados: Array.isArray(dato.visitados) ? dato.visitados : [],
    paginas_leidas: Array.isArray(dato.paginas_leidas) ? dato.paginas_leidas : [],
    ultimo: dato.ultimo ?? null,
  };
}

function actualizar(cambio: (p: Progreso) => Progreso): Progreso {
  const nuevo = cambio(leer_progreso());
  guardar('progreso', nuevo);
  return nuevo;
}

export function marcar_visitado(caso: number): Progreso {
  return actualizar((p) =>
    p.visitados.includes(caso) ? p : { ...p, visitados: [...p.visitados, caso].sort() },
  );
}

export function marcar_resuelto(caso: number): Progreso {
  return actualizar((p) =>
    p.resueltos.includes(caso) ? p : { ...p, resueltos: [...p.resueltos, caso].sort() },
  );
}

export function marcar_pagina_leida(id: string): Progreso {
  return actualizar((p) =>
    p.paginas_leidas.includes(id) ? p : { ...p, paginas_leidas: [...p.paginas_leidas, id] },
  );
}

export function guardar_lugar(ruta: string, seccion: string): Progreso {
  return actualizar((p) => ({ ...p, ultimo: { ruta, seccion } }));
}

export type EstadoCaso = 'sin_empezar' | 'en_curso' | 'resuelto';

export function estado_de(caso: number, p: Progreso): EstadoCaso {
  if (p.resueltos.includes(caso)) return 'resuelto';
  if (p.visitados.includes(caso)) return 'en_curso';
  return 'sin_empezar';
}
