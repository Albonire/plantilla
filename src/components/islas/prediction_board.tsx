import { CheckCircle } from '@phosphor-icons/react';
import { usar_almacen } from './hooks';
import { Superficie, area_texto, boton_primario } from './ui';

export interface PreguntaPrediccion {
  id: string;
  pregunta: string;
  // what really happens in the story, shown next to the student's guess
  historia?: string;
}

interface Props {
  preguntas: PreguntaPrediccion[];
  unidad: number;
  modo: 'escribir' | 'comparar';
  titulo?: string;
  etiqueta?: string;
}

type Valoracion = 'acerte' | 'casi' | 'cambio';

interface Datos {
  textos: Record<string, string>;
  valoracion: Record<string, Valoracion>;
  guardado: boolean;
}

const VACIO: Datos = { textos: {}, valoracion: {}, guardado: false };

const OPCIONES: { id: Valoracion; texto: string }[] = [
  { id: 'acerte', texto: 'Acerté' },
  { id: 'casi', texto: 'Casi' },
  { id: 'cambio', texto: 'Cambió' },
];

export function PredictionBoard({ preguntas, unidad, modo, titulo, etiqueta }: Props) {
  const [datos, set_datos] = usar_almacen<Datos>(`predicciones:${unidad}`, VACIO);

  if (modo === 'escribir') {
    return (
      <Superficie
        tipo="escribe"
        titulo={titulo ?? 'Antes de leer: tus predicciones'}
        etiqueta={etiqueta ?? 'Tablero de predicciones'}
      >
        <p className="max-w-reading text-body">
          Un detective piensa antes de leer. Escribe lo que crees, aunque no estés seguro: después
          vas a comprobarlo.
        </p>
        <form
          className="mt-6 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            set_datos((d) => ({ ...d, guardado: true }));
          }}
        >
          {preguntas.map((p) => (
            <div key={p.id}>
              <label htmlFor={`pred-${unidad}-${p.id}`} className="text-body font-medium">
                {p.pregunta}
              </label>
              <textarea
                id={`pred-${unidad}-${p.id}`}
                rows={2}
                maxLength={400}
                className={`${area_texto} mt-2`}
                value={datos.textos[p.id] ?? ''}
                onChange={(e) =>
                  set_datos((d) => ({
                    ...d,
                    guardado: false,
                    textos: { ...d.textos, [p.id]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className={boton_primario}>
              Guardar mis predicciones
            </button>
            <p role="status" aria-live="polite" className="flex items-center gap-2 text-body-sm">
              {datos.guardado && (
                <>
                  <CheckCircle size={20} weight="fill" aria-hidden="true" />
                  Guardadas en este navegador. Ahora lee la historia.
                </>
              )}
            </p>
          </div>
        </form>
      </Superficie>
    );
  }

  return (
    <Superficie
      tipo="escribe"
      titulo={titulo ?? 'Después de leer: compara'}
      etiqueta={etiqueta ?? 'Tablero de predicciones'}
    >
      <p className="max-w-reading text-body">
        Mira lo que escribiste antes de leer y lo que pasó en la historia. Marca cómo te fue.
      </p>
      <ul className="mt-6 flex flex-col gap-6">
        {preguntas.map((p) => {
          const escrito = datos.textos[p.id]?.trim();
          return (
            <li key={p.id} className="rounded-soft bg-cream-paper p-5">
              <p className="text-body font-medium">{p.pregunta}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-body-sm font-medium text-stone-text">Lo que pensaste</p>
                  <p className="mt-1 text-body">
                    {escrito ? escrito : 'No escribiste una predicción.'}
                  </p>
                </div>
                {p.historia && (
                  <div>
                    <p className="text-body-sm font-medium text-stone-text">Lo que pasó</p>
                    <p className="mt-1 text-body">{p.historia}</p>
                  </div>
                )}
              </div>
              <fieldset className="mt-4">
                <legend className="text-body-sm font-medium">¿Cómo te fue?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {OPCIONES.map((o) => {
                    const activa = datos.valoracion[p.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={activa}
                        onClick={() =>
                          set_datos((d) => ({
                            ...d,
                            valoracion: { ...d.valoracion, [p.id]: o.id },
                          }))
                        }
                        className={`inline-flex min-h-11 items-center gap-2 rounded-pill border-2 border-ink-black px-4 text-body-sm font-medium ${
                          activa ? 'bg-fresh-grass' : 'bg-pure-white hover:bg-sandstone'
                        }`}
                      >
                        {activa && <CheckCircle size={18} weight="fill" aria-hidden="true" />}
                        {o.texto}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>
    </Superficie>
  );
}
