import { useEffect, useState } from 'react';
import { Link as EnlaceIcono, Trash, ChatCircle } from '@phosphor-icons/react';
import { codificar, combinar, decodificar, type Muro, type Nota } from '../../lib/muro';
import { usar_almacen } from './hooks';
import { Superficie, area_texto, boton, boton_primario, campo_texto } from './ui';

interface Columna {
  id: string;
  titulo: string;
}

interface Props {
  muro_id: string;
  titulo?: string;
  etiqueta?: string;
  pregunta: string;
  columnas: Columna[];
  // text suggested when answering a classmate
  inicio_respuesta?: string;
  ayuda_publicar?: string;
}

const LIMITE_ENLACE = 6000;

function nuevo_id(): string {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function MuroDetective({
  muro_id,
  titulo = 'Muro del caso',
  etiqueta = 'Comparte con tu clase',
  pregunta,
  columnas,
  inicio_respuesta = '',
  ayuda_publicar,
}: Props) {
  const vacio: Muro = { version: 1, muro_id, notas: [] };
  const [muro, set_muro] = usar_almacen<Muro>(`muro:${muro_id}`, vacio);
  const [apodo, set_apodo] = usar_almacen<string>('apodo', '');
  const [columna, set_columna] = useState(columnas[0]?.id ?? '');
  const [texto, set_texto] = useState('');
  const [respondiendo, set_respondiendo] = useState<string | null>(null);
  const [respuesta, set_respuesta] = useState('');
  const [entrante, set_entrante] = useState<Muro | null>(null);
  const [enlace, set_enlace] = useState('');
  const [mensaje, set_mensaje] = useState('');

  useEffect(() => {
    const m = /[#&]muro=([A-Za-z0-9_-]+)/.exec(window.location.hash);
    if (!m) return;
    decodificar(m[1]).then((recibido) => {
      if (recibido && recibido.muro_id === muro_id) set_entrante(recibido);
    });
  }, [muro_id]);

  function publicar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    const nota: Nota = {
      id: nuevo_id(),
      columna,
      autor: apodo.trim() || 'Detective',
      texto: limpio,
      respuestas: [],
    };
    set_muro((m) => ({ ...m, notas: [nota, ...m.notas] }));
    set_texto('');
    set_mensaje('Tu nota se publicó en tu muro.');
  }

  function enviar_respuesta(e: React.FormEvent, nota_id: string) {
    e.preventDefault();
    const limpio = respuesta.trim();
    if (!limpio) return;
    set_muro((m) => ({
      ...m,
      notas: m.notas.map((n) =>
        n.id === nota_id
          ? {
              ...n,
              respuestas: [
                ...n.respuestas,
                { id: nuevo_id(), autor: apodo.trim() || 'Detective', texto: limpio },
              ],
            }
          : n,
      ),
    }));
    set_respondiendo(null);
    set_respuesta('');
    set_mensaje('Tu respuesta se publicó.');
  }

  function quitar(nota_id: string) {
    set_muro((m) => ({ ...m, notas: m.notas.filter((n) => n.id !== nota_id) }));
    set_mensaje('Quitaste la nota de tu muro.');
  }

  async function generar_enlace() {
    const codigo = await codificar(muro);
    const url = `${window.location.origin}${window.location.pathname}#muro=${codigo}`;
    if (url.length > LIMITE_ENLACE) {
      set_enlace('');
      set_mensaje(
        'Tu muro es demasiado largo para compartirlo por enlace. Quita algunas notas e inténtalo otra vez.',
      );
      return;
    }
    set_enlace(url);
    try {
      await navigator.clipboard.writeText(url);
      set_mensaje('Enlace copiado. Pégalo en un mensaje para tu compañero.');
    } catch {
      set_mensaje('Copia el enlace de la casilla y pégalo en un mensaje para tu compañero.');
    }
  }

  function mezclar() {
    if (!entrante) return;
    set_muro((m) => combinar(m, entrante));
    set_entrante(null);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    set_mensaje('Mezclaste el muro de tu compañero con el tuyo.');
  }

  return (
    <Superficie tipo="conversa" titulo={titulo} etiqueta={etiqueta} tono="arena">
      <p className="max-w-reading text-reading font-medium">{pregunta}</p>
      <p className="mt-3 max-w-reading text-body-sm text-stone-text">
        Este muro vive en tu navegador y no se envía a ningún servidor. Usa un apodo de detective:
        no escribas tu apellido, tu dirección ni tu teléfono. Para que tus compañeros vean tus
        notas, comparte el enlace de tu muro.
      </p>

      {entrante && (
        <div
          role="region"
          aria-label="Muro recibido"
          className="mt-6 rounded-soft bg-sunshine-pop p-5"
        >
          <p className="text-body font-medium">
            Este enlace trae el muro de otro detective con {entrante.notas.length} notas.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className={boton_primario} onClick={mezclar}>
              Mezclar con mi muro
            </button>
            <button type="button" className={boton} onClick={() => set_entrante(null)}>
              Ahora no
            </button>
          </div>
        </div>
      )}

      <form onSubmit={publicar} className="mt-8 rounded-soft bg-pure-white p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={`apodo-${muro_id}`} className="text-body font-medium">
              Tu apodo de detective
            </label>
            <input
              id={`apodo-${muro_id}`}
              type="text"
              autoComplete="off"
              maxLength={24}
              value={apodo}
              onChange={(e) => set_apodo(e.target.value)}
              className={`${campo_texto} mt-2`}
            />
          </div>
          <div>
            <label htmlFor={`col-${muro_id}`} className="text-body font-medium">
              Columna
            </label>
            <select
              id={`col-${muro_id}`}
              value={columna}
              onChange={(e) => set_columna(e.target.value)}
              className={`${campo_texto} mt-2`}
            >
              {columnas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor={`texto-${muro_id}`} className="mt-4 block text-body font-medium">
          Tu nota
        </label>
        {ayuda_publicar && <p className="text-body-sm text-stone-text">{ayuda_publicar}</p>}
        <textarea
          id={`texto-${muro_id}`}
          rows={3}
          maxLength={280}
          value={texto}
          onChange={(e) => set_texto(e.target.value)}
          className={`${area_texto} mt-2`}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className={boton_primario} disabled={!texto.trim()}>
            Publicar en mi muro
          </button>
          <span className="text-body-sm text-stone-text">{texto.length} de 280 letras</span>
        </div>
      </form>

      <div
        className={`mt-8 grid gap-5 ${columnas.length > 2 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}
      >
        {columnas.map((col) => {
          const notas = muro.notas.filter((n) => n.columna === col.id);
          return (
            <section
              key={col.id}
              aria-label={col.titulo}
              className="rounded-soft bg-cream-paper p-4"
            >
              <h4 className="text-body font-medium">{col.titulo}</h4>
              <ul className="mt-3 flex flex-col gap-3">
                {notas.length === 0 && (
                  <li className="text-body-sm text-stone-text">Todavía no hay notas.</li>
                )}
                {notas.map((n) => (
                  <li key={n.id} className="rounded-soft bg-pure-white p-4">
                    <p className="text-body-sm font-medium text-stone-text">{n.autor}</p>
                    <p className="mt-1 text-body">{n.texto}</p>

                    {n.respuestas.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2 border-l-4 border-sunshine-pop pl-3">
                        {n.respuestas.map((r) => (
                          <li key={r.id}>
                            <p className="text-micro font-medium text-stone-text">
                              {r.autor} responde
                            </p>
                            <p className="text-body-sm">{r.texto}</p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {respondiendo === n.id ? (
                      <form onSubmit={(e) => enviar_respuesta(e, n.id)} className="mt-3">
                        <label htmlFor={`resp-${n.id}`} className="text-body-sm font-medium">
                          Tu respuesta
                        </label>
                        <textarea
                          id={`resp-${n.id}`}
                          rows={2}
                          maxLength={280}
                          value={respuesta}
                          onChange={(e) => set_respuesta(e.target.value)}
                          className={`${area_texto} mt-1`}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="submit"
                            className={boton_primario}
                            disabled={!respuesta.trim()}
                          >
                            Responder
                          </button>
                          <button
                            type="button"
                            className={boton}
                            onClick={() => set_respondiendo(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={boton}
                          onClick={() => {
                            set_respondiendo(n.id);
                            set_respuesta(inicio_respuesta);
                          }}
                        >
                          <ChatCircle size={18} weight="bold" aria-hidden="true" />
                          Responder
                        </button>
                        <button
                          type="button"
                          className={boton}
                          onClick={() => quitar(n.id)}
                          aria-label={`Quitar la nota de ${n.autor}`}
                        >
                          <Trash size={18} weight="bold" aria-hidden="true" />
                          Quitar
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={boton}
          onClick={generar_enlace}
          disabled={muro.notas.length === 0}
        >
          <EnlaceIcono size={20} weight="bold" aria-hidden="true" />
          Copiar el enlace de mi muro
        </button>
      </div>
      {enlace && (
        <div className="mt-3">
          <label htmlFor={`enlace-${muro_id}`} className="text-body-sm font-medium">
            Enlace de tu muro
          </label>
          <input
            id={`enlace-${muro_id}`}
            readOnly
            value={enlace}
            onFocus={(e) => e.currentTarget.select()}
            className={`${campo_texto} mt-1 text-body-sm`}
          />
        </div>
      )}
      <p role="status" aria-live="polite" className="mt-3 min-h-7 text-body">
        {mensaje}
      </p>
    </Superficie>
  );
}
