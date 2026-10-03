// global behavior shared by every page: settings switches, menu, case and page states, reading progress bar, resume link
import { leer, guardar } from './almacen';
import {
  leer_progreso,
  estado_de,
  guardar_lugar,
  marcar_pagina_leida,
  marcar_visitado,
} from './progreso';

export interface Ajustes {
  movimiento: boolean;
  letra_grande: boolean;
  voz: boolean;
}

const html = document.documentElement;

function ajustes_iniciales(): Ajustes {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const guardados = leer<Partial<Ajustes>>('ajustes', {});
  return {
    movimiento: typeof guardados.movimiento === 'boolean' ? guardados.movimiento : !reduce,
    letra_grande: guardados.letra_grande === true,
    voz: guardados.voz === true,
  };
}

let ajustes = ajustes_iniciales();

function aplicar(a: Ajustes) {
  if (a.movimiento) html.removeAttribute('data-movimiento');
  else html.setAttribute('data-movimiento', 'no');
  if (a.letra_grande) html.setAttribute('data-letra', 'grande');
  else html.removeAttribute('data-letra');
  if (a.voz) html.setAttribute('data-voz', 'si');
  else html.removeAttribute('data-voz');
  document.querySelectorAll<HTMLElement>('[data-ajuste]').forEach((boton) => {
    const clave = boton.dataset.ajuste as keyof Ajustes;
    boton.setAttribute('aria-checked', String(a[clave]));
  });
}

function iniciar_interruptores() {
  aplicar(ajustes);
  document.querySelectorAll<HTMLElement>('[data-ajuste]').forEach((boton) => {
    boton.addEventListener('click', () => {
      const clave = boton.dataset.ajuste as keyof Ajustes;
      ajustes = { ...ajustes, [clave]: !ajustes[clave] };
      guardar('ajustes', ajustes);
      aplicar(ajustes);
      document.dispatchEvent(new CustomEvent('ajustes:cambio', { detail: ajustes }));
    });
  });
}

function iniciar_menu() {
  const menu = document.querySelector<HTMLDetailsElement>('[data-menu]');
  if (!menu) return;
  const resumen = menu.querySelector('summary');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      resumen?.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (menu.open && e.target instanceof Node && !menu.contains(e.target)) menu.open = false;
  });
  menu.addEventListener('focusout', (e) => {
    const destino = e.relatedTarget;
    if (menu.open && destino instanceof Node && !menu.contains(destino)) menu.open = false;
  });
}

const TEXTO_ESTADO = { sin_empezar: '', en_curso: 'En curso', resuelto: 'Resuelto' } as const;

function pintar_estados() {
  const progreso = leer_progreso();
  document.querySelectorAll<HTMLElement>('[data-caso]').forEach((elemento) => {
    const caso = Number(elemento.dataset.caso);
    const estado = estado_de(caso, progreso);
    elemento.dataset.estado = estado;
    const etiqueta = elemento.querySelector<HTMLElement>('.estado-etiqueta');
    if (etiqueta) etiqueta.textContent = TEXTO_ESTADO[estado];
    const lector = elemento.querySelector<HTMLElement>('.estado-texto');
    if (lector)
      lector.textContent = TEXTO_ESTADO[estado] ? `, ${TEXTO_ESTADO[estado].toLowerCase()}` : '';
  });
  document.querySelectorAll<HTMLElement>('a[data-pagina]').forEach((enlace) => {
    const leida = progreso.paginas_leidas.includes(enlace.dataset.pagina ?? '');
    enlace.dataset.leida = String(leida);
    const marca = enlace.querySelector<HTMLElement>('.estado-pagina');
    if (marca) marca.textContent = leida ? 'Leída' : '';
  });
  const seguir = document.querySelector<HTMLAnchorElement>('[data-seguir]');
  if (seguir && progreso.ultimo) {
    seguir.href = `${progreso.ultimo.ruta}#${progreso.ultimo.seccion}`;
    seguir.hidden = false;
  }
  // "sigues en el caso N" cards (cover and index of the home): text built from the index that is on the page
  if (progreso.ultimo) {
    const m = progreso.ultimo.ruta.match(/^\/unidad\/(\d)(?:\/([a-z]+))?\/?$/);
    const clave = m ? `${m[1]}/${m[2] ?? 'abrir'}` : '';
    const enlace_pagina = clave
      ? document.querySelector<HTMLAnchorElement>(`[data-indice-libro] a[data-pagina="${clave}"]`)
      : null;
    const titulo_caso = enlace_pagina
      ?.closest<HTMLElement>('[data-caso]')
      ?.querySelector('h3')?.textContent;
    if (enlace_pagina && titulo_caso) {
      const texto = `Caso ${m?.[1]}: ${titulo_caso.trim()}, ${enlace_pagina.dataset.titulo ?? ''}`;
      document.querySelectorAll<HTMLElement>('[data-seguir-caja]').forEach((caja) => {
        const t = caja.querySelector<HTMLElement>('[data-seguir-texto]');
        const a = caja.querySelector<HTMLAnchorElement>('[data-seguir-enlace]');
        if (t) t.textContent = texto;
        if (a) a.href = `${progreso.ultimo?.ruta}#${progreso.ultimo?.seccion}`;
        caja.hidden = false;
      });
    }
  }
}

