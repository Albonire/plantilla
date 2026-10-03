import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';
import { EtiquetaIA, Superficie, Transcripcion } from './ui';

interface Props {
  src: string;
  titulo: string;
  etiqueta?: string;
  // shown before the metadata loads, for example "1:31"
  duracion: string;
  transcripcion?: string;
  descripcion?: string;
}

const VELOCIDADES = [0.75, 1, 1.25];

function formatear(segundos: number): string {
  if (!Number.isFinite(segundos)) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function a_segundos(texto: string): number {
  const [m, s] = texto.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

export function AudioPodcast({
  src,
  titulo,
  etiqueta,
  duracion,
  transcripcion,
  descripcion,
}: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, set_sonando] = useState(false);
  const [actual, set_actual] = useState(0);
  const [total, set_total] = useState(a_segundos(duracion));
  const [velocidad, set_velocidad] = useState(1);
  const [error, set_error] = useState(false);

  useEffect(() => {
    const otro_empezo = (e: Event) => {
      const origen = (e as CustomEvent<HTMLAudioElement>).detail;
      if (origen !== audio.current && audio.current && !audio.current.paused) audio.current.pause();
    };
    document.addEventListener('audio:reproduciendo', otro_empezo);
    return () => document.removeEventListener('audio:reproduciendo', otro_empezo);
  }, []);

  async function alternar() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      document.dispatchEvent(new CustomEvent('audio:reproduciendo', { detail: el }));
      try {
        await el.play();
        set_error(false);
      } catch {
        set_error(true);
      }
    } else {
      el.pause();
    }
  }

  function cambiar_velocidad(v: number) {
    set_velocidad(v);
    if (audio.current) audio.current.playbackRate = v;
  }

  function buscar(valor: number) {
    if (audio.current) audio.current.currentTime = valor;
    set_actual(valor);
  }

  return (
    <Superficie tipo="escucha" titulo={titulo} etiqueta={etiqueta} tono="blanco">
      {descripcion && <p className="-mt-3 mb-6 max-w-reading text-body">{descripcion}</p>}
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => set_sonando(true)}
        onPause={() => set_sonando(false)}
        onEnded={() => set_sonando(false)}
        onTimeUpdate={(e) => set_actual(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) set_total(e.currentTarget.duration);
          e.currentTarget.playbackRate = velocidad;
        }}
      />

      <div className="flex items-center gap-4 md:gap-6">
        <button
          type="button"
          onClick={alternar}
          aria-label={sonando ? `Pausar: ${titulo}` : `Reproducir: ${titulo}`}
          className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-ink-black bg-fresh-grass text-ink-black transition-colors hover:bg-ink-black hover:text-cream-paper md:size-20"
        >
          {sonando ? (
            <Pause size={32} weight="fill" aria-hidden="true" />
          ) : (
            <Play size={32} weight="fill" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={total || 1}
            step={0.1}
            value={Math.min(actual, total || 1)}
            onChange={(e) => buscar(Number(e.target.value))}
            aria-label="Progreso del audio"
            aria-valuetext={`${formatear(actual)} de ${formatear(total)}`}
            className="h-11 w-full accent-ink-black"
          />
          <p className="flex justify-between text-body-sm text-stone-text" aria-hidden="true">
            <span>{formatear(actual)}</span>
            <span>{formatear(total)}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Velocidad">
        <span className="mr-1 text-body-sm text-stone-text">Velocidad</span>
        {VELOCIDADES.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={velocidad === v}
            onClick={() => cambiar_velocidad(v)}
            className={`min-h-11 min-w-14 rounded-pill border-2 border-ink-black px-3 text-body-sm font-medium ${
              velocidad === v ? 'bg-ink-black text-cream-paper' : 'bg-pure-white hover:bg-sandstone'
            }`}
          >
            {v}x
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-body-sm">
          No se pudo reproducir el audio. Revisa tu conexión y vuelve a intentarlo.
        </p>
      )}

      {transcripcion && (
        <div className="mt-6">
          <Transcripcion texto={transcripcion} />
        </div>
      )}
      <EtiquetaIA className="mt-5" />
    </Superficie>
  );
}
