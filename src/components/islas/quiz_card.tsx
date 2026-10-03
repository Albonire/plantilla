import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  MagnifyingGlass,
  XCircle,
} from '@phosphor-icons/react';
import type { Pregunta } from '../../lib/tipos';
import {
  es_correcta,
  opciones_barajadas,
  registrar_intento,
  resumir,
  type Intentos,
} from '../../lib/quiz';
import { marcar_resuelto } from '../../lib/progreso';
import { usar_almacen } from './hooks';
import { Chip, Superficie, boton, boton_primario } from './ui';

interface Props {
  preguntas: Pregunta[];
  unidad: number;
  titulo?: string;
  etiqueta?: string;
  variante?: 'quiz' | 'pistas' | 'fuente';
  // fixed option order (used when the options have a natural order)
  sin_barajar?: boolean;
  // mark the case as solved when every question is answered correctly
  marca_caso?: boolean;
  pregunta_comun?: string;
}

interface Estado {
  intentos: Intentos;
  indice: number;
}

const ESTADO_INICIAL: Estado = { intentos: {}, indice: 0 };

export function QuizCard({
  preguntas,
  unidad,
  titulo = 'Pon a prueba tu lupa',
  etiqueta,
  variante = 'quiz',
  sin_barajar = false,
  marca_caso = false,
  pregunta_comun,
}: Props) {
  const clave = `${variante}:${unidad}:${preguntas[0]?.id ?? ''}`;
  const [estado, set_estado, listo] = usar_almacen<Estado>(clave, ESTADO_INICIAL);
  const [mensaje, set_mensaje] = useState('');
  const foco = useRef<HTMLDivElement>(null);
  const marcado = useRef(false);

  const resumen = useMemo(() => resumir(preguntas, estado.intentos), [preguntas, estado.intentos]);
  const terminado = resumen.resueltas === resumen.total;
  const en_resumen = terminado && estado.indice >= preguntas.length;
  const pregunta = preguntas[Math.min(estado.indice, preguntas.length - 1)];
  const intentos_actual = estado.intentos[pregunta.id] ?? [];
  const resuelta = intentos_actual.includes(pregunta.correcta);

  const opciones = useMemo(
    () => (sin_barajar ? pregunta.opciones : opciones_barajadas(pregunta, `${variante}${unidad}`)),
    [pregunta, sin_barajar, variante, unidad],
  );

  useEffect(() => {
    if (!listo) return;
    if (terminado && marca_caso && !marcado.current) {
      marcado.current = true;
      marcar_resuelto(unidad);
      document.dispatchEvent(new CustomEvent('progreso:cambio'));
    }
  }, [listo, terminado, marca_caso, unidad]);

  function elegir(opcion_id: string) {
    if (resuelta || intentos_actual.includes(opcion_id)) return;
    set_estado((prev) => ({
      ...prev,
      intentos: registrar_intento(prev.intentos, pregunta.id, opcion_id),
    }));
    if (es_correcta(pregunta, opcion_id)) {
      set_mensaje(`¡Excelente deducción! ${pregunta.retro}`);
    } else {
      set_mensaje(
        '¡Casi, detective! Vuelve a mirar la pista en el texto y prueba con otra opción.',
      );
    }
  }

  function siguiente() {
    set_mensaje('');
    set_estado((prev) => ({ ...prev, indice: prev.indice + 1 }));
    requestAnimationFrame(() => foco.current?.focus());
  }

  function repasar() {
    set_mensaje('');
    marcado.current = true;
    set_estado({ intentos: {}, indice: 0 });
    requestAnimationFrame(() => foco.current?.focus());
  }

  const es_ultima = estado.indice >= preguntas.length - 1;

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta={etiqueta}>
      <div ref={foco} tabIndex={-1} className="outline-none">
        {en_resumen ? (
          <div>
            <p className="text-subheading font-medium">Resolviste las {resumen.total} preguntas.</p>
            <p className="mt-2 text-body">
              Acertaste {resumen.a_la_primera} a la primera.{' '}
              {resumen.a_la_primera === resumen.total
                ? 'No fallaste ninguna.'
                : 'Las demás las lograste al volver a intentar, y así se aprende.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={boton} onClick={repasar}>
                <ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" />
                Repasar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm font-medium text-stone-text">
                Pregunta {estado.indice + 1} de {preguntas.length}
              </p>
              <Chip>{pregunta.nivel}</Chip>
            </div>

            <div
              className="mt-3 flex gap-1.5"
              role="img"
              aria-label={`${resumen.resueltas} de ${resumen.total} resueltas`}
            >
              {preguntas.map((p) => (
                <span
                  key={p.id}
                  className={`h-2 flex-1 rounded-full border border-ink-black ${
                    (estado.intentos[p.id] ?? []).includes(p.correcta)
                      ? 'bg-fresh-grass'
                      : 'bg-cream-paper'
                  }`}
                />
              ))}
            </div>

            {variante !== 'quiz' && pregunta.frase && (
              <blockquote className="mt-6 rounded-soft bg-cream-paper p-5">
                {variante === 'pistas' && (
                  <p className="mb-2 flex items-center gap-2 text-body-sm font-medium text-stone-text">
                    <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
                    Pista del texto
                  </p>
                )}
                {variante === 'fuente' && pregunta.marca && (
                  <p className="mb-2 inline-block rounded-chip bg-sunshine-pop px-2 py-0.5 text-micro font-medium">
                    {pregunta.marca}
                  </p>
                )}
                <p className="text-reading font-medium">{pregunta.frase}</p>
                {variante === 'fuente' && pregunta.ficha && (
                  <p className="mt-3 text-body-sm text-stone-text">
                    <span className="font-medium text-ink-black">Ficha de la fuente:</span>{' '}
                    {pregunta.ficha}
                  </p>
                )}
              </blockquote>
            )}

            <h4 className="mt-6 text-subheading font-medium">
              {pregunta.pregunta || pregunta_comun}
            </h4>

            <ul className="mt-5 flex flex-col gap-3" aria-label="Opciones">
              {opciones.map((op, i) => {
                const probada = intentos_actual.includes(op.id);
                const acierto = probada && es_correcta(pregunta, op.id);
                const fallo = probada && !acierto;
                return (
                  <li key={op.id}>
                    <button
                      type="button"
                      onClick={() => elegir(op.id)}
                      disabled={resuelta && !acierto}
                      aria-disabled={fallo || undefined}
                      className={`flex min-h-14 w-full items-center gap-4 rounded-soft border-2 px-4 py-3 text-left text-body transition-colors ${
                        acierto
                          ? 'border-ink-black bg-fresh-grass'
                          : fallo
                            ? 'border-hairline-mist bg-cream-paper text-stone-text'
                            : 'border-ink-black bg-pure-white hover:bg-cream-paper'
                      } ${resuelta && !acierto ? 'opacity-60' : ''}`}
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-ink-black bg-pure-white text-body-sm font-medium text-ink-black"
                        aria-hidden="true"
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{op.texto}</span>
                      {acierto && (
                        <span className="flex items-center gap-1 text-body-sm font-medium">
                          <CheckCircle size={22} weight="fill" aria-hidden="true" />
                          Correcta
                        </span>
                      )}
                      {fallo && (
                        <span className="flex items-center gap-1 text-body-sm">
                          <XCircle size={22} weight="fill" aria-hidden="true" />
                          Casi
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p role="status" aria-live="polite" className="mt-5 min-h-7 text-body">
              {mensaje}
            </p>

            {resuelta && (
              <div className="mt-4">
                <button type="button" className={boton_primario} onClick={siguiente}>
                  {es_ultima ? 'Ver mi resultado' : 'Siguiente pregunta'}
                  <ArrowRight size={20} weight="bold" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Superficie>
  );
}
