import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUUpLeft, Eraser, FloppyDisk, Trash, UploadSimple } from '@phosphor-icons/react';
import type { RetoGuardado } from '../../lib/tipos';
import { usar_almacen } from './hooks';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  unidad: number;
  titulo?: string;
  etiqueta?: string;
  ayuda?: string;
}

const ANCHO = 800;
const ALTO = 500;
const COLORES = [
  { id: 'tinta', nombre: 'Tinta', valor: '#2c2e2a' },
  { id: 'verde', nombre: 'Verde', valor: '#8ed462' },
  { id: 'azul', nombre: 'Azul cielo', valor: '#2ba0ff' },
  { id: 'coral', nombre: 'Coral', valor: '#ff705d' },
  { id: 'sol', nombre: 'Amarillo sol', valor: '#f5e211' },
];
const GROSORES = [
  { id: 'fino', nombre: 'Fino', valor: 4 },
  { id: 'medio', nombre: 'Medio', valor: 10 },
  { id: 'grueso', nombre: 'Grueso', valor: 22 },
];
const FONDO = '#ffffff';
const VACIO: RetoGuardado = { valores: {} };

// drawing area used in the case 2 challenge (image for the how-to text)
export function LienzoDibujo({
  unidad,
  titulo = 'Tu imagen digital',
  etiqueta = 'Dibuja o sube una imagen',
  ayuda = 'Puedes dibujar aquí con el mouse o con el dedo, o subir una imagen que hayas hecho en otra herramienta.',
}: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const historial = useRef<ImageData[]>([]);
  const [color, set_color] = useState(COLORES[0].id);
  const [grosor, set_grosor] = useState(GROSORES[1].id);
  const [borrador, set_borrador] = useState(false);
  const [mensaje, set_mensaje] = useState('');
  const [guardado, set_guardado] = usar_almacen<RetoGuardado>(`reto:${unidad}`, VACIO);

  const contexto = useCallback(
    () => lienzo.current?.getContext('2d', { willReadFrequently: true }) ?? null,
    [],
  );

  const limpiar_fondo = useCallback(() => {
    const ctx = contexto();
    if (!ctx) return;
    ctx.fillStyle = FONDO;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }, [contexto]);

  useEffect(() => {
    limpiar_fondo();
    if (!guardado.imagen) return;
    const img = new Image();
    img.onload = () => contexto()?.drawImage(img, 0, 0, ANCHO, ALTO);
    img.src = guardado.imagen;
    // load the saved drawing only once
  }, []);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * ANCHO,
      y: ((e.clientY - r.top) / r.height) * ALTO,
    };
  }

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = contexto();
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    historial.current = [...historial.current.slice(-11), ctx.getImageData(0, 0, ANCHO, ALTO)];
    dibujando.current = true;
    const p = punto(e);
    ultimo.current = p;
    trazar(p, p);
  }

  function trazar(desde: { x: number; y: number }, hasta: { x: number; y: number }) {
    const ctx = contexto();
    if (!ctx) return;
    const g = GROSORES.find((x) => x.id === grosor)?.valor ?? 10;
    ctx.strokeStyle = borrador ? FONDO : (COLORES.find((c) => c.id === color)?.valor ?? '#2c2e2a');
    ctx.lineWidth = borrador ? g * 2 : g;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(hasta.x, hasta.y);
    ctx.stroke();
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current || !ultimo.current) return;
    const p = punto(e);
    trazar(ultimo.current, p);
    ultimo.current = p;
  }

  function terminar() {
    dibujando.current = false;
    ultimo.current = null;
  }

  function deshacer() {
    const ctx = contexto();
    const previo = historial.current.pop();
    if (ctx && previo) ctx.putImageData(previo, 0, 0);
  }

  function borrar_todo() {
    const ctx = contexto();
    if (ctx)
      historial.current = [...historial.current.slice(-11), ctx.getImageData(0, 0, ANCHO, ALTO)];
    limpiar_fondo();
    set_guardado((g) => ({ ...g, imagen: undefined }));
    set_mensaje('Limpiaste el dibujo.');
  }

  function guardar() {
    const url = lienzo.current?.toDataURL('image/png');
    if (!url) return;
    set_guardado((g) => ({ ...g, imagen: url }));
    set_mensaje('Guardaste tu imagen. Va a salir en el PDF de tu reto.');
  }

  function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('image/') || archivo.size > 8 * 1024 * 1024) {
      set_mensaje('Elige una imagen de menos de 8 MB.');
      return;
    }
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const ctx = contexto();
      if (ctx) {
        historial.current = [...historial.current.slice(-11), ctx.getImageData(0, 0, ANCHO, ALTO)];
        limpiar_fondo();
        const escala = Math.min(ANCHO / img.width, ALTO / img.height);
        const w = img.width * escala;
        const h = img.height * escala;
        ctx.drawImage(img, (ANCHO - w) / 2, (ALTO - h) / 2, w, h);
        set_mensaje('Tu imagen está en el lienzo. Pulsa Guardar imagen.');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      set_mensaje('No se pudo abrir esa imagen.');
    };
    img.src = url;
  }

  return (
    <Superficie tipo="escribe" titulo={titulo} etiqueta={etiqueta} tono="blanco">
      <p className="max-w-reading text-body">{ayuda}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Color" className="flex items-center gap-2">
          {COLORES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.nombre}
              aria-pressed={!borrador && color === c.id}
              onClick={() => {
                set_color(c.id);
                set_borrador(false);
              }}
              className={`size-11 rounded-full border-2 border-ink-black ${!borrador && color === c.id ? 'ring-4 ring-ink-black ring-offset-2' : ''}`}
              style={{ backgroundColor: c.valor }}
            />
          ))}
        </div>
        <div role="group" aria-label="Grosor" className="flex items-center gap-2">
          {GROSORES.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={grosor === g.id}
              onClick={() => set_grosor(g.id)}
              className={`min-h-11 rounded-pill border-2 border-ink-black px-4 text-body-sm font-medium ${
                grosor === g.id
                  ? 'bg-ink-black text-cream-paper'
                  : 'bg-pure-white hover:bg-sandstone'
              }`}
            >
              {g.nombre}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={boton}
          aria-pressed={borrador}
          onClick={() => set_borrador((b) => !b)}
        >
          <Eraser size={20} weight="bold" aria-hidden="true" />
          Borrador
        </button>
        <button type="button" className={boton} onClick={deshacer}>
          <ArrowUUpLeft size={20} weight="bold" aria-hidden="true" />
          Deshacer
        </button>
        <button type="button" className={boton} onClick={borrar_todo}>
          <Trash size={20} weight="bold" aria-hidden="true" />
          Limpiar
        </button>
      </div>

      <canvas
        ref={lienzo}
        width={ANCHO}
        height={ALTO}
        role="img"
        aria-label="Área de dibujo. Se usa con el mouse o con el dedo."
        className="mt-5 block w-full max-w-3xl rounded-soft border-2 border-ink-black bg-pure-white [touch-action:none]"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        onPointerLeave={terminar}
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className={boton_primario} onClick={guardar}>
          <FloppyDisk size={20} weight="bold" aria-hidden="true" />
          Guardar imagen
        </button>
        <label className={`${boton} cursor-pointer`}>
          <UploadSimple size={20} weight="bold" aria-hidden="true" />
          Subir una imagen
          <input type="file" accept="image/*" className="sr-only" onChange={subir} />
        </label>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-7 text-body">
        {mensaje}
      </p>
    </Superficie>
  );
}
