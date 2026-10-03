import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Stop, SpeakerHigh } from '@phosphor-icons/react';
import { boton } from './ui';

interface Props {
  texto: string;
  etiqueta?: string;
}

function elegir_voz(voces: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const orden = ['es-CO', 'es-419', 'es-MX', 'es-US'];
  for (const codigo of orden) {
    const v = voces.find((x) => x.lang.replace('_', '-').toLowerCase() === codigo.toLowerCase());
    if (v) return v;
  }
  return voces.find((x) => x.lang.toLowerCase().startsWith('es')) ?? null;
}

// hidden when the browser has no speechSynthesis
export function ReadAloud({ texto, etiqueta = 'Escuchar' }: Props) {
  const [disponible, set_disponible] = useState(false);
  const [estado, set_estado] = useState<'quieto' | 'leyendo' | 'pausado'>('quieto');
  const voz = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    set_disponible(true);
    const cargar = () => {
      voz.current = elegir_voz(window.speechSynthesis.getVoices());
    };
    cargar();
    window.speechSynthesis.addEventListener?.('voiceschanged', cargar);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', cargar);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!disponible) return null;

  function leer() {
    window.speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = voz.current?.lang ?? 'es-CO';
    if (voz.current) frase.voice = voz.current;
    frase.rate = 0.92;
    frase.onend = () => set_estado('quieto');
    frase.onerror = () => set_estado('quieto');
    window.speechSynthesis.speak(frase);
    set_estado('leyendo');
  }

  function pausar_o_seguir() {
    if (estado === 'leyendo') {
      window.speechSynthesis.pause();
      set_estado('pausado');
    } else if (estado === 'pausado') {
      window.speechSynthesis.resume();
      set_estado('leyendo');
    }
  }

  function detener() {
    window.speechSynthesis.cancel();
    set_estado('quieto');
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Lectura en voz alta"
    >
      {estado === 'quieto' ? (
        <button type="button" className={boton} onClick={leer}>
          <SpeakerHigh size={20} weight="bold" aria-hidden="true" />
          {etiqueta}
        </button>
      ) : (
        <>
          <button type="button" className={boton} onClick={pausar_o_seguir}>
            {estado === 'leyendo' ? (
              <Pause size={20} weight="bold" aria-hidden="true" />
            ) : (
              <Play size={20} weight="bold" aria-hidden="true" />
            )}
            {estado === 'leyendo' ? 'Pausar' : 'Seguir'}
          </button>
          <button type="button" className={boton} onClick={detener}>
            <Stop size={20} weight="bold" aria-hidden="true" />
            Detener
          </button>
        </>
      )}
    </div>
  );
}
