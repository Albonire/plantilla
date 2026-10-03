import { useMemo, useState } from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import type { Asignaciones } from '../../lib/clasificar';
import { corregir_estrofas, type Estrofa } from '../../lib/resaltador';
import { usar_almacen } from './hooks';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  estrofas: Estrofa[];
  unidad: number;
  id: string;
  titulo?: string;
  etiqueta?: string;
  instruccion?: string;
  clave: { inicio: string; nudo: string; desenlace: string };
}

type Parte = Estrofa['parte'];

const PARTES: { id: Parte; texto: string; fondo: string }[] = [
  { id: 'inicio', texto: 'Inicio', fondo: 'bg-fresh-grass' },
  { id: 'nudo', texto: 'Nudo', fondo: 'bg-sunshine-pop' },
  { id: 'desenlace', texto: 'Desenlace', fondo: 'bg-coral-pop' },
];

const texto_parte = (p: Parte) => PARTES.find((x) => x.id === p)?.texto ?? '';

export function TextHighlighter({
  estrofas,
  unidad,
  id,
  titulo = 'Marca las partes del cuento',
  etiqueta,
  instruccion,
  clave,
}: Props) {
  const [marcas, set_marcas] = usar_almacen<Asignaciones>(`resaltar:${unidad}:${id}`, {});
  const [revisado, set_revisado] = useState(false);
  const correccion = useMemo(() => corregir_estrofas(estrofas, marcas), [estrofas, marcas]);

  function marcar(estrofa_id: string, parte: Parte) {
    set_revisado(false);
    set_marcas((m) => ({ ...m, [estrofa_id]: m[estrofa_id] === parte ? null : parte }));
  }

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta={etiqueta}>
      {instruccion && <p className="max-w-reading text-body">{instruccion}</p>}
      <p className="mt-2 text-body-sm text-stone-text">
        Elige, estrofa por estrofa, si es el inicio, el nudo o el desenlace. Cada marca lleva su
        color y su nombre.
      </p>

      <ol className="mt-6 flex flex-col gap-4">
        {estrofas.map((e, i) => {
          const marcada = marcas[e.id] as Parte | null | undefined;
          const fondo = PARTES.find((p) => p.id === marcada)?.fondo ?? 'bg-cream-paper';
          const resultado = revisado ? correccion.resultados[e.id] : undefined;
          return (
            <li key={e.id} className={`rounded-soft border-2 border-ink-black p-4 md:p-5 ${fondo}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-body-sm font-medium">Estrofa {i + 1}</p>
                {marcada && (
                  <span className="rounded-pill border-2 border-ink-black bg-pure-white px-3 py-0.5 text-micro font-medium">
                    {texto_parte(marcada)}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-reading text-reading">
                {e.versos.map((v, k) => (
                  <span key={k} className="block">
                    {v}
                  </span>
                ))}
              </p>
              <div
                className="mt-4 flex flex-wrap gap-2"
                role="group"
                aria-label={`Parte de la estrofa ${i + 1}`}
              >
                {PARTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={marcada === p.id}
                    onClick={() => marcar(e.id, p.id)}
                    className={`min-h-11 rounded-pill border-2 border-ink-black px-4 text-body-sm font-medium ${
                      marcada === p.id
                        ? 'bg-ink-black text-cream-paper'
                        : 'bg-pure-white hover:bg-sandstone'
                    }`}
                  >
                    {p.texto}
                  </button>
                ))}
              </div>
              {resultado && resultado !== 'sin_ubicar' && (
                <p className="mt-3 flex items-center gap-2 text-body-sm font-medium">
                  {resultado === 'bien' ? (
                    <>
                      <CheckCircle size={20} weight="fill" aria-hidden="true" /> Bien: es el{' '}
                      {texto_parte(e.parte).toLowerCase()}.
                    </>
                  ) : (
                    <>
                      <XCircle size={20} weight="fill" aria-hidden="true" /> Clave: esta estrofa es
                      del {texto_parte(e.parte).toLowerCase()}.
                    </>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={boton_primario}
          onClick={() => set_revisado(true)}
          disabled={!correccion.completo}
        >
          Revisar
        </button>
        <button
          type="button"
          className={boton}
          onClick={() => {
            set_marcas({});
            set_revisado(false);
          }}
        >
          Empezar de nuevo
        </button>
        {!correccion.completo && (
          <p className="text-body-sm text-stone-text">Marca todas las estrofas para revisar.</p>
        )}
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-7 text-body font-medium">
        {revisado ? `Acertaste ${correccion.aciertos} de ${correccion.total} estrofas.` : ''}
      </p>

      {revisado && (
        <dl className="mt-4 grid gap-3 rounded-soft bg-cream-paper p-5 text-body md:grid-cols-3">
          {PARTES.map((p) => (
            <div key={p.id}>
              <dt className="font-medium">{p.texto}</dt>
              <dd className="mt-1 text-body-sm">{clave[p.id]}</dd>
            </div>
          ))}
        </dl>
      )}
    </Superficie>
  );
}
