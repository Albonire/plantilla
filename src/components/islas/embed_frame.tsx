import { useEffect, useRef, useState } from 'react';
import { ArrowsOut, ArrowSquareOut, Play } from '@phosphor-icons/react';
import { Superficie, boton, boton_primario } from './ui';

interface Props {
  titulo: string;
  etiqueta?: string;
  descripcion?: string;
  // what the student will find inside the frame
  acceso?: string;
  // apa 7 citation shown before anything loads
  apa: string;
  proveedor: string;
  youtube_id?: string;
  url_embed?: string;
  url_abrir: string;
  // frame height in pixels on wide screens
  alto?: number;
}

// external content only loads after a click. YouTube goes through youtube-nocookie.com.
export function EmbedFrame({
  titulo,
  etiqueta,
  descripcion,
  acceso,
  apa,
  proveedor,
  youtube_id,
  url_embed,
  url_abrir,
  alto = 600,
}: Props) {
  const [cargado, set_cargado] = useState(false);
  const [pantalla_completa, set_pantalla_completa] = useState(false);
  const marco = useRef<HTMLDivElement>(null);
  const fuente = youtube_id
    ? `https://www.youtube-nocookie.com/embed/${youtube_id}?rel=0&modestbranding=1`
    : (url_embed ?? '');
  const es_video = Boolean(youtube_id);

  useEffect(() => {
    set_pantalla_completa(typeof document !== 'undefined' && document.fullscreenEnabled === true);
  }, []);

  function ampliar() {
    void marco.current?.requestFullscreen?.();
  }

  return (
    <Superficie
      tipo={es_video ? 'mira' : 'web'}
      titulo={titulo}
      etiqueta={etiqueta ?? 'Recurso de la web'}
    >
      {descripcion && <p className="max-w-reading text-body">{descripcion}</p>}
      {acceso && <p className="mt-2 max-w-reading text-body-sm text-stone-text">{acceso}</p>}
      <p className="mt-3 max-w-reading text-body-sm text-stone-text [overflow-wrap:anywhere]">
        {apa.split('*').map((parte, i) => (i % 2 === 1 ? <em key={i}>{parte}</em> : parte))}
      </p>

      {cargado && fuente ? (
        <div
          ref={marco}
          className={`mt-6 overflow-hidden rounded-soft border-2 border-ink-black bg-ink-black ${es_video ? 'aspect-video' : ''}`}
        >
          <iframe
            src={fuente}
            title={titulo}
            loading="lazy"
            allow="fullscreen; autoplay; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
            className="block h-full w-full border-0 bg-pure-white"
            style={es_video ? undefined : { height: `min(${alto}px, 80svh)`, minHeight: '24rem' }}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!cargado && fuente && (
          <button type="button" className={boton_primario} onClick={() => set_cargado(true)}>
            <Play size={20} weight="fill" aria-hidden="true" />
            Cargar {es_video ? 'el video' : 'el recurso'}
          </button>
        )}
        {cargado && pantalla_completa && !es_video && (
          <button type="button" className={boton} onClick={ampliar}>
            <ArrowsOut size={20} weight="bold" aria-hidden="true" />
            Pantalla completa
          </button>
        )}
        <a href={url_abrir} target="_blank" rel="noopener noreferrer" className={boton}>
          <ArrowSquareOut size={20} weight="bold" aria-hidden="true" />
          Abrir en otra pestaña
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
      {!cargado && fuente && (
        <p className="mt-3 text-micro text-stone-text">
          Al cargarlo, tu navegador se conecta con {proveedor}. Antes de eso no se envía ningún
          dato.
        </p>
      )}
    </Superficie>
  );
}
