// camera that walks a strip panel by panel while the student scrolls.
// The scroll is the only source of truth: click, keys and buttons just scroll to the next beat.
import { crear_patron, gsap, limitar, ScrollTrigger } from './base';

const RELLENO = 0.9;
const RITMO_VH = 0.62;

// height of the fixed course bar: the stage sticks right under it
const altura_cabecera = () =>
  document.querySelector<HTMLElement>('[data-cabecera]')?.offsetHeight ?? 0;

function preparar(seccion: HTMLElement) {
  const estatica = seccion.querySelector<HTMLElement>('[data-estatica]');
  const tira_estatica = seccion.querySelector<HTMLElement>('[data-tira-estatica]');
  const escenario = seccion.querySelector<HTMLElement>('[data-escenario]');
  const vista = seccion.querySelector<HTMLElement>('[data-vista]');
  const tira = seccion.querySelector<HTMLElement>('[data-tira]');
  const mascara = seccion.querySelector<HTMLElement>('[data-mascara]');
  const contador = seccion.querySelector<HTMLElement>('[data-contador]');
  const leyenda = seccion.querySelector<HTMLElement>('[data-leyenda]');
  const barra = seccion.querySelector<HTMLElement>('[data-barra]');
  const vivo = seccion.querySelector<HTMLElement>('[data-vivo]');
  const aviso = seccion.querySelector<HTMLElement>('[data-aviso]');
  const anterior = seccion.querySelector<HTMLButtonElement>('[data-anterior]');
  const siguiente = seccion.querySelector<HTMLButtonElement>('[data-siguiente]');
  const focos = Array.from(seccion.querySelectorAll<HTMLElement>('[data-foco]'));
  if (!estatica || !tira_estatica || !escenario || !vista || !tira || !mascara || !focos.length)
    return null;
  return {
    estatica,
    tira_estatica,
    escenario,
    vista,
    tira,
    mascara,
    contador,
    leyenda,
    barra,
    vivo,
    aviso,
    anterior,
    siguiente,
    focos,
  };
}

