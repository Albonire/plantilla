import { useState } from 'react';
import { FilePdf } from '@phosphor-icons/react';
import { sitio } from '../../config/sitio';
import { usar_movimiento, usar_nombre, usar_progreso } from './hooks';
import { Insignia } from './insignia';
import { Superficie, boton_primario, campo_texto } from './ui';

export function Certificate() {
  const [nombre, set_nombre] = usar_nombre();
  const progreso = usar_progreso();
  const movimiento = usar_movimiento();
  const [sello, set_sello] = useState(0);
  const [generando, set_generando] = useState(false);
  const [mensaje, set_mensaje] = useState('');
  const resueltos = progreso.resueltos.length;

  async function generar() {
    set_generando(true);
    set_mensaje('');
    set_sello((n) => n + 1);
    try {
      const { descargar_certificado } = await import('../../lib/pdf');
      await descargar_certificado(nombre);
      set_mensaje('Tu certificado se descargó como PDF.');
    } catch {
      set_mensaje('No se pudo crear el certificado. Vuelve a intentarlo.');
    } finally {
      set_generando(false);
    }
  }

  return (
    <Superficie titulo="Tu certificado" etiqueta="Detective de la lectura">
      <p className="max-w-reading text-body">
        Escribe tu nombre y descarga tu certificado en PDF. Tu nombre solo se guarda en este
        navegador.
        {resueltos < 5 &&
          ` Resolviste ${resueltos} de 5 casos: genera tu certificado cuando termines los cinco.`}
      </p>
      <label htmlFor="cert-nombre" className="mt-6 block text-body font-medium">
        Tu nombre
      </label>
      <input
        id="cert-nombre"
        type="text"
        autoComplete="off"
        maxLength={80}
        value={nombre}
        onChange={(e) => set_nombre(e.target.value)}
        className={`${campo_texto} mt-2 max-w-md`}
      />

      <div className="relative mt-8 overflow-hidden rounded-card border-2 border-ink-black bg-cream-paper p-8 text-center md:p-12">
        <p className="rounded-pill bg-sunshine-pop px-4 py-1 text-body-sm font-medium">
          {sitio.nombre_curso}
        </p>
        <p className="mt-6 text-heading font-medium tracking-tight">Certificado</p>
        <p className="mt-4 text-body">Certifico que</p>
        <p className="mt-2 min-h-12 break-words text-heading-sm font-medium tracking-tight underline decoration-2 underline-offset-8">
          {nombre.trim() || 'tu nombre'}
        </p>
        <p className="mx-auto mt-6 max-w-md text-body">
          resolvió los cinco casos de la Aventura lectora y ahora es Detective de la Lectura.
        </p>
        <p className="mt-6 text-body-sm text-stone-text">El equipo de Aventura lectora</p>
        <div
          key={sello}
          className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 ${sello > 0 && movimiento ? 'sello-estampa' : ''}`}
        >
          <Insignia caso={5} size={84} ganada={sello > 0 || resueltos === 5} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={boton_primario}
          onClick={generar}
          disabled={generando || !nombre.trim()}
        >
          <FilePdf size={20} weight="bold" aria-hidden="true" />
          {generando ? 'Preparando...' : 'Descargar certificado'}
        </button>
        {!nombre.trim() && (
          <p className="text-body-sm text-stone-text">Escribe tu nombre para descargarlo.</p>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-7 text-body">
        {mensaje}
      </p>
    </Superficie>
  );
}
