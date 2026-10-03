import { corregir, type Asignaciones, type Correccion } from './clasificar';
import type { ItemClasificar } from './tipos';

export interface Estrofa {
  id: string;
  versos: string[];
  parte: 'inicio' | 'nudo' | 'desenlace';
}

// each stanza is an item and its part of the story is the box it belongs to
export function corregir_estrofas(estrofas: Estrofa[], marcas: Asignaciones): Correccion {
  const items: ItemClasificar[] = estrofas.map((e) => ({
    id: e.id,
    texto: e.versos.join(' '),
    caja: e.parte,
  }));
  return corregir(items, marcas);
}
