import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { CheckCircle, DotsSixVertical, XCircle } from '@phosphor-icons/react';
import { corregir, ubicar, type Asignaciones } from '../../lib/clasificar';
import { guardar } from '../../lib/almacen';
import type { CajaClasificar, ItemClasificar } from '../../lib/tipos';
import { usar_almacen } from './hooks';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  items: ItemClasificar[];
  cajas: CajaClasificar[];
  unidad: number;
  id: string;
  titulo?: string;
  etiqueta?: string;
  instruccion?: string;
}

const BANDEJA = 'bandeja';

// keyboard drag jumps between boxes instead of moving 25px at a time
const saltar_entre_cajas: KeyboardCoordinateGetter = (evento, { context }) => {
  const { droppableRects, droppableContainers, over } = context;
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(evento.code)) return undefined;
  evento.preventDefault();
  const ids = droppableContainers.getEnabled().map((c) => c.id);
  if (!ids.length) return undefined;
  const actual = over ? ids.indexOf(over.id) : -1;
  const paso = evento.code === 'ArrowRight' || evento.code === 'ArrowDown' ? 1 : -1;
  const siguiente =
    actual === -1 ? (paso === 1 ? 0 : ids.length - 1) : (actual + paso + ids.length) % ids.length;
  const rect = droppableRects.get(ids[siguiente]);
  if (!rect) return undefined;
  return { x: rect.left + 12, y: rect.top + 12 };
};

