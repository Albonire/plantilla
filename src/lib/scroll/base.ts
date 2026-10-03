import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function movimiento_activo(): boolean {
  return document.documentElement.getAttribute('data-movimiento') !== 'no';
}

export interface Contexto {
  escritorio: boolean;
}

// runs a scroll pattern inside gsap.matchMedia(). It only starts when the system does not ask for
// reduced motion and the "Movimiento" switch is on, and it restarts when the switch changes.
export function crear_patron(activar: (ctx: Contexto) => (() => void) | void) {
  let mm: gsap.MatchMedia | null = null;

  const encender = () => {
    mm?.kill();
    mm = gsap.matchMedia();
    mm.add(
      {
        escritorio: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        movil: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
      },
      (contexto) => {
        if (!movimiento_activo()) return;
        const condiciones = contexto.conditions as { escritorio?: boolean } | undefined;
        return activar({ escritorio: Boolean(condiciones?.escritorio) });
      },
    );
  };

  encender();
  document.addEventListener('ajustes:cambio', encender);

  // fonts and images change the layout, so trigger positions are recalculated once they load
  const refrescar = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) void document.fonts.ready.then(refrescar);
  window.addEventListener('load', refrescar, { once: true });
}

export function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

// jump to an element that lives inside a pinned, horizontally moved or scaled stage:
// scrolls the page to the point of the pin where that element is shown
export function saltar_a_ancla(
  disparador: ScrollTrigger,
  indice: number,
  total: number,
  suave = true,
) {
  const p = total > 1 ? indice / (total - 1) : 0;
  const destino = disparador.start + p * (disparador.end - disparador.start);
  const reducido = !movimiento_activo();
  window.scrollTo({ top: destino, behavior: reducido || !suave ? 'auto' : 'smooth' });
}
