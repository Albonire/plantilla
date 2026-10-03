import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, Play, SpeakerHigh } from '@phosphor-icons/react';
import { EtiquetaIA, Superficie, Transcripcion } from './ui';
import { usar_movimiento } from './hooks';

interface Props {
  titulo: string;
  etiqueta?: string;
  webm?: string;
  mp4: string;
  poster: string;
  duracion: string;
  transcripcion?: string;
  descripcion?: string;
}

// the video already carries its captions in the picture, so there is no caption track.
// it starts with sound when it reaches the middle of the screen and pauses when it leaves.
// only with the "movimiento" switch on, and never on data saver. only one media plays at a time.
export function VideoOverview({
  titulo,
  etiqueta,
  webm,
  mp4,
  poster,
  duracion,
  transcripcion,
  descripcion,
}: Props) {
  const movimiento = usar_movimiento();
  const contenedor = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  // a pause that the code asked for, so it is not taken as "the student paused it"
  const pausa_programada = useRef(false);
  const pausado_a_mano = useRef(false);
  const otro_medio = useRef<HTMLMediaElement | null>(null);
  const movimiento_ref = useRef(movimiento);
  movimiento_ref.current = movimiento;

  const [reproduciendo, set_reproduciendo] = useState(false);
  const [terminado, set_terminado] = useState(false);
  const [silenciado, set_silenciado] = useState(false);
  const [iniciado, set_iniciado] = useState(false);

  useEffect(() => {
    const el = video.current;
    const caja = contenedor.current;
    if (!el || !caja) return;

    const pausar = () => {
      if (el.paused) return;
      pausa_programada.current = true;
      el.pause();
    };

    const puede_solo = () => {
      const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection;
      const otro_suena = otro_medio.current && !otro_medio.current.paused;
      return (
        movimiento_ref.current &&
        !conexion?.saveData &&
        !pausado_a_mano.current &&
        !otro_suena &&
        document.visibilityState === 'visible' &&
        el.paused &&
        !el.ended
      );
    };

    const arrancar_solo = async () => {
      if (!puede_solo()) return;
      el.muted = false;
      set_silenciado(false);
      document.dispatchEvent(new CustomEvent('audio:reproduciendo', { detail: el }));
      try {
        await el.play();
      } catch {
        // the browser refused unmuted autoplay: keep it paused so the user can play with sound
        el.pause();
        pausa_programada.current = false;
      }
    };

    // start loading the metadata only when the video is close to the screen
    const cerca = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting) && el.preload === 'none') {
          el.preload = 'metadata';
          cerca.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    cerca.observe(caja);

    // play in the middle band of the screen, pause when it leaves
    const en_vista = new IntersectionObserver(
      (entradas) => {
        const ratio = entradas[0]?.intersectionRatio ?? 0;
        if (ratio >= 0.6) void arrancar_solo();
        else if (ratio < 0.25) {
          pausado_a_mano.current = false;
          pausar();
        }
      },
      { threshold: [0, 0.25, 0.6], rootMargin: '-8% 0px -8% 0px' },
    );
    en_vista.observe(caja);

    const otro_empezo = (e: Event) => {
      const origen = (e as CustomEvent<HTMLMediaElement>).detail;
      if (origen === el) return;
      otro_medio.current = origen;
      pausar();
    };
    const al_ocultar = () => {
      if (document.visibilityState === 'hidden') pausar();
    };
    document.addEventListener('audio:reproduciendo', otro_empezo);
    document.addEventListener('visibilitychange', al_ocultar);
    return () => {
      cerca.disconnect();
      en_vista.disconnect();
      document.removeEventListener('audio:reproduciendo', otro_empezo);
      document.removeEventListener('visibilitychange', al_ocultar);
    };
  }, []);

  function reproducir_con_sonido() {
    const el = video.current;
    if (!el) return;
    pausado_a_mano.current = false;
    el.muted = false;
    set_silenciado(false);
    document.dispatchEvent(new CustomEvent('audio:reproduciendo', { detail: el }));
    void el.play().catch(() => {
      el.muted = true;
      set_silenciado(true);
      void el.play().catch(() => undefined);
    });
  }

  function ver_otra_vez() {
    const el = video.current;
    if (!el) return;
    el.currentTime = 0;
    set_terminado(false);
    reproducir_con_sonido();
  }

  function activar_sonido() {
    const el = video.current;
    if (!el) return;
    el.muted = false;
    set_silenciado(false);
  }

  const pausado = !reproduciendo && !terminado;

  return (
    <Superficie tipo="mira" titulo={titulo} etiqueta={etiqueta}>
      <div className="grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:items-start">
        <div className="mx-auto w-full max-w-[20rem]">
          <div
            ref={contenedor}
            className="relative aspect-[9/16] overflow-hidden rounded-soft border-2 border-ink-black bg-ink-black"
          >
            <video
              ref={video}
              className="absolute inset-0 h-full w-full object-contain"
              controls={iniciado}
              playsInline
              preload="none"
              poster={poster}
              aria-label={titulo}
              onPlay={() => {
                set_reproduciendo(true);
                set_terminado(false);
                set_iniciado(true);
              }}
              onPause={() => {
                set_reproduciendo(false);
                if (!pausa_programada.current && !video.current?.ended) {
                  pausado_a_mano.current = true;
                }
                pausa_programada.current = false;
              }}
              onEnded={() => {
                set_reproduciendo(false);
                set_terminado(true);
              }}
              onVolumeChange={(e) => set_silenciado(e.currentTarget.muted)}
            >
              {webm && <source src={webm} type='video/webm; codecs="av01.0.05M.08, opus"' />}
              <source src={mp4} type="video/mp4" />
              Tu navegador no puede reproducir este video.
            </video>

            {pausado && (
              <button
                type="button"
                onClick={reproducir_con_sonido}
                className={`group absolute inset-x-0 top-0 z-10 flex items-center justify-center ${iniciado ? 'bottom-14' : 'bottom-0'}`}
                aria-label={`Ver el video: ${titulo} (${duracion})`}
              >
                <span className="flex size-20 items-center justify-center rounded-full border-2 border-ink-black bg-fresh-grass text-ink-black group-hover:bg-ink-black group-hover:text-cream-paper">
                  <Play size={36} weight="fill" aria-hidden="true" />
                </span>
                {!iniciado && (
                  <span className="interfaz absolute bottom-3 left-3 rounded-pill border-2 border-ink-black bg-pure-white px-3 py-1 text-micro font-medium text-ink-black">
                    {duracion}
                  </span>
                )}
              </button>
            )}

            {terminado && (
              <button
                type="button"
                onClick={ver_otra_vez}
                className="interfaz absolute inset-x-0 top-0 bottom-14 z-10 flex flex-col items-center justify-center gap-3 bg-ink-black/70 text-cream-paper"
              >
                <span className="flex size-16 items-center justify-center rounded-full border-2 border-ink-black bg-fresh-grass text-ink-black">
                  <ArrowCounterClockwise size={32} weight="bold" aria-hidden="true" />
                </span>
                <span className="text-body font-medium">Ver otra vez</span>
              </button>
            )}

            {silenciado && reproduciendo && (
              <button
                type="button"
                onClick={activar_sonido}
                className="interfaz absolute right-3 top-3 z-20 inline-flex min-h-11 items-center gap-2 rounded-pill border-2 border-ink-black bg-pure-white px-4 text-body-sm font-medium text-ink-black hover:bg-sandstone"
              >
                <SpeakerHigh size={20} weight="bold" aria-hidden="true" />
                Activar sonido
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {descripcion && <p className="max-w-reading text-body">{descripcion}</p>}
          <p className="text-body-sm text-stone-text">Duración: {duracion}.</p>
          {transcripcion && <Transcripcion texto={transcripcion} />}
          <EtiquetaIA />
        </div>
      </div>
    </Superficie>
  );
}
