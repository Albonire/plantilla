// summary of each row of the design sheet ("ficha"), used by the /ficha page.
// The texts summarize CONTENIDO.md; the full content lives in each unit page.

export interface FilaFicha {
  elemento: string;
  descripcion: string;
  seccion: string;
}

export const filas_curso: FilaFicha[] = [
  {
    elemento: 'Nombre del curso',
    descripcion:
      'Aventura lectora: comprensión lectora y pensamiento crítico en textos narrativos, informativos e instructivos.',
    seccion: '/#tapa',
  },
  {
    elemento: 'Carátula del curso',
    descripcion:
      'La tapa del libro que se abre con el scroll y la portadilla con los datos del seminario y del equipo.',
    seccion: '/#tapa',
  },
  {
    elemento: 'Bienvenida al curso',
    descripcion: 'Texto de bienvenida a los exploradores de historias.',
    seccion: '/#bienvenida',
  },
  {
    elemento: 'Unidades temáticas',
    descripcion:
      'Cinco casos: leo y comprendo, el sendero de los textos, preguntas como detective, detectives de noticias y mi voz cuenta.',
    seccion: '/#indice',
  },
  {
    elemento: 'Competencias, objetivos, estándares básicos del curso',
    descripcion:
      'Estrategias de comprensión, estructura de los textos, tres niveles de preguntas, fuentes confiables y opinión argumentada.',
    seccion: '/programa#competencias',
  },
  {
    elemento: 'Metodología',
    descripcion:
      'Ruta de aprendizaje en cuatro momentos: exploración, estructuración, práctica y valoración.',
    seccion: '/programa#ruta',
  },
  {
    elemento: 'Evaluación',
    descripcion:
      'Formativa con retroalimentación inmediata, sumativa con un reto por caso y un producto final, y autoevaluación.',
    seccion: '/programa#evaluacion',
  },
  {
    elemento: 'Momentos síncronos y asíncronos',
    descripcion:
      'Una videollamada de 50 minutos por caso, trabajo asíncrono en el sitio y la Feria de detectives.',
    seccion: '/programa#momentos',
  },
  {
    elemento: 'Otros aspectos',
    descripcion:
      'Accesibilidad, privacidad, familias, curso digital y recursos elaborados con herramientas digitales.',
    seccion: '/programa#otros',
  },
];

export interface ResumenUnidad {
  contenidos: string;
  desarrollo: string;
  formativas: string;
}

export const resumen_unidades: Record<number, ResumenUnidad> = {
  1: {
    contenidos:
      'Tres pistas: antes de leer, durante la lectura y después de leer. Infografía "Leo como detective".',
    desarrollo:
      'Secuencia 1: sopa de letras y tablero de predicciones. Lectura con pausas de "La liebre y la tortuga" con la pista de carrera y video. Secuencia 2: pistas del detective. Secuencia 3: refrán y ruleta de preguntas.',
    formativas: 'Podcast de repaso, cuestionario sobre la lectura y tarjetas del detective.',
  },
  2: {
    contenidos:
      'Tres pistas: texto narrativo, informativo e instructivo. Infografía "El sendero de los textos".',
    desarrollo:
      'Video, cómic "Tres textos, tres misiones" con cámara de viñetas, sendero con tres estaciones, cuento "El renacuajo paseador", texto informativo sobre Rafael Pombo e instructivo del separador.',
    formativas:
      'Podcast de repaso, cuestionario sobre el cuento, clasificador de textos y tarjetas del detective.',
  },
  3: {
    contenidos: 'Tres pistas: nivel literal, inferencial y crítico. Infografía "Las tres lupas".',
    desarrollo:
      'Video, las tres lupas en profundidad, lectura "Los libros viajeros de la vereda" y semáforo de preguntas.',
    formativas:
      'Podcast de repaso, cuestionario, tarjetas del detective y recursos web para practicar.',
  },
  4: {
    contenidos:
      'Tres pistas: hechos y opiniones, la noticia y la lista LUPA. Infografía "La lista LUPA".',
    desarrollo:
      'Video, clasificador de hechos y opiniones, la noticia pieza por pieza, lista LUPA y recursos web.',
    formativas: 'Podcast de repaso, cuestionario, detector de fuentes y tarjetas del detective.',
  },
  5: {
    contenidos:
      'Cuatro pistas: opinión con argumentos, conectores, texto de opinión y escuchar con respeto. Infografía "La torre del argumento".',
    desarrollo:
      'Video, modelo de texto de opinión, clasificador de conectores, constructor de argumentos, podcast del debate y muro de debate.',
    formativas: 'Cuestionario, tarjetas del detective y recursos web para practicar.',
  },
};
