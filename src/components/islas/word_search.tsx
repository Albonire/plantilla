import { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { celdas_de_linea, generar_sopa, palabra_en_seleccion, type Celda } from '../../lib/sopa';
import { usar_almacen } from './hooks';
import { Superficie, boton } from './ui';

interface Props {
  palabras: string[];
  tamano?: number;
  semilla: string;
  unidad: number;
  instruccion?: string;
  titulo?: string;
  etiqueta?: string;
  cierre?: string;
}

const COLORES_HALLADAS = ['bg-fresh-grass', 'bg-sky-pop', 'bg-sunshine-pop', 'bg-coral-pop'];

const misma = (a: Celda | null, b: Celda | null) =>
  !!a && !!b && a.fila === b.fila && a.col === b.col;

export function WordSearch({
  palabras,
  tamano = 12,
  semilla,
  unidad,
  instruccion,
  titulo = 'Sopa de letras',
  etiqueta,
  cierre,
}: Props) {
  const sopa = useMemo(() => generar_sopa(palabras, tamano, semilla), [palabras, tamano, semilla]);
  const [halladas, set_halladas] = usar_almacen<string[]>(`sopa:${unidad}`, []);
  const [inicio, set_inicio] = useState<Celda | null>(null);
  const [hover, set_hover] = useState<Celda | null>(null);
  const [foco, set_foco] = useState<Celda>({ fila: 0, col: 0 });
  const [mensaje, set_mensaje] = useState('');
  const arrastrando = useRef(false);
  const pendiente = useRef(false);
  const rejilla = useRef<HTMLDivElement>(null);

  const colocacion_de = useMemo(
    () => new Map(sopa.colocaciones.map((c) => [c.palabra, c])),
    [sopa],
  );
  const orden_lista = sopa.palabras;

  const celdas_hallada = useMemo(() => {
    const mapa = new Map<string, number>();
    halladas.forEach((p) => {
      const c = colocacion_de.get(p);
      if (!c) return;
      const indice = orden_lista.indexOf(p);
      for (let i = 0; i < p.length; i++)
        mapa.set(`${c.fila + c.dfila * i},${c.col + c.dcol * i}`, indice);
    });
    return mapa;
  }, [halladas, colocacion_de, orden_lista]);

  const linea_actual = useMemo(() => {
    if (!inicio || !hover) return new Set<string>();
    const l = celdas_de_linea(inicio, hover);
    return new Set((l ?? [inicio]).map((c) => `${c.fila},${c.col}`));
  }, [inicio, hover]);

  const evaluar = useCallback(
    (a: Celda, b: Celda) => {
      const palabra = palabra_en_seleccion(sopa, a, b);
      if (!palabra) {
        set_mensaje('Esa línea no es una de las palabras. Prueba otra vez.');
        return;
      }
      if (halladas.includes(palabra)) {
        set_mensaje(`Ya habías encontrado "${palabra}".`);
        return;
      }
      const nuevas = [...halladas, palabra];
      set_halladas(nuevas);
      const faltan = sopa.palabras.length - nuevas.length;
      set_mensaje(
        faltan === 0
          ? `¡Ojo de detective! Encontraste "${palabra}". Ya tienes las ${sopa.palabras.length} palabras.`
          : `¡Genial! Encontraste "${palabra}". Te ${faltan === 1 ? 'falta 1 palabra' : `faltan ${faltan} palabras`}.`,
      );
    },
    [sopa, halladas, set_halladas],
  );

  function celda_bajo(e: { clientX: number; clientY: number }): Celda | null {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const boton_celda = el?.closest<HTMLElement>('[data-fila]');
    if (!boton_celda) return null;
    return { fila: Number(boton_celda.dataset.fila), col: Number(boton_celda.dataset.col) };
  }

  function al_presionar(e: React.PointerEvent<HTMLDivElement>) {
    const c = celda_bajo(e);
    if (!c) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    set_foco(c);
    if (pendiente.current && inicio) {
      // second tap of a tap-tap selection
      pendiente.current = false;
      if (!misma(inicio, c)) evaluar(inicio, c);
      set_inicio(null);
      set_hover(null);
      return;
    }
    arrastrando.current = true;
    set_inicio(c);
    set_hover(c);
  }

  function al_mover(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrando.current && !pendiente.current) return;
    const c = celda_bajo(e);
    if (c) set_hover(c);
  }

  function al_soltar(e: React.PointerEvent<HTMLDivElement>) {
    if (!arrastrando.current) return;
    arrastrando.current = false;
    const c = celda_bajo(e) ?? hover;
    if (inicio && c && !misma(inicio, c)) {
      evaluar(inicio, c);
      set_inicio(null);
      set_hover(null);
    } else {
      // released on the same cell: wait for a second tap
      pendiente.current = true;
      set_mensaje('Primera letra marcada. Toca ahora la última letra de la palabra.');
    }
  }

  function al_teclear(e: React.KeyboardEvent<HTMLDivElement>) {
    const mover: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (mover[e.key]) {
      e.preventDefault();
      const [df, dc] = mover[e.key];
      const nueva = {
        fila: Math.min(tamano - 1, Math.max(0, foco.fila + df)),
        col: Math.min(tamano - 1, Math.max(0, foco.col + dc)),
      };
      set_foco(nueva);
      if (inicio) set_hover(nueva);
      requestAnimationFrame(() =>
        rejilla.current
          ?.querySelector<HTMLElement>(`[data-fila="${nueva.fila}"][data-col="${nueva.col}"]`)
          ?.focus(),
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!inicio) {
        set_inicio(foco);
        set_hover(foco);
        set_mensaje(
          `Inicio en fila ${foco.fila + 1}, columna ${foco.col + 1}. Muévete y pulsa Enter para marcar el final.`,
        );
      } else {
        if (!misma(inicio, foco)) evaluar(inicio, foco);
        set_inicio(null);
        set_hover(null);
      }
    } else if (e.key === 'Escape') {
      set_inicio(null);
      set_hover(null);
      pendiente.current = false;
      set_mensaje('Selección cancelada.');
    }
  }

  const completa = halladas.length >= sopa.palabras.length;

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta={etiqueta}>
      {instruccion && <p className="max-w-reading text-body">{instruccion}</p>}
      <p className="mt-2 text-body-sm text-stone-text">
        Arrastra sobre las letras, o toca la primera y luego la última. Con teclado: flechas para
        moverte y Enter para marcar el inicio y el final.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,32rem)_1fr]">
        <div
          ref={rejilla}
          role="grid"
          aria-label="Sopa de letras"
          className="flex w-full max-w-[32rem] select-none flex-col gap-0.5 rounded-soft bg-cream-paper p-2 [touch-action:none]"
          onPointerDown={al_presionar}
          onPointerMove={al_mover}
          onPointerUp={al_soltar}
          onKeyDown={al_teclear}
        >
          {sopa.celdas.map((fila, f) => (
            <div
              key={f}
              role="row"
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${tamano}, minmax(0, 1fr))` }}
            >
              {fila.map((letra, c) => {
                const clave = `${f},${c}`;
                const indice = celdas_hallada.get(clave);
                const en_linea = linea_actual.has(clave);
                const es_inicio = misma(inicio, { fila: f, col: c });
                return (
                  <button
                    key={clave}
                    type="button"
                    role="gridcell"
                    data-fila={f}
                    data-col={c}
                    tabIndex={foco.fila === f && foco.col === c ? 0 : -1}
                    aria-label={`${letra}, fila ${f + 1}, columna ${c + 1}${indice !== undefined ? ', parte de una palabra encontrada' : ''}`}
                    className={`flex aspect-square min-h-6 items-center justify-center rounded-md text-body-sm font-medium leading-none transition-colors ${
                      es_inicio
                        ? 'relative z-10 scale-110 border-2 border-ink-black bg-sunshine-pop font-bold ring-4 ring-coral-pop'
                        : en_linea
                          ? 'border-2 border-ink-black bg-sunshine-pop'
                          : indice !== undefined
                            ? `${COLORES_HALLADAS[indice % COLORES_HALLADAS.length]} border-2 border-ink-black`
                            : 'border-2 border-transparent bg-pure-white'
                    }`}
                  >
                    {letra}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div>
          <p className="text-body font-medium">Palabras escondidas</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
            {orden_lista.map((p) => {
              const hallada = halladas.includes(p);
              return (
                <li
                  key={p}
                  className={`flex min-h-11 items-center gap-2 rounded-soft px-3 text-body-sm ${
                    hallada ? 'bg-fresh-grass font-medium' : 'bg-cream-paper'
                  }`}
                >
                  {hallada ? (
                    <CheckCircle size={20} weight="fill" aria-hidden="true" />
                  ) : (
                    <Circle size={20} aria-hidden="true" />
                  )}
                  <span className={hallada ? 'line-through decoration-2' : ''}>{p}</span>
                  <span className="sr-only">{hallada ? ' (encontrada)' : ' (por encontrar)'}</span>
                </li>
              );
            })}
          </ul>
          <p role="status" aria-live="polite" className="mt-5 min-h-7 text-body">
            {mensaje}
          </p>
          {completa && cierre && (
            <p className="mt-2 rounded-soft bg-sunshine-pop p-4 text-body font-medium">{cierre}</p>
          )}
          {halladas.length > 0 && (
            <button
              type="button"
              className={`${boton} mt-4`}
              onClick={() => {
                set_halladas([]);
                set_mensaje('Empezaste de nuevo.');
              }}
            >
              Empezar de nuevo
            </button>
          )}
        </div>
      </div>
    </Superficie>
  );
}
