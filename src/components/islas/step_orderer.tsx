import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, CheckCircle, DotsSixVertical, XCircle } from '@phosphor-icons/react';
import { barajar } from '../../lib/semilla';
import { es_orden_correcto, posiciones_correctas } from '../../lib/ordenar';
import { usar_almacen } from './hooks';
import { Superficie, boton, boton_primario } from './ui';

export interface Paso {
  id: string;
  texto: string;
}

interface Props {
  // steps in their correct order
  pasos: Paso[];
  unidad: number;
  id: string;
  titulo?: string;
  etiqueta?: string;
  instruccion?: string;
  retro_error: string;
  retro_acierto?: string;
}

function ItemPaso({
  paso,
  posicion,
  total,
  resultado,
  subir,
  bajar,
}: {
  paso: Paso;
  posicion: number;
  total: number;
  resultado?: boolean;
  subir: () => void;
  bajar: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paso.id });
  const estilo = { transform: CSS.Transform.toString(transform), transition };
  const color =
    resultado === undefined ? 'bg-pure-white' : resultado ? 'bg-fresh-grass' : 'bg-coral-pop';
  return (
    <li
      ref={setNodeRef}
      style={estilo}
      className={`flex items-center gap-3 rounded-soft border-2 border-ink-black p-3 ${color} ${isDragging ? 'z-10 opacity-70' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Arrastrar el paso: ${paso.texto}`}
        className="flex size-10 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-md bg-cream-paper active:cursor-grabbing"
      >
        <DotsSixVertical size={22} weight="bold" aria-hidden="true" />
      </button>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink-black bg-pure-white text-body-sm font-medium">
        {posicion + 1}
      </span>
      <span className="flex-1 text-body">{paso.texto}</span>
      {resultado !== undefined && (
        <span className="flex items-center gap-1 text-body-sm font-medium">
          {resultado ? (
            <>
              <CheckCircle size={20} weight="fill" aria-hidden="true" /> En su lugar
            </>
          ) : (
            <>
              <XCircle size={20} weight="fill" aria-hidden="true" /> Revisa
            </>
          )}
        </span>
      )}
      <span className="flex shrink-0 flex-col gap-1.5">
        <button
          type="button"
          onClick={subir}
          disabled={posicion === 0}
          aria-label={`Subir el paso ${posicion + 1}: ${paso.texto}`}
          className="flex size-11 items-center justify-center rounded-soft border-2 border-ink-black bg-cream-paper hover:bg-sandstone disabled:opacity-30"
        >
          <ArrowUp size={18} weight="bold" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={bajar}
          disabled={posicion === total - 1}
          aria-label={`Bajar el paso ${posicion + 1}: ${paso.texto}`}
          className="flex size-11 items-center justify-center rounded-soft border-2 border-ink-black bg-cream-paper hover:bg-sandstone disabled:opacity-30"
        >
          <ArrowDown size={18} weight="bold" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export function StepOrderer({
  pasos,
  unidad,
  id,
  titulo = 'Ordena los pasos',
  etiqueta,
  instruccion,
  retro_error,
  retro_acierto,
}: Props) {
  const correcto = useMemo(() => pasos.map((p) => p.id), [pasos]);
  const inicial = useMemo(() => {
    let mezcla = barajar(correcto, `pasos${unidad}${id}`);
    // never start already solved
    if (es_orden_correcto(mezcla, correcto)) mezcla = [...mezcla].reverse();
    return mezcla;
  }, [correcto, unidad, id]);

  const [orden, set_orden] = usar_almacen<string[]>(`pasos:${unidad}:${id}`, inicial);
  const [revisado, set_revisado] = useState(false);
  const por_id = useMemo(() => new Map(pasos.map((p) => [p.id, p])), [pasos]);
  const orden_valido =
    orden.length === pasos.length && orden.every((x) => por_id.has(x)) ? orden : inicial;

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function actualizar(nuevo: string[]) {
    set_revisado(false);
    set_orden(nuevo);
  }

  function al_soltar(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const desde = orden_valido.indexOf(String(e.active.id));
    const hasta = orden_valido.indexOf(String(e.over.id));
    actualizar(arrayMove(orden_valido, desde, hasta));
  }

  const posiciones = posiciones_correctas(orden_valido, correcto);
  const acierto = es_orden_correcto(orden_valido, correcto);

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta={etiqueta}>
      {instruccion && <p className="max-w-reading text-body">{instruccion}</p>}
      <DndContext
        id={`pasos-${unidad}-${id}`}
        sensors={sensores}
        collisionDetection={closestCenter}
        onDragEnd={al_soltar}
      >
        <SortableContext items={orden_valido} strategy={verticalListSortingStrategy}>
          <ol className="mt-6 flex flex-col gap-3" aria-label="Pasos">
            {orden_valido.map((paso_id, i) => (
              <ItemPaso
                key={paso_id}
                paso={por_id.get(paso_id) as Paso}
                posicion={i}
                total={orden_valido.length}
                resultado={revisado ? posiciones[i] : undefined}
                subir={() => actualizar(arrayMove(orden_valido, i, i - 1))}
                bajar={() => actualizar(arrayMove(orden_valido, i, i + 1))}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className={boton_primario} onClick={() => set_revisado(true)}>
          Revisar el orden
        </button>
        <button
          type="button"
          className={boton}
          onClick={() => {
            set_revisado(false);
            set_orden(inicial);
          }}
        >
          Desordenar de nuevo
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-7 text-body font-medium">
        {revisado
          ? acierto
            ? (retro_acierto ?? '¡Excelente deducción! El orden de los pasos es correcto.')
            : retro_error
          : ''}
      </p>
    </Superficie>
  );
}
