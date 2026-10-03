import { useState } from 'react';
import { CheckCircle, Circle, FilePdf } from '@phosphor-icons/react';
import datos_retos from '../../data/retos.json';
import { leer } from '../../lib/almacen';
import { armar_texto } from '../../lib/opinion';
import type { Reto, RetoGuardado } from '../../lib/tipos';
import { usar_almacen, usar_nombre } from './hooks';
import { Superficie, area_texto, boton, boton_primario, campo_texto } from './ui';

interface Props {
  casos: { numero: number; titulo: string }[];
}

const RETOS = datos_retos.retos as Reto[];

function campos_del_reto(reto: Reto) {
  const guardado = leer<RetoGuardado>(`reto:${reto.caso}`, { valores: {} });
  const valores = guardado.valores ?? {};
  if (reto.caso === 5) {
    return {
      campos: [
        { etiqueta: 'Pregunta que elegí', valor: valores.pregunta ?? '' },
        { etiqueta: 'Mi texto de opinión', valor: armar_texto(valores) },
      ],
      imagen: undefined as string | undefined,
    };
  }
  return {
    campos: reto.campos.map((c) => ({
      etiqueta: c.etiqueta,
      grupo: c.grupo,
      valor:
        c.tipo === 'clasificacion'
          ? leer<string>(`${c.origen}:resumen`, '')
          : (valores[c.id] ?? ''),
    })),
    imagen: guardado.imagen,
  };
}

export function ExpedienteBuilder({ casos }: Props) {
  const [nombre, set_nombre] = usar_nombre();
  const [frase, set_frase] = usar_almacen<string>('frase_final', '');
  const [faltan, set_faltan] = useState<number[] | null>(null);
  const [estado, set_estado] = useState<'reposo' | 'generando' | 'listo' | 'error'>('reposo');

  function calcular_faltantes(): number[] {
    return RETOS.filter((r) => {
      const { campos } = campos_del_reto(r);
      return !campos.some((c) => c.valor.trim().length > 0);
    }).map((r) => r.caso);
  }

  async function armar() {
    set_estado('generando');
    try {
      const { descargar_expediente } = await import('../../lib/pdf');
      await descargar_expediente({
        nombre,
        frase_final: frase,
        retos: RETOS.map((r) => {
          const { campos, imagen } = campos_del_reto(r);
          const caso = casos.find((c) => c.numero === r.caso);
          return {
            caso: r.caso,
            titulo_caso: caso?.titulo ?? '',
            titulo_reto: r.titulo,
            campos,
            imagen,
          };
        }),
      });
      set_estado('listo');
    } catch {
      set_estado('error');
    }
  }

  function pedir() {
    const f = calcular_faltantes();
    if (f.length > 0 && faltan === null) {
      set_faltan(f);
      return;
    }
    set_faltan(null);
    void armar();
  }

  const faltantes_ahora = faltan ?? [];

  return (
    <Superficie titulo="Armar mi expediente" etiqueta="Producto final">
      <p className="max-w-reading text-body">
        Junta en un solo PDF la portada con tu nombre, los cinco retos que guardaste en este
        navegador y tu frase final.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="exp-nombre" className="text-body font-medium">
            Tu nombre
          </label>
          <input
            id="exp-nombre"
            type="text"
            autoComplete="off"
            maxLength={80}
            value={nombre}
            onChange={(e) => set_nombre(e.target.value)}
            className={`${campo_texto} mt-2`}
          />
        </div>
        <div>
          <label htmlFor="exp-frase" className="text-body font-medium">
            Lo que más aprendí como detective fue...
          </label>
          <textarea
            id="exp-frase"
            rows={3}
            maxLength={400}
            value={frase}
            onChange={(e) => set_frase(e.target.value)}
            className={`${area_texto} mt-2`}
          />
        </div>
      </div>

      <ul className="mt-8 grid gap-2 md:grid-cols-2" aria-label="Estado de tus retos">
        {RETOS.map((r) => {
          const caso = casos.find((c) => c.numero === r.caso);
          const falta = faltantes_ahora.includes(r.caso);
          return (
            <li
              key={r.id}
              className={`flex min-h-12 items-center gap-3 rounded-soft px-4 text-body-sm ${falta ? 'bg-coral-pop font-medium' : 'bg-cream-paper'}`}
            >
              {falta ? (
                <Circle size={20} aria-hidden="true" />
              ) : (
                <CheckCircle size={20} weight="fill" aria-hidden="true" />
              )}
              <span>
                Caso {r.caso}: {caso?.titulo}
                {falta && ' (todavía sin trabajo guardado)'}
              </span>
            </li>
          );
        })}
      </ul>

      {faltan !== null && (
        <div role="alert" className="mt-6 rounded-soft bg-sunshine-pop p-5">
          <p className="text-body font-medium">
            Te faltan {faltan.length} {faltan.length === 1 ? 'reto' : 'retos'} sin trabajo guardado
            (casos {faltan.join(', ')}). Puedes volver a completarlos o armar el expediente con lo
            que tienes.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className={boton_primario} onClick={pedir}>
              Armar con lo que tengo
            </button>
            <button type="button" className={boton} onClick={() => set_faltan(null)}>
              Volver a completar
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={boton_primario}
          onClick={pedir}
          disabled={estado === 'generando' || !nombre.trim()}
        >
          <FilePdf size={20} weight="bold" aria-hidden="true" />
          {estado === 'generando' ? 'Armando...' : 'Armar mi expediente'}
        </button>
        {!nombre.trim() && (
          <p className="text-body-sm text-stone-text">Escribe tu nombre para armarlo.</p>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-7 text-body">
        {estado === 'listo' && 'Tu expediente se descargó. Súbelo a la plataforma del curso.'}
        {estado === 'error' && 'No se pudo armar el expediente. Vuelve a intentarlo.'}
      </p>
    </Superficie>
  );
}
