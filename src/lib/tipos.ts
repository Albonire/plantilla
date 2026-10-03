// shared data shapes for the activity json files (src/data/actividades/unidad_N.json)

export interface Opcion {
  id: string;
  texto: string;
}

export interface Pregunta {
  id: string;
  nivel: string;
  pregunta: string;
  opciones: Opcion[];
  correcta: string;
  retro: string;
  // optional context shown above the question (a clue sentence or a made-up headline)
  frase?: string;
  ficha?: string;
  marca?: string;
}

export interface Pista {
  id: string;
  frase: string;
  opciones: Opcion[];
  correcta: string;
  explicacion: string;
}

export interface ItemClasificar {
  id: string;
  texto: string;
  caja: string;
}

export interface CajaClasificar {
  id: string;
  titulo: string;
  descripcion?: string;
}

export interface Tarjeta {
  frente: string;
  reverso: string;
}

export interface CriterioRubrica {
  criterio: string;
  superior: string;
  alto: string;
  basico: string;
  bajo: string;
}

export interface CampoReto {
  id: string;
  grupo?: string;
  etiqueta: string;
  ayuda?: string;
  tipo: 'texto' | 'texto_largo' | 'clasificacion';
  // for "clasificacion": storage key of the DragSort that holds the student's answer
  origen?: string;
}

export interface Reto {
  id: string;
  caso: number;
  pendientes?: string[];
  titulo: string;
  duracion: string;
  pasos: string[];
  producto: string;
  campos: CampoReto[];
  rubrica: CriterioRubrica[];
}

// what the student wrote for one challenge, kept in localStorage under "reto:N"
export interface RetoGuardado {
  valores: Record<string, string>;
  imagen?: string;
}
