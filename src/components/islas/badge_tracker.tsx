import { Lock } from '@phosphor-icons/react';
import { usar_progreso } from './hooks';
import { Insignia } from './insignia';
import { Superficie } from './ui';

interface InsigniaDato {
  caso: number;
  nombre: string;
  descripcion: string;
}

interface Props {
  modo: 'caso' | 'pasaporte';
  insignias: InsigniaDato[];
  unidad?: number;
}

export function BadgeTracker({ modo, insignias, unidad }: Props) {
  const progreso = usar_progreso();

  if (modo === 'caso') {
    const dato = insignias.find((i) => i.caso === unidad);
    if (!dato) return null;
    const ganada = progreso.resueltos.includes(dato.caso);
    return (
      <div className="flex flex-wrap items-center gap-6 rounded-card bg-pure-white p-7 md:p-10">
        <Insignia caso={dato.caso} size={112} ganada={ganada} titulo={`Insignia ${dato.nombre}`} />
        <div className="max-w-md">
          <p className="text-body-sm font-medium text-stone-text">Insignia del caso</p>
          <p className="text-heading-sm font-medium tracking-tight">{dato.nombre}</p>
          <p role="status" aria-live="polite" className="mt-2 text-body">
            {ganada ? (
              `Ganaste esta insignia. ${dato.descripcion}`
            ) : (
              <>
                <Lock
                  size={18}
                  weight="bold"
                  className="mr-1.5 inline align-[-3px]"
                  aria-hidden="true"
                />
                Resuelve el cuestionario de práctica para ganarla.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  const total = insignias.filter((i) => progreso.resueltos.includes(i.caso)).length;
  return (
    <Superficie
      titulo="Pasaporte del detective"
      etiqueta={`${total} de ${insignias.length} insignias`}
    >
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {insignias.map((i) => {
          const ganada = progreso.resueltos.includes(i.caso);
          return (
            <li key={i.caso} className="flex flex-col items-center text-center">
              <Insignia caso={i.caso} size={104} ganada={ganada} />
              <p className="mt-2 text-body-sm font-medium">{i.nombre}</p>
              <p className="text-micro text-stone-text">
                Caso {i.caso}: {ganada ? 'ganada' : 'por ganar'}
              </p>
            </li>
          );
        })}
      </ul>
    </Superficie>
  );
}