function iniciar(seccion: HTMLElement) {
  const p = preparar(seccion);
  if (!p) return () => undefined;
  const {
    estatica,
    tira_estatica,
    escenario,
    vista,
    tira,
    mascara,
    contador,
    leyenda,
    barra,
    vivo,
    aviso,
    anterior,
    siguiente,
    focos,
  } = p;
  const total = focos.length;
  const movil = window.innerWidth < 768;
  // proportions are read from the static strip, which already follows its css aspect ratio
  const caja = tira_estatica.getBoundingClientRect();
  const ratio = caja.height > 0 ? caja.width / caja.height : 2;
  const rects = focos.map((f) => {
    const d = f.dataset;
    const usa_movil = movil && d.mx !== undefined;
    return {
      x: Number(usa_movil ? d.mx : d.x),
      y: Number(usa_movil ? d.my : d.y),
      w: Number(usa_movil ? d.mw : d.w),
      h: Number(usa_movil ? d.mh : d.h),
      titulo: d.titulo ?? '',
      texto: d.texto ?? f.textContent ?? '',
    };
  });

  // the strip is cloned so the static version stays complete if the pattern is switched off
  const clon = tira_estatica.cloneNode(true) as HTMLElement;
  clon.removeAttribute('data-tira-estatica');
  clon.setAttribute('aria-hidden', 'true');
  clon.querySelectorAll('[role="img"]').forEach((el) => el.removeAttribute('role'));
  tira.replaceChildren(clon);
  clon.style.width = '100%';
  clon.style.height = '100%';
  // the strip is scaled up several times: ask for the biggest image so the zoom stays sharp
  if (tira_estatica.dataset.nitida !== undefined) {
    clon
      .querySelectorAll<HTMLElement>('source, img')
      .forEach((el) => el.setAttribute('sizes', '2400px'));
  }
  const plegables = Array.from(tira.querySelectorAll<HTMLElement>('[data-plegable]'));

  seccion.classList.add('camara-activa');
  estatica.classList.add('camara-estatica-oculta');
  escenario.hidden = false;

  let vh = window.innerHeight;
  let cabecera = altura_cabecera();
  let alto_escena = vh - cabecera;
  let ancho = seccion.clientWidth;
  let indice = -1;
  let disparador: ScrollTrigger | null = null;

  const dimensionar = () => {
    vh = window.innerHeight;
    cabecera = altura_cabecera();
    alto_escena = vh - cabecera;
    // the stage fills the width of its column (the page of the book), not the whole window
    ancho = escenario.parentElement?.clientWidth ?? seccion.clientWidth;
    seccion.style.height = `${alto_escena + (total - 1) * vh * RITMO_VH}px`;
    escenario.style.height = `${alto_escena}px`;
    escenario.style.top = `${cabecera}px`;
    const ancho_base = Math.min(ancho * 0.98, alto_escena * 0.98 * ratio);
    tira.style.width = `${ancho_base}px`;
    tira.style.height = `${ancho_base / ratio}px`;
  };

  const camara = (i: number, inmediato: boolean) => {
    const r = rects[i];
    const escenario_w = vista.clientWidth;
    const escenario_h = vista.clientHeight;
    const base_w = tira.offsetWidth;
    const base_h = tira.offsetHeight;
    const rw = (base_w * r.w) / 100;
    const rh = (base_h * r.h) / 100;
    const escala = Math.max(1, RELLENO * Math.min(escenario_w / rw, escenario_h / rh));
    const cx = (r.x + r.w / 2) / 100;
    const cy = (r.y + r.h / 2) / 100;
    const duracion = inmediato ? 0 : 0.9;
    gsap.to(tira, {
      x: (0.5 - cx) * base_w * escala,
      y: (0.5 - cy) * base_h * escala,
      scale: escala,
      transformOrigin: '50% 50%',
      duration: duracion,
      ease: 'power3.out',
      overwrite: true,
    });
    gsap.to(mascara, {
      width: rw * escala * 1.02,
      height: rh * escala * 1.02,
      duration: duracion,
      ease: 'power3.out',
      overwrite: true,
    });
  };

  const desplegar = (i: number, inmediato: boolean) => {
    plegables.forEach((el) => {
      const desde = Number(el.dataset.desde ?? 0);
      gsap.to(el, {
        rotateX: i >= desde ? 0 : -82,
        opacity: i >= desde ? 1 : 0,
        duration: inmediato ? 0 : 0.7,
        ease: 'power2.out',
        overwrite: true,
      });
    });
  };

  const ir_a_indice = (i: number, inmediato = false) => {
    const nuevo = limitar(i, 0, total - 1);
    if (nuevo === indice && !inmediato) return;
    indice = nuevo;
    camara(nuevo, inmediato);
    desplegar(nuevo, inmediato);
    if (contador) contador.textContent = `${nuevo + 1} de ${total}`;
    if (leyenda) leyenda.textContent = rects[nuevo].titulo;
    if (vivo) vivo.textContent = rects[nuevo].texto;
    if (barra) barra.style.width = `${((nuevo + 1) / total) * 100}%`;
    if (anterior) anterior.disabled = nuevo === 0;
    // the hint is only useful until the student moves once
    if (aviso && nuevo > 0) aviso.hidden = true;
  };

  // scroll position at which the stage gets stuck under the bar
  const posicion_inicio = () => seccion.getBoundingClientRect().top + window.scrollY - cabecera;
  const tramo = () => Math.max(1, seccion.offsetHeight - alto_escena);

  const desplazar_a = (i: number) => {
    const destino = posicion_inicio() + ((limitar(i, 0, total - 1) + 0.5) / total) * tramo();
    const reducido = document.documentElement.getAttribute('data-movimiento') === 'no';
    window.scrollTo({ top: destino, behavior: reducido ? 'auto' : 'smooth' });
  };

  const avanzar = () => {
    if (indice < total - 1) desplazar_a(indice + 1);
    else window.scrollTo({ top: posicion_inicio() + seccion.offsetHeight, behavior: 'smooth' });
  };

  dimensionar();
  ir_a_indice(0, true);
  desplegar(0, true);

  disparador = ScrollTrigger.create({
    trigger: seccion,
    start: () => `top top+=${cabecera}`,
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => ir_a_indice(Math.floor(self.progress * total)),
    onRefresh: (self) => ir_a_indice(Math.floor(self.progress * total), true),
  });

  const al_teclear = (e: KeyboardEvent) => {
    const r = seccion.getBoundingClientRect();
    const en_escena = r.top <= cabecera + 1 && r.bottom > vh;
    if (!en_escena) return;
    const objetivo = e.target as HTMLElement | null;
    if (objetivo && /^(INPUT|TEXTAREA|SELECT)$/.test(objetivo.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      avanzar();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      desplazar_a(indice - 1);
    }
  };
  const al_clic = () => avanzar();
  const al_anterior = (e: Event) => {
    e.stopPropagation();
    desplazar_a(indice - 1);
  };
  const al_siguiente = (e: Event) => {
    e.stopPropagation();
    avanzar();
  };
  const al_redimensionar = () => {
    dimensionar();
    ScrollTrigger.refresh();
  };

  window.addEventListener('keydown', al_teclear);
  window.addEventListener('resize', al_redimensionar);
  vista.addEventListener('click', al_clic);
  anterior?.addEventListener('click', al_anterior);
  siguiente?.addEventListener('click', al_siguiente);

  return () => {
    disparador?.kill();
    window.removeEventListener('keydown', al_teclear);
    window.removeEventListener('resize', al_redimensionar);
    vista.removeEventListener('click', al_clic);
    anterior?.removeEventListener('click', al_anterior);
    siguiente?.removeEventListener('click', al_siguiente);
    gsap.killTweensOf([tira, mascara, ...plegables]);
    tira.replaceChildren();
    tira.removeAttribute('style');
    seccion.style.height = '';
    escenario.style.height = '';
    escenario.style.top = '';
    seccion.classList.remove('camara-activa');
    estatica.classList.remove('camara-estatica-oculta');
    escenario.hidden = true;
  };
}

const secciones = Array.from(document.querySelectorAll<HTMLElement>('[data-camara]'));
if (secciones.length) {
  crear_patron(() => {
    const limpiezas = secciones.map((s) => iniciar(s));
    return () => limpiezas.forEach((l) => l());
  });
}
