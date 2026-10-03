// P1: the closed book opens with the scroll. The cover lifts and swings open on its left edge (the spine)
// while the book slides so the open pages end up centered.
// Wide screens: one movement, the whole spread is visible (pinned 100 % of the screen height).
// Phones: only one page fits, so the camera follows the book: it opens on the left page (institution),
// rests there, and then pans to the right page (title and team) (pinned 150 %).
// Extras on wide screens with a mouse: the closed book leans a little toward the pointer.
// A click on the closed cover, or on "O baja para abrir el libro", scrolls the book open.
import { crear_patron, gsap, limitar, ScrollTrigger } from './base';

const apertura = document.querySelector<HTMLElement>('[data-apertura]');

if (apertura) {
  const libro = apertura.querySelector<HTMLElement>('[data-libro]');
  const cubierta = apertura.querySelector<HTMLElement>('[data-cubierta]');
  const frente = apertura.querySelector<HTMLElement>('[data-frente]');
  const dorso = apertura.querySelector<HTMLElement>('.dorso');
  const cta_frente = apertura.querySelector<HTMLElement>('[data-cta-frente]');
  const abrir = apertura.querySelector<HTMLButtonElement>('[data-abrir]');
  const capas_izq = apertura.querySelector<HTMLElement>('[data-capas-izq]');
  const paginas = Array.from(apertura.querySelectorAll<HTMLElement>('.pagina'));

  if (libro && cubierta && frente && dorso) {
    // the whole spread (two pages) only fits from about 1040px; below that the camera follows the book
    const doble = window.matchMedia('(min-width: 1040px)');
    doble.addEventListener('change', () =>
      document.dispatchEvent(new CustomEvent('ajustes:cambio')),
    );

    crear_patron(() => {
      const cabe_doble = doble.matches;
      apertura.classList.add('apertura-activa');

      // if the text of a page does not fit in the book (very short screens), keep the plain pages
      const desborda = paginas.some((p) => p.scrollHeight > p.clientHeight + 2);
      if (desborda || window.innerHeight < 560) {
        apertura.classList.remove('apertura-activa');
        return;
      }

      // The cover has two faces (front and inside). Each face gets its own perspective and they take turns
      // at 90 degrees, so no 3D rendering context is needed (browsers that measure the first paint
      // in a throttled software renderer do not report it when a preserve-3d context is on screen).
      gsap.set([frente, dorso], { transformPerspective: 2800, transformOrigin: 'left center' });
      const giro = { angulo: 0, z: 0 };
      const aplicar_giro = () => {
        const de_frente = giro.angulo > -90;
        gsap.set(frente, { rotationY: giro.angulo, z: giro.z, autoAlpha: de_frente ? 1 : 0 });
        // same rotation around the spine as the front: the inside face lands on the left half (its content is mirrored in css)
        gsap.set(dorso, { rotationY: giro.angulo, z: giro.z, autoAlpha: de_frente ? 0 : 1 });
      };
      aplicar_giro();
      const ancho = () => cubierta.offsetWidth;
      let progreso = 0;

      const linea = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: apertura,
          start: 'top top',
          end: cabe_doble ? '+=100%' : '+=150%',
          scrub: 1,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progreso = self.progress;
            const cerrado = progreso < 0.04;
            if (abrir) {
              abrir.tabIndex = cerrado ? 0 : -1;
              abrir.setAttribute('aria-hidden', String(!cerrado));
            }
            // the links on the front cover cannot be reached once the cover is turned over
            if (cta_frente) cta_frente.inert = progreso > 0.5;
          },
        },
      });

      // closed: the cover (right half of the book) is centered on the screen
      const cerrado_x = () => -ancho() / 2;
      if (cabe_doble) {
        linea.fromTo(libro, { x: cerrado_x }, { x: 0, duration: 1, ease: 'power2.inOut' }, 0);
        linea.fromTo(
          giro,
          { angulo: 0 },
          { angulo: -180, duration: 1, ease: 'power2.inOut', onUpdate: aplicar_giro },
          0,
        );
        // the cover lifts a little before it swings, and settles when it lands
        linea.to(giro, { z: 40, duration: 0.18, ease: 'power1.out', onUpdate: aplicar_giro }, 0);
        linea.to(giro, { z: 0, duration: 0.3, ease: 'power1.in', onUpdate: aplicar_giro }, 0.7);
      } else {
        // phone: open onto the left page, rest, then pan to the right page
        linea.fromTo(
          libro,
          { x: cerrado_x },
          { x: () => ancho() / 2, duration: 1.2, ease: 'power2.inOut' },
          0,
        );
        linea.fromTo(
          giro,
          { angulo: 0 },
          { angulo: -180, duration: 1.2, ease: 'power2.inOut', onUpdate: aplicar_giro },
          0,
        );
        linea.to(giro, { z: 30, duration: 0.2, ease: 'power1.out', onUpdate: aplicar_giro }, 0);
        linea.to(giro, { z: 0, duration: 0.3, ease: 'power1.in', onUpdate: aplicar_giro }, 0.9);
        linea.to(libro, { x: () => -ancho() / 2, duration: 1, ease: 'power2.inOut' }, 1.6);
        linea.to({}, { duration: 0.4 }, 2.6);
      }
      if (abrir) linea.to(abrir, { opacity: 0, duration: 0.12 }, 0);
      // the left page block appears when the cover lands on the left
      if (capas_izq) {
        linea.fromTo(
          capas_izq,
          { opacity: 0 },
          { opacity: 1, duration: 0.2 },
          cabe_doble ? 0.8 : 0.9,
        );
      }

      const abrir_libro = () => {
        const disparador = linea.scrollTrigger;
        if (disparador) window.scrollTo({ top: disparador.end, behavior: 'smooth' });
      };
      const al_clic_frente = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        if (progreso < 0.04) abrir_libro();
      };
      abrir?.addEventListener('click', abrir_libro);
      frente?.addEventListener('click', al_clic_frente);
      if (frente) frente.style.cursor = 'pointer';

      // the closed book leans toward the pointer (wide screens with a mouse only)
      let quitar_inclinacion: () => void = () => undefined;
      const con_raton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (cabe_doble && con_raton) {
        const inclinar_y = gsap.quickTo(libro, 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const inclinar_x = gsap.quickTo(libro, 'rotationX', { duration: 0.7, ease: 'power3.out' });
        let con_perspectiva = false;
        const al_mover = (e: PointerEvent) => {
          // the container only gets its perspective when the pointer first moves, long after the first paint
          if (!con_perspectiva) {
            gsap.set(libro, { transformPerspective: 2800 });
            con_perspectiva = true;
          }
          // the effect fades out as the book opens
          const factor = 1 - limitar(progreso * 12, 0, 1);
          const nx = (e.clientX / window.innerWidth - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          inclinar_y(nx * 6 * factor);
          inclinar_x(-ny * 3 * factor);
        };
        const al_salir = () => {
          inclinar_y(0);
          inclinar_x(0);
        };
        apertura.addEventListener('pointermove', al_mover);
        apertura.addEventListener('pointerleave', al_salir);
        quitar_inclinacion = () => {
          apertura.removeEventListener('pointermove', al_mover);
          apertura.removeEventListener('pointerleave', al_salir);
        };
      }

      return () => {
        quitar_inclinacion();
        abrir?.removeEventListener('click', abrir_libro);
        frente?.removeEventListener('click', al_clic_frente);
        if (frente) frente.style.cursor = '';
        if (cta_frente) cta_frente.inert = false;
        linea.scrollTrigger?.kill();
        linea.kill();
        gsap.set([libro, cubierta, frente, dorso, abrir, capas_izq].filter(Boolean), {
          clearProps: 'all',
        });
        apertura.classList.remove('apertura-activa');
        ScrollTrigger.refresh();
      };
    });
  }
}
