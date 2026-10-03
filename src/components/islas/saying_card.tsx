import { useState } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react';
import { TarjetaVolteable } from './tarjeta_volteable';
import { usar_almacen } from './hooks';
import { Superficie, area_texto, boton_primario } from './ui';

interface Props {
  principal: string;
  apoyo?: string;
  preguntas: string[];
  unidad: number;
  titulo?: string;
  etiqueta?: string;
}

export function SayingCard({
  principal,
  apoyo,
  preguntas,
  unidad,
  titulo = 'Un refrán para pensar',
  etiqueta,
}: Props) {
  const [volteada, set_volteada] = useState(false);
  const [respuestas, set_respuestas] = usar_almacen<string[]>(`refran:${unidad}`, []);

  return (
    <Superficie tipo="conversa" titulo={titulo} etiqueta={etiqueta} tono="arena">
      <TarjetaVolteable
        volteada={volteada}
        frente={
          <>
            <p className="text-body-sm font-medium text-stone-text">Refrán</p>
            <p className="mt-3 text-heading font-medium leading-tight tracking-tight">
              {principal}
            </p>
            {apoyo && <p className="mt-5 text-subheading text-stone-text">{apoyo}</p>}
          </>
        }
        reverso={
          <>
            <p className="text-body-sm font-medium">Piensa y responde</p>
            <ol className="mt-4 flex flex-col gap-5">
              {preguntas.map((p, i) => (
                <li key={p}>
                  <label htmlFor={`refran-${unidad}-${i}`} className="text-body font-medium">
                    {i + 1}. {p}
                  </label>
                  <textarea
                    id={`refran-${unidad}-${i}`}
                    rows={2}
                    maxLength={400}
                    className={`${area_texto} mt-2 bg-pure-white`}
                    value={respuestas[i] ?? ''}
                    onChange={(e) =>
                      set_respuestas((prev) => {
                        const copia = [...prev];
                        copia[i] = e.target.value;
                        return copia;
                      })
                    }
                  />
                </li>
              ))}
            </ol>
          </>
        }
      />
      <div className="mt-6">
        <button type="button" className={boton_primario} onClick={() => set_volteada((v) => !v)}>
          <ArrowsClockwise size={20} weight="bold" aria-hidden="true" />
          {volteada ? 'Volver al refrán' : 'Dar la vuelta a la tarjeta'}
        </button>
      </div>
    </Superficie>
  );
}
