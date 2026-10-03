import { useState } from 'react';
import { Superficie, boton } from './ui';

export interface ParteModelo {
  id: string;
  etiqueta: string;
  texto: string;
}

interface Props {
  pregunta: string;
  partes: ParteModelo[];
  titulo?: string;
  etiqueta?: string;
}

const FONDOS: Record<string, string> = {
  opinion: 'bg-coral-pop',
  razon_1: 'bg-sky-pop',
  ejemplo: 'bg-sunshine-pop',
  razon_2: 'bg-sandstone',
  contraria: 'bg-fresh-grass',
  conclusion: 'bg-coral-pop',
};

export function ModeloOpinion({
  pregunta,
  partes,
  titulo = 'Un texto de opinión, parte por parte',
  etiqueta,
}: Props) {
  const [activa, set_activa] = useState<string | null>(null);
  const [etiquetas, set_etiquetas] = useState(false);
  const actual = partes.find((p) => p.id === activa);

  return (
    <Superficie tipo="lee" titulo={titulo} etiqueta={etiqueta}>
      <p className="text-body-sm font-medium text-stone-text">Pregunta</p>
      <p className="text-subheading font-medium">{pregunta}</p>

      <p className="mt-6 max-w-reading text-reading leading-loose">
        {partes.map((p) => (
          <span key={p.id}>
            {etiquetas && (
              <span className="mr-1 rounded-pill border-2 border-ink-black bg-pure-white px-2 py-0.5 align-middle text-micro font-medium">
                {p.etiqueta}
              </span>
            )}
            <button
              type="button"
              aria-pressed={activa === p.id}
              onClick={() => set_activa(activa === p.id ? null : p.id)}
              className={`rounded-md px-1 py-0.5 text-left ${FONDOS[p.id] ?? 'bg-sandstone'} ${
                activa && activa !== p.id ? 'opacity-45' : ''
              } ${activa === p.id ? 'outline-2 outline-offset-2 outline-ink-black' : ''}`}
            >
              {p.texto}
            </button>{' '}
          </span>
        ))}
      </p>

      <p role="status" aria-live="polite" className="mt-4 min-h-8 text-body font-medium">
        {actual
          ? `Esta parte es: ${actual.etiqueta}.`
          : 'Toca cada parte del texto para ver cómo se llama.'}
      </p>

      <div className="mt-2">
        <button
          type="button"
          className={boton}
          aria-pressed={etiquetas}
          onClick={() => set_etiquetas((v) => !v)}
        >
          {etiquetas ? 'Ocultar los nombres' : 'Mostrar el nombre de cada parte'}
        </button>
      </div>
    </Superficie>
  );
}
