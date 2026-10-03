import type { Pista, Pregunta } from '../../lib/tipos';
import { QuizCard } from './quiz_card';

interface Props {
  pistas: Pista[];
  unidad: number;
  titulo?: string;
  etiqueta?: string;
}

// same data model and engine as QuizCard, presented as detective clues
export function InferenceClues({
  pistas,
  unidad,
  titulo = 'Pistas del detective',
  etiqueta,
}: Props) {
  const preguntas: Pregunta[] = pistas.map((p) => ({
    id: p.id,
    nivel: 'Inferencia',
    pregunta: '¿Qué se puede deducir?',
    opciones: p.opciones,
    correcta: p.correcta,
    retro: p.explicacion,
    frase: p.frase,
  }));
  return (
    <QuizCard
      preguntas={preguntas}
      unidad={unidad}
      variante="pistas"
      titulo={titulo}
      etiqueta={etiqueta}
    />
  );
}
