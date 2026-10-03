// central site settings: edit here, not in components

export const integrantes = [
  { id: 'selene', nombre: 'Selene María Caballero Valle' },
  { id: 'luz', nombre: 'Luz Marina Castillo Cuadrado' },
  { id: 'ingrid', nombre: 'Ingrid Yuliana González Flores' },
  { id: 'maribel', nombre: 'Maribel León Grillo' },
  { id: 'silvia', nombre: 'Silvia Gabriela Rincón Pérez' },
] as const;

export type IntegranteId = (typeof integrantes)[number]['id'];

export const ids_integrantes = integrantes.map((i) => i.id) as [IntegranteId, ...IntegranteId[]];

export function nombre_de(id: IntegranteId): string {
  return integrantes.find((i) => i.id === id)?.nombre ?? '';
}

export const sitio = {
  nombre_curso: 'Aventura lectora',
  subtitulo: 'Comprensión lectora y pensamiento crítico',
  nombre_largo:
    'Aventura lectora: comprensión lectora y pensamiento crítico en textos narrativos, informativos e instructivos',
  grado: '5.º de primaria',
  pie_portada: 'Curso para 5.º de primaria',
  anio: 2026,

  universidad: 'Universidad Santo Tomás',
  sede: 'Sede Principal',
  division: 'División de Ciencias Sociales y de la Educación',
  facultad: 'Facultad de Educación',
  programa: 'Maestría en Tecnología e Innovación Educativa',
  seminario: 'Seminario de profundización I: Innovación didáctica',
  actividad: 'Planeación didáctica',
  docente: 'Maria Victoria Murcia Arregocés',
} as const;

export const casos_ruta = [1, 2, 3, 4, 5] as const;
export type NumeroCaso = (typeof casos_ruta)[number];

export function ruta_caso(numero: number): string {
  return `/unidad/${numero}`;
}
