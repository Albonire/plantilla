import { barajar } from './semilla';
import type { Opcion } from './tipos';

export interface PreguntaBase {
  id: string;
  opciones: Opcion[];
  correcta: string;
}

// options shuffled with a stable seed, so the order is the same on every visit
export function opciones_barajadas(pregunta: PreguntaBase, semilla: string): Opcion[] {
  return barajar(pregunta.opciones, `${semilla}:${pregunta.id}`);
}

export function es_correcta(pregunta: PreguntaBase, opcion_id: string): boolean {
  return pregunta.correcta === opcion_id;
}

export type Intentos = Record<string, string[]>;

export interface ResumenQuiz {
  total: number;
  resueltas: number;
  a_la_primera: number;
}

// a question is solved once the correct option was picked; "a la primera" counts the first try
export function resumir(preguntas: PreguntaBase[], intentos: Intentos): ResumenQuiz {
  let resueltas = 0;
  let a_la_primera = 0;
  for (const p of preguntas) {
    const lista = intentos[p.id] ?? [];
    if (lista.includes(p.correcta)) resueltas++;
    if (lista.length > 0 && lista[0] === p.correcta) a_la_primera++;
  }
  return { total: preguntas.length, resueltas, a_la_primera };
}

export function registrar_intento(
  intentos: Intentos,
  pregunta_id: string,
  opcion_id: string,
): Intentos {
  const previos = intentos[pregunta_id] ?? [];
  if (previos.includes(opcion_id)) return intentos;
  return { ...intentos, [pregunta_id]: [...previos, opcion_id] };
}