// small confirmation at the bottom of the screen (role status), gone after a few seconds
function avisar(texto: string) {
  const previo = document.querySelector('[data-aviso-pagina]');
  previo?.remove();
  const aviso = document.createElement('div');
  aviso.setAttribute('data-aviso-pagina', '');
  aviso.setAttribute('role', 'status');
  aviso.className = 'aviso-pagina interfaz';
  const marca = document.createElement('span');
  marca.className = 'aviso-pagina-marca';
  marca.setAttribute('aria-hidden', 'true');
  const mensaje = document.createElement('span');
  mensaje.textContent = texto;
  aviso.append(marca, mensaje);
  document.body.append(aviso);
  window.setTimeout(() => aviso.remove(), 3500);
}

// thin bar in the header that fills as the page is read
function iniciar_avance() {
  const barra = document.querySelector<HTMLElement>('[data-avance]');
  if (!barra) return;
  let cuadro = 0;
  const actualizar = () => {
    cuadro = 0;
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    const p = maximo > 0 ? Math.min(1, Math.max(0, window.scrollY / maximo)) : 0;
    barra.style.setProperty('--p', p.toFixed(4));
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!cuadro) cuadro = requestAnimationFrame(actualizar);
    },
    { passive: true },
  );
  window.addEventListener('resize', actualizar, { passive: true });
  actualizar();
}

// highlights, in the index beside the page, the part of the page that is being read
function iniciar_subindice() {
  const enlaces = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-sub]'));
  if (!enlaces.length || !('IntersectionObserver' in window)) return;
  const destinos = new Map<Element, HTMLAnchorElement>();
  enlaces.forEach((enlace) => {
    const destino = document.getElementById(enlace.dataset.sub ?? '');
    if (destino) destinos.set(destino, enlace);
  });
  const visibles = new Set<Element>();
  const marcar = () => {
    const primero = Array.from(destinos.keys())
      .filter((el) => visibles.has(el))
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    enlaces.forEach((enlace) => enlace.removeAttribute('aria-current'));
    if (primero) destinos.get(primero)?.setAttribute('aria-current', 'location');
  };
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) =>
        e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target),
      );
      marcar();
    },
    { rootMargin: '-15% 0px -55% 0px' },
  );
  destinos.forEach((_enlace, el) => observador.observe(el));
}

// remembers the case, the page and the section, and marks a page as read when its end is reached
function recordar_lugar() {
  const match = location.pathname.match(/^\/unidad\/(\d)(?:\/([a-z]+))?\/?$/);
  if (!match) return;
  const caso = Number(match[1]);
  marcar_visitado(caso);
  pintar_estados();

  const fin = document.querySelector<HTMLElement>('[data-fin-pagina]');
  if (fin?.dataset.finPagina && 'IntersectionObserver' in window) {
    const id = fin.dataset.finPagina;
    const vigia = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      const era_nueva = !leer_progreso().paginas_leidas.includes(id);
      marcar_pagina_leida(id);
      pintar_estados();
      if (era_nueva) avisar(`Página leída: ${fin.dataset.tituloPagina ?? ''}`.trim());
      vigia.disconnect();
    });
    vigia.observe(fin);
  }

  const secciones = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
  if (!secciones.length || !('IntersectionObserver' in window)) return;
  let pendiente = 0;
  const observador = new IntersectionObserver(
    (entradas) => {
      const visible = entradas
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      window.clearTimeout(pendiente);
      pendiente = window.setTimeout(() => {
        guardar_lugar(location.pathname, (visible.target as HTMLElement).id);
      }, 1200);
    },
    { threshold: [0.35, 0.6] },
  );
  secciones.forEach((seccion) => observador.observe(seccion));
}

document.addEventListener('progreso:cambio', pintar_estados);
iniciar_interruptores();
iniciar_menu();
pintar_estados();
iniciar_avance();
iniciar_subindice();
recordar_lugar();