function TarjetaItem({
  item,
  cajas,
  ubicacion,
  resultado,
  al_mover,
}: {
  item: ItemClasificar;
  cajas: CajaClasificar[];
  ubicacion: string;
  resultado?: 'bien' | 'mal' | 'sin_ubicar';
  al_mover: (caja: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: item.id,
  });
  const borde =
    resultado === 'bien'
      ? 'border-ink-black bg-fresh-grass'
      : resultado === 'mal'
        ? 'border-ink-black bg-coral-pop'
        : 'border-ink-black bg-pure-white';
  return (
    <li
      ref={setNodeRef}
      className={`rounded-soft border-2 p-3 text-body-sm ${borde} ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="flex size-11 shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-soft bg-cream-paper active:cursor-grabbing"
          aria-label={`Mover la tarjeta: ${item.texto}`}
        >
          <DotsSixVertical size={20} weight="bold" aria-hidden="true" />
        </button>
        <p className="flex-1 pt-2.5 text-body">{item.texto}</p>
      </div>
      {resultado && resultado !== 'sin_ubicar' && (
        <p className="mt-2 flex items-center gap-1.5 font-medium">
          {resultado === 'bien' ? (
            <>
              <CheckCircle size={20} weight="fill" aria-hidden="true" /> Bien ubicada
            </>
          ) : (
            <>
              <XCircle size={20} weight="fill" aria-hidden="true" /> Esta va en otra caja
            </>
          )}
        </p>
      )}
      <div
        className="interfaz mt-3 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={`Mover a una caja: ${item.texto}`}
      >
        <span className="text-micro font-medium text-stone-text">Mover a:</span>
        {cajas.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => al_mover(ubicacion === c.id ? null : c.id)}
            aria-pressed={ubicacion === c.id}
            className={`min-h-11 rounded-pill border-2 border-ink-black px-3 text-body-sm font-medium transition-colors ${
              ubicacion === c.id
                ? 'bg-ink-black text-cream-paper'
                : 'bg-pure-white text-ink-black hover:bg-sandstone'
            }`}
          >
            {c.titulo}
          </button>
        ))}
        {ubicacion !== BANDEJA && (
          <button
            type="button"
            onClick={() => al_mover(null)}
            className="min-h-11 rounded-pill border-2 border-dashed border-stone-gray px-3 text-body-sm text-stone-text hover:bg-sandstone"
          >
            Quitar
          </button>
        )}
      </div>
    </li>
  );
}

function Zona({
  id,
  titulo,
  descripcion,
  children,
  vacia,
}: {
  id: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  vacia: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={titulo}
      className={`rounded-soft border-2 p-4 transition-colors ${
        isOver
          ? 'border-ink-black bg-sunshine-pop'
          : 'border-dashed border-ink-black bg-cream-paper'
      }`}
    >
      <h4 className="text-body font-medium">{titulo}</h4>
      {descripcion && <p className="text-body-sm text-stone-text">{descripcion}</p>}
      <ul className="mt-3 flex min-h-20 flex-col gap-3">{children}</ul>
      <p className="mt-2 text-micro text-stone-text empty:hidden" aria-hidden="true">
        {vacia}
      </p>
    </section>
  );
}

export function DragSort({
  items,
  cajas,
  unidad,
  id,
  titulo = 'Clasifica las tarjetas',
  etiqueta,
  instruccion,
}: Props) {
  const [asignaciones, set_asignaciones] = usar_almacen<Asignaciones>(
    `clasificar:${unidad}:${id}`,
    {},
  );
  const [revisado, set_revisado] = useState(false);
  const [activa, set_activa] = useState<string | null>(null);

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: saltar_entre_cajas }),
  );

  const por_id = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const nombre_zona = (zona: string | number) =>
    zona === BANDEJA
      ? 'las tarjetas sin ubicar'
      : `la caja ${cajas.find((c) => c.id === zona)?.titulo ?? ''}`;

  const anuncios: Announcements = {
    onDragStart: ({ active }) =>
      `Levantaste la tarjeta: ${por_id.get(String(active.id))?.texto ?? ''}.`,
    onDragOver: ({ over }) =>
      over ? `Está sobre ${nombre_zona(over.id)}.` : 'No está sobre ninguna caja.',
    onDragEnd: ({ over }) =>
      over
        ? `Soltaste la tarjeta en ${nombre_zona(over.id)}.`
        : 'Soltaste la tarjeta fuera de las cajas.',
    onDragCancel: () => 'Cancelaste el movimiento.',
  };

  const correccion = useMemo(() => corregir(items, asignaciones), [items, asignaciones]);

  // readable copy of the answer, used by the challenge pdf
  useEffect(() => {
    const resumen = items
      .map((i) => {
        const caja = cajas.find((c) => c.id === asignaciones[i.id]);
        return `"${i.texto}": ${caja ? caja.titulo : 'sin ubicar'}`;
      })
      .join('\n');
    guardar(`clasificar:${unidad}:${id}:resumen`, resumen);
  }, [items, cajas, asignaciones, unidad, id]);

  function mover(item_id: string, caja: string | null) {
    set_revisado(false);
    set_asignaciones((a) => ubicar(a, item_id, caja));
  }

  function al_soltar(e: DragEndEvent) {
    set_activa(null);
    if (!e.over) return;
    const destino = String(e.over.id);
    mover(String(e.active.id), destino === BANDEJA ? null : destino);
  }

  function al_empezar(e: DragStartEvent) {
    set_activa(String(e.active.id));
  }

  const sin_ubicar = items.filter((i) => (asignaciones[i.id] ?? null) === null);
  const perfecto = revisado && correccion.aciertos === correccion.total;
  const item_activo = activa ? por_id.get(activa) : null;

  return (
    <Superficie tipo="practica" titulo={titulo} etiqueta={etiqueta}>
      {instruccion && <p className="max-w-reading text-body">{instruccion}</p>}
      <p className="mt-2 text-body-sm text-stone-text">
        Arrastra cada tarjeta a su caja o toca uno de los botones &quot;Mover a&quot; que trae la
        tarjeta.
      </p>

      <DndContext
        id={`clasificar-${unidad}-${id}`}
        sensors={sensores}
        onDragStart={al_empezar}
        onDragEnd={al_soltar}
        onDragCancel={() => set_activa(null)}
        accessibility={{
          announcements: anuncios,
          screenReaderInstructions: {
            draggable:
              'Para mover la tarjeta con el teclado, pulsa la barra espaciadora, usa las flechas para saltar entre cajas y vuelve a pulsar la barra espaciadora para soltarla. También puedes usar los botones Mover a de la tarjeta.',
          },
        }}
      >
        <div className="mt-6 flex flex-col gap-6">
          <Zona id={BANDEJA} titulo="Tarjetas por ubicar" vacia="">
            {sin_ubicar.map((item) => (
              <TarjetaItem
                key={item.id}
                item={item}
                cajas={cajas}
                ubicacion={BANDEJA}
                resultado={revisado ? correccion.resultados[item.id] : undefined}
                al_mover={(c) => mover(item.id, c)}
              />
            ))}
            {sin_ubicar.length === 0 && (
              <li className="text-body-sm text-stone-text">Ya ubicaste todas las tarjetas.</li>
            )}
          </Zona>

          <div className={`grid gap-4 ${cajas.length > 2 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
            {cajas.map((caja) => (
              <Zona
                key={caja.id}
                id={caja.id}
                titulo={caja.titulo}
                descripcion={caja.descripcion}
                vacia=""
              >
                {items
                  .filter((i) => asignaciones[i.id] === caja.id)
                  .map((item) => (
                    <TarjetaItem
                      key={item.id}
                      item={item}
                      cajas={cajas}
                      ubicacion={caja.id}
                      resultado={revisado ? correccion.resultados[item.id] : undefined}
                      al_mover={(c) => mover(item.id, c)}
                    />
                  ))}
              </Zona>
            ))}
          </div>
        </div>

        <DragOverlay>
          {item_activo ? (
            <div className="rounded-soft border-2 border-ink-black bg-sunshine-pop p-3 text-body">
              {item_activo.texto}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
            set_asignaciones({});
            set_revisado(false);
          }}
        >
          Empezar de nuevo
        </button>
        {!correccion.completo && (
          <p className="text-body-sm text-stone-text">
            Ubica todas las tarjetas para poder revisar.
          </p>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-4 min-h-7 text-body font-medium">
        {revisado
          ? perfecto
            ? `Muy bien: las ${correccion.total} tarjetas están en su caja.`
            : `Acertaste ${correccion.aciertos} de ${correccion.total}. Revisa las tarjetas señaladas y vuelve a intentar.`
          : ''}
      </p>
    </Superficie>
  );
}
