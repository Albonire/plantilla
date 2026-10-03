import { useEffect, useRef, useState } from 'react';
import { DownloadSimple, Microphone, Stop, Trash } from '@phosphor-icons/react';
import { borrar_blob, guardar_blob, leer_blob } from '../../lib/idb';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  unidad: number;
  titulo?: string;
  etiqueta?: string;
  // maximum length in seconds
  limite?: number;
}

const TIPOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

function tipo_soportado(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return TIPOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function extension(tipo: string): string {
  if (tipo.includes('mp4')) return 'm4a';
  if (tipo.includes('ogg')) return 'ogg';
  return 'webm';
}

const formato = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function GrabadoraVoz({
  unidad,
  titulo = 'Graba tu texto en voz alta',
  etiqueta = 'Tu voz cuenta',
  limite = 120,
}: Props) {
  const [soportado, set_soportado] = useState(true);
  const [estado, set_estado] = useState<'reposo' | 'grabando' | 'lista'>('reposo');
  const [segundos, set_segundos] = useState(0);
  const [url, set_url] = useState('');
  const [tipo, set_tipo] = useState('audio/webm');
  const [mensaje, set_mensaje] = useState('');
  const grabador = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);
  const reloj = useRef(0);
  const flujo = useRef<MediaStream | null>(null);
  const url_actual = useRef('');

  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      set_soportado(false);
      return;
    }
    leer_blob(`voz:${unidad}`).then((blob) => {
      if (!blob) return;
      const nueva = URL.createObjectURL(blob);
      url_actual.current = nueva;
      set_url(nueva);
      set_tipo(blob.type || 'audio/webm');
      set_estado('lista');
    });
    return () => {
      window.clearInterval(reloj.current);
      flujo.current?.getTracks().forEach((t) => t.stop());
      if (url_actual.current) URL.revokeObjectURL(url_actual.current);
    };
  }, [unidad]);

  async function empezar() {
    set_mensaje('');
    try {
      const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
      flujo.current = audio;
      const mime = tipo_soportado();
      const rec = mime ? new MediaRecorder(audio, { mimeType: mime }) : new MediaRecorder(audio);
      trozos.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.current.push(e.data);
      };
      rec.onstop = async () => {
        window.clearInterval(reloj.current);
        audio.getTracks().forEach((t) => t.stop());
        const tipo_final = rec.mimeType || mime || 'audio/webm';
        const blob = new Blob(trozos.current, { type: tipo_final });
        if (url_actual.current) URL.revokeObjectURL(url_actual.current);
        const nueva = URL.createObjectURL(blob);
        url_actual.current = nueva;
        set_url(nueva);
        set_tipo(tipo_final);
        set_estado('lista');
        const ok = await guardar_blob(`voz:${unidad}`, blob);
        set_mensaje(
          ok
            ? 'Tu grabación quedó guardada en este navegador. Descárgala para entregarla.'
            : 'Tu grabación está lista, pero este navegador no pudo guardarla. Descárgala ahora.',
        );
      };
      grabador.current = rec;
      rec.start();
      set_segundos(0);
      set_estado('grabando');
      reloj.current = window.setInterval(() => {
        set_segundos((s) => {
          if (s + 1 >= limite) {
            grabador.current?.stop();
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      set_mensaje(
        'No pudimos usar el micrófono. Revisa el permiso del navegador y vuelve a intentarlo.',
      );
      set_estado('reposo');
    }
  }

  function detener() {
    if (grabador.current && grabador.current.state !== 'inactive') grabador.current.stop();
  }

  async function descartar() {
    await borrar_blob(`voz:${unidad}`);
    if (url_actual.current) URL.revokeObjectURL(url_actual.current);
    url_actual.current = '';
    set_url('');
    set_estado('reposo');
    set_mensaje('Borraste la grabación.');
  }

  if (!soportado) {
    return (
      <Superficie tipo="conversa" titulo={titulo} etiqueta={etiqueta}>
        <p className="max-w-reading text-body">
          Este navegador no puede grabar audio. Puedes grabar tu lectura con el grabador de voz de
          tu equipo y entregar el archivo en la plataforma.
        </p>
      </Superficie>
    );
  }

  return (
    <Superficie tipo="conversa" titulo={titulo} etiqueta={etiqueta}>
      <p className="max-w-reading text-body">
        Lee tu texto de opinión en voz alta. Tu grabación se queda en tu dispositivo: no se envía a
        ningún lado hasta que tú la entregues en la plataforma. Puedes grabar hasta{' '}
        {formato(limite)}.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {estado !== 'grabando' && (
          <button type="button" className={boton_primario} onClick={empezar}>
            <Microphone size={20} weight="bold" aria-hidden="true" />
            {estado === 'lista' ? 'Grabar de nuevo' : 'Empezar a grabar'}
          </button>
        )}
        {estado === 'grabando' && (
          <>
            <button type="button" className={boton} onClick={detener}>
              <Stop size={20} weight="fill" aria-hidden="true" />
              Detener
            </button>
            <p
              className="flex items-center gap-2 text-body font-medium"
              role="timer"
              aria-live="off"
            >
              <span
                className="size-3 rounded-full bg-coral-pop ring-2 ring-ink-black"
                aria-hidden="true"
              />
              Grabando {formato(segundos)}
            </p>
          </>
        )}
      </div>

      {estado === 'lista' && url && (
        <div className="mt-6">
          <audio controls src={url} className="w-full max-w-xl" aria-label="Tu grabación" />
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={url}
              download={`aventura_lectora_caso_${unidad}_voz.${extension(tipo)}`}
              className={boton}
            >
              <DownloadSimple size={20} weight="bold" aria-hidden="true" />
              Descargar grabación
            </a>
            <button type="button" className={boton} onClick={descartar}>
              <Trash size={20} weight="bold" aria-hidden="true" />
              Borrar
            </button>
          </div>
        </div>
      )}
      <p role="status" aria-live="polite" className="mt-4 min-h-7 text-body">
        {mensaje}
      </p>
    </Superficie>
  );
}
