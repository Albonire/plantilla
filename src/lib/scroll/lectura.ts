// reading with pauses: saves the answers to the pause questions, moves the race (P4)
// and switches the side scenes (P3) as the student reads.
import { guardar, leer } from '../almacen';
import { crear_patron, gsap, ScrollTrigger, limitar } from './base';

// ---- pause answers: always on, no motion involved
document.querySelectorAll<HTMLTextAreaElement>('textarea[data-almacen]').forEach((campo) => {
  const clave = campo.dataset.almacen ?? '';
  const previo = leer<string>(clave, '');
  if (previo) campo.value = previo;
  campo.addEventListener('input', () => guardar(clave, campo.value));
});

// ---- P3: side scenes follow the paragraph that is being read
document.querySelectorAll<HTMLElement>('[data-lectura][data-modo="panel"]').forEach((lectura) => {
  const escenas = Array.from(lectura.querySelectorAll<SVGElement>('[data-escena]'));
  const pasos = Array.from(lectura.querySelectorAll<HTMLElement>('li[data-paso]'));
  if (!escenas.length || !('IntersectionObserver' in window)) return;
  const mostrar = (n: number) => {
    escenas.forEach((e) => {
      const activa = Number(e.dataset.escena) === n;
      e.style.opacity = activa ? '1' : '0';
      e.style.transition = 'opacity 400ms ease-out';
    });
  };
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) mostrar(Number((e.target as HTMLElement).dataset.paso));
      });
    },
    { rootMargin: '-40% 0px -50% 0px' },
  );
  pasos.forEach((p) => observador.observe(p));
});

// ---- P4: the race is driven by the reading position
const carrera = document.querySelector<HTMLElement>('[data-lectura][data-modo="carrera"]');

if (carrera) {
  const lista = carrera.querySelector<HTMLElement>('ol');
  const pasos = Array.from(carrera.querySelectorAll<HTMLElement>('li[data-paso]'));
  const liebre = carrera.querySelector<SVGGElement>('[data-corredor="liebre"]');
  const tortuga = carrera.querySelector<SVGGElement>('[data-corredor="tortuga"]');
  const pose_corre = carrera.querySelector<SVGGElement>('[data-pose="corre"]');
  const pose_duerme = carrera.querySelector<SVGGElement>('[data-pose="duerme"]');

  if (lista && liebre && tortuga && pose_corre && pose_duerme && pasos.length) {
    const total = pasos.length;
    // hare position after each paragraph: quick start, nap in 6 and 7, late sprint in 8
    const LIEBRE = [0, 0, 0, 0, 0, 480, 480, 480, 610, 610];
    const TORTUGA_FINAL = 700;

    crear_patron(() => {
      const original_liebre = liebre.getAttribute('transform');
      const original_tortuga = tortuga.getAttribute('transform');

      const actualizar = () => {
        const linea_lectura = window.innerHeight * 0.55;
        let avance = 0;
        for (let i = 0; i < total; i++) {
          const r = pasos[i].getBoundingClientRect();
          if (r.top <= linea_lectura) {
            avance = i + limitar((linea_lectura - r.top) / Math.max(1, r.height), 0, 1);
          }
        }
        const t = avance / total;
        gsap.set(tortuga, { x: TORTUGA_FINAL * t });
        const base = Math.floor(avance);
        const fraccion = avance - base;
        const a = LIEBRE[Math.min(base, LIEBRE.length - 1)];
        const b = LIEBRE[Math.min(base + 1, LIEBRE.length - 1)];
        gsap.set(liebre, { x: a + (b - a) * fraccion });
        const durmiendo = avance > 5.5 && avance < 7.5;
        gsap.set(pose_corre, { opacity: durmiendo ? 0 : 1 });
        gsap.set(pose_duerme, { opacity: durmiendo ? 1 : 0 });
      };

      const disparador = ScrollTrigger.create({
        trigger: lista,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: actualizar,
        onRefresh: actualizar,
      });
      actualizar();

      return () => {
        disparador.kill();
        gsap.set([liebre, tortuga, pose_corre, pose_duerme], { clearProps: 'all' });
        if (original_liebre) liebre.setAttribute('transform', original_liebre);
        if (original_tortuga) tortuga.setAttribute('transform', original_tortuga);
        pose_duerme.style.opacity = '0';
      };
    });
  }
}
