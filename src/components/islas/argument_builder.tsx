import { useMemo, useState } from 'react';
import { CheckCircle, Copy, FilePdf } from '@phosphor-icons/react';
import type { RetoGuardado } from '../../lib/tipos';
import {
  BLOQUES_OPINION,
  armar_texto,
  conectores_usados,
  contar_palabras,
} from '../../lib/opinion';
import { usar_almacen, usar_movimiento, usar_nombre } from './hooks';
import { Superficie, area_texto, boton, boton_primario } from './ui';

interface Props {
  preguntas: string[];
  conectores: string[];
  unidad: number;
  titulo_caso: string;
  titulo_reto: string;
}

const FONDOS: Record<string, string> = {
  opinion: 'bg-coral-pop',
  razon_1: 'bg-sky-pop',
  ejemplo: 'bg-sunshine-pop',
  razon_2: 'bg-sandstone',
  contraria: 'bg-fresh-grass',
  conclusion: 'bg-coral-pop',
};

const BLOQUES = BLOQUES_OPINION.map((b) => ({ ...b, fondo: FONDOS[b.id] ?? 'bg-sandstone' }));

const VACIO: RetoGuardado = { valores: {} };

export function ArgumentBuilder({
  preguntas,
  conectores,
  unidad,
  titulo_caso,
  titulo_reto,
}: Props) {
  const [guardado, set_guardado] = usar_almacen<RetoGuardado>(`reto:${unidad}`, VACIO);
  const [nombre] = usar_nombre();
  const movimiento = usar_movimiento();
  const [copiado, set_copiado] = useState(false);
  const [generando, set_generando] = useState(false);
  const valores = guardado.valores ?? {};

  const completo = (id: string) => contar_palabras(valores[id] ?? '') >= 3;

  function cambiar(id: string, valor: string) {
    set_copiado(false);
    set_guardado((g) => ({ ...g, valores: { ...g.valores, [id]: valor } }));
  }

  const texto_armado = useMemo(() => armar_texto(valores), [valores]);
  const usados = useMemo(
    () => conectores_usados(texto_armado, conectores),
    [texto_armado, conectores],
  );

  const listos = BLOQUES.filter((b) => b.obligatorio).every((b) => completo(b.id));

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto_armado);
      set_copiado(true);
    } catch {
      set_copiado(false);
    }
  }

  async function descargar() {
    set_generando(true);
    try {
      const { descargar_reto } = await import('../../lib/pdf');
      await descargar_reto({
        nombre,
        caso: unidad,
        titulo_caso,
        titulo_reto,
        campos: [
          { etiqueta: 'Pregunta que elegí', valor: valores.pregunta ?? '' },
          { etiqueta: 'Mi texto de opinión', valor: texto_armado },
        ],
      });
    } finally {
      set_generando(false);
    }
  }

  return (
    <Superficie
      tipo="escribe"
      id="constructor"
      titulo="Constructor de argumentos"
      etiqueta="Arma tu opinión como una torre"
    >
      <fieldset>
        <legend className="text-body font-medium">Elige una pregunta</legend>
        <div className="mt-3 flex flex-col gap-2">
          {preguntas.map((p) => (
            <label
              key={p}
              className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-soft border-2 border-ink-black p-3 text-body ${
                valores.pregunta === p ? 'bg-fresh-grass' : 'bg-pure-white hover:bg-cream-paper'
              }`}
            >
              <input
                type="radio"
                name={`pregunta-${unidad}`}
                className="mt-1.5 size-5 accent-ink-black"
                checked={valores.pregunta === p}
                onChange={() => cambiar('pregunta', p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,18rem)]">
        <div className="flex flex-col gap-5">
          {BLOQUES.map((b) => (
            <div key={b.id}>
              <label
                htmlFor={`arg-${b.id}`}
                className="flex flex-wrap items-center gap-2 text-body font-medium"
              >
                <span
                  className={`${b.fondo} rounded-pill border-2 border-ink-black px-3 py-0.5 text-body-sm`}
                >
                  {b.etiqueta}
                </span>
                <span className="text-stone-text">{b.inicio}...</span>
                {completo(b.id) && (
                  <span className="flex items-center gap-1 text-body-sm">
                    <CheckCircle size={18} weight="fill" aria-hidden="true" /> Listo
                  </span>
                )}
              </label>
              <textarea
                id={`arg-${b.id}`}
                rows={2}
                maxLength={300}
                className={`${area_texto} mt-2`}
                value={valores[b.id] ?? ''}
                onChange={(e) => cambiar(b.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div
          aria-hidden="true"
          className="order-first flex flex-col justify-end gap-1.5 lg:order-none"
        >
          <p className="mb-1 text-body-sm font-medium text-stone-text">Tu torre</p>
          {[...BLOQUES].reverse().map((b) => {
            const hecho = completo(b.id);
            return (
              <div
                key={`${b.id}-${hecho}`}
                className={`flex min-h-11 items-center rounded-soft border-2 px-3 text-body-sm font-medium ${
                  hecho
                    ? `${b.fondo} border-ink-black ${movimiento ? 'torre-cae' : ''}`
                    : 'border-dashed border-stone-gray bg-transparent text-stone-text'
                }`}
              >
                {b.etiqueta}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-soft bg-cream-paper p-5 md:p-6">
        <h4 className="text-subheading font-medium">Tu texto</h4>
        <p className="mt-2 max-w-reading text-reading">
          {texto_armado || 'Cuando escribas tus bloques, aquí se arma tu texto.'}
        </p>
        <p className="mt-4 text-body-sm font-medium">
          Conectores que usaste: {usados.length} de {conectores.length}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {conectores.map((c) => {
            const usado = usados.includes(c);
            return (
              <li
                key={c}
                className={`inline-flex items-center gap-1.5 rounded-pill border-2 border-ink-black px-3 py-0.5 text-body-sm ${
                  usado ? 'bg-fresh-grass font-medium' : 'bg-pure-white text-stone-text'
                }`}
              >
                {usado && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
                {c}
                <span className="sr-only">{usado ? ' (usado)' : ' (sin usar)'}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-body-sm text-stone-text">
          Meta del reto: al menos tres conectores distintos.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={boton_primario}
          onClick={descargar}
          disabled={!texto_armado || generando}
        >
          <FilePdf size={20} weight="bold" aria-hidden="true" />
          {generando ? 'Preparando...' : 'Descargar PDF'}
        </button>
        <button type="button" className={boton} onClick={copiar} disabled={!texto_armado}>
          <Copy size={20} weight="bold" aria-hidden="true" />
          Copiar el texto
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-7 text-body">
        {copiado
          ? 'Texto copiado.'
          : listos
            ? 'Tu torre está completa. Puedes descargar el PDF.'
            : ''}
      </p>
    </Superficie>
  );
}
