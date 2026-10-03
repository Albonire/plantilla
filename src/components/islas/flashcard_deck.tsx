import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowsClockwise, Shuffle } from '@phosphor-icons/react';
import type { Tarjeta } from '../../lib/tipos';
import { barajar } from '../../lib/semilla';
import { TarjetaVolteable } from './tarjeta_volteable';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  tarjetas: Tarjeta[];
  unidad: number;
  titulo?: string;
}

export function FlashcardDeck({ tarjetas, unidad, titulo = 'Tarjetas del detective' }: Props) {
  const [orden_semilla, set_orden_semilla] = useState<number | null>(null);
  const [indice, set_indice] = useState(0);
  const [volteada, set_volteada] = useState(false);

  const mazo = useMemo(
    () => (orden_semilla === null ? tarjetas : barajar(tarjetas, `mazo${unidad}:${orden_semilla}`)),
    [tarjetas, orden_semilla, unidad],
  );
  const actual = mazo[indice];

  function ir(delta: number) {
    set_volteada(false);
    set_indice((i) => Math.min(mazo.length - 1, Math.max(0, i + delta)));
  }

  function mezclar() {
    set_volteada(false);
    set_indice(0);
    set_orden_semilla(Date.now() % 100000);
  }

  function volver_al_orden() {
    set_volteada(false);
    set_indice(0);
    set_orden_semilla(null);
  }

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta="Repasa lo que aprendiste" tono="arena">
      <p className="text-body-sm text-stone-text" id={`mazo-${unidad}-contador`}>
        Tarjeta {indice + 1} de {mazo.length}
      </p>

      <TarjetaVolteable
        className="mt-4"
        volteada={volteada}
        frente={
          <>
            <p className="text-body-sm font-medium text-stone-text">Pregunta</p>
            <p className="mt-2 text-heading-sm font-medium leading-tight tracking-tight">
              {actual.frente}
            </p>
          </>
        }
        reverso={
          <>
            <p className="text-body-sm font-medium">Respuesta</p>
            <p className="mt-2 text-subheading font-medium leading-snug">{actual.reverso}</p>
          </>
        }
      />

      <p className="sr-only" role="status" aria-live="polite">
        {volteada ? `Respuesta: ${actual.reverso}` : `Pregunta: ${actual.frente}`}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className={boton_primario} onClick={() => set_volteada((v) => !v)}>
          <ArrowsClockwise size={20} weight="bold" aria-hidden="true" />
          {volteada ? 'Ver la pregunta' : 'Voltear'}
        </button>
        <button type="button" className={boton} onClick={() => ir(-1)} disabled={indice === 0}>
          <ArrowLeft size={20} weight="bold" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          className={boton}
          onClick={() => ir(1)}
          disabled={indice === mazo.length - 1}
        >
          Siguiente
          <ArrowRight size={20} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className={boton} onClick={mezclar}>
          <Shuffle size={20} weight="bold" aria-hidden="true" />
          Barajar
        </button>
        {orden_semilla !== null && (
          <button type="button" className={boton} onClick={volver_al_orden}>
            Volver al orden
          </button>
        )}
      </div>
    </Superficie>
  );
}
