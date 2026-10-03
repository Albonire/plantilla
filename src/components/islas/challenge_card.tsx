import { useState } from 'react';
import { CheckCircle, Clock, FilePdf } from '@phosphor-icons/react';
import type { CampoReto, Reto, RetoGuardado } from '../../lib/tipos';
import { armar_texto } from '../../lib/opinion';
import { usar_almacen, usar_nombre } from './hooks';
import { Chip, Pastilla, area_texto, boton_reto, campo_texto } from './ui';

interface Props {
  reto: Reto;
  unidad: number;
  titulo_caso: string;
  // when the student writes in another tool of the page (argument builder), the card only shows a summary
  campos_en?: 'aqui' | 'constructor';
  ancla_constructor?: string;
}

const NIVELES: { id: 'superior' | 'alto' | 'basico' | 'bajo'; texto: string }[] = [
  { id: 'superior', texto: 'Superior' },
  { id: 'alto', texto: 'Alto' },
  { id: 'basico', texto: 'Básico' },
  { id: 'bajo', texto: 'Bajo' },
];

const VACIO: RetoGuardado = { valores: {} };

export function ChallengeCard({
  reto,
  unidad,
  titulo_caso,
  campos_en = 'aqui',
  ancla_constructor,
}: Props) {
  const [guardado, set_guardado] = usar_almacen<RetoGuardado>(`reto:${unidad}`, VACIO);
  const [nombre, set_nombre] = usar_nombre();
  const [estado, set_estado] = useState<'reposo' | 'generando' | 'listo' | 'error'>('reposo');

  const campo_clasificacion = reto.campos.find((c) => c.tipo === 'clasificacion');
  const [resumen_clasificacion] = usar_almacen<string>(
    campo_clasificacion?.origen ? `${campo_clasificacion.origen}:resumen` : 'sin_origen',
    '',
  );
  const valores = guardado.valores ?? {};
  const valor_de = (c: CampoReto) =>
    c.tipo === 'clasificacion' ? resumen_clasificacion : (valores[c.id] ?? '');
  const grupos = agrupar(reto.campos);
  const completos = reto.campos.filter((c) => valor_de(c).trim().length > 0).length;

  function cambiar(id: string, valor: string) {
    set_estado('reposo');
    set_guardado((g) => ({ ...g, valores: { ...g.valores, [id]: valor } }));
  }

  async function descargar() {
    set_estado('generando');
    try {
      const { descargar_reto } = await import('../../lib/pdf');
      await descargar_reto({
        nombre,
        caso: unidad,
        titulo_caso,
        titulo_reto: reto.titulo,
        campos:
          campos_en === 'constructor'
            ? [
                { etiqueta: 'Pregunta que elegí', valor: valores.pregunta ?? '' },
                { etiqueta: 'Mi texto de opinión', valor: armar_texto(valores) },
              ]
            : reto.campos.map((c) => ({
                etiqueta: c.etiqueta,
                valor: valor_de(c),
                grupo: c.grupo,
              })),
        imagen: guardado.imagen,
      });
      set_estado('listo');
    } catch {
      set_estado('error');
    }
  }

  return (
    <article
      aria-labelledby={`reto-${unidad}-titulo`}
      className="rounded-card border-2 border-ink-black bg-pure-white p-5 text-ink-black md:p-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Pastilla tipo="reto" />
        <Chip>
          <Clock size={14} weight="bold" className="mr-1.5" aria-hidden="true" />
          {reto.duracion}
        </Chip>
      </div>
      <h3
        id={`reto-${unidad}-titulo`}
        className="mt-4 text-[1.75rem] leading-tight md:text-[2.25rem]"
      >
        {reto.titulo}
      </h3>

      {reto.pendientes?.map((p) => (
        <p
          key={p}
          className="mt-5 inline-block rounded-chip border-2 border-dashed border-ink-black bg-sunshine-pop px-2 py-0.5 text-body-sm font-medium"
        >
          [PENDIENTE: {p}]
        </p>
      ))}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="text-subheading font-medium">Qué vas a hacer</h4>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-body marker:font-medium">
            {reto.pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="text-subheading font-medium">Qué vas a entregar</h4>
          <p className="mt-3 text-body">{reto.producto}</p>
        </div>
      </div>

      <div className="mt-10 rounded-soft bg-cream-paper p-5 md:p-8">
        <label htmlFor={`reto-${unidad}-nombre`} className="text-body font-medium">
          Tu nombre
        </label>
        <p className="text-body-sm text-stone-text">
          Solo se guarda en este navegador y sale en tu PDF.
        </p>
        <input
          id={`reto-${unidad}-nombre`}
          type="text"
          autoComplete="off"
          maxLength={80}
          value={nombre}
          onChange={(e) => set_nombre(e.target.value)}
          className={`${campo_texto} mt-2 bg-pure-white`}
        />

        {campos_en === 'aqui' ? (
          <div className="mt-8 flex flex-col gap-8">
            {grupos.map(([grupo, campos]) => (
              <fieldset key={grupo || 'unico'} className="flex flex-col gap-5">
                {grupo && (
                  <legend className="mb-1 text-heading-sm font-medium tracking-tight">
                    {grupo}
                  </legend>
                )}
                {campos.map((c) =>
                  c.tipo === 'clasificacion' ? (
                    <div key={c.id}>
                      <p className="text-body font-medium">{c.etiqueta}</p>
                      <p className="text-body-sm text-stone-text">
                        Se llena sola con el clasificador de la sección de práctica.
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap rounded-soft bg-pure-white p-4 font-sans text-body-sm">
                        {resumen_clasificacion || 'Todavía no clasificaste los fragmentos.'}
                      </pre>
                    </div>
                  ) : (
                    <Campo
                      key={c.id}
                      campo={c}
                      unidad={unidad}
                      valor={valores[c.id] ?? ''}
                      al_cambiar={cambiar}
                    />
                  ),
                )}
              </fieldset>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-body">
              Este reto se escribe en el constructor de argumentos.{' '}
              {ancla_constructor && (
                <a
                  href={ancla_constructor}
                  className="font-medium underline decoration-2 underline-offset-4"
                >
                  Ir al constructor
                </a>
              )}
            </p>
            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="text-body-sm font-medium text-stone-text">Pregunta que elegí</dt>
                <dd className="text-body">
                  {valores.pregunta?.trim() ? valores.pregunta : 'Todavía sin elegir.'}
                </dd>
              </div>
              <div>
                <dt className="text-body-sm font-medium text-stone-text">Mi texto de opinión</dt>
                <dd className="text-body">{armar_texto(valores) || 'Todavía sin escribir.'}</dd>
              </div>
            </dl>
          </div>
        )}

        {guardado.imagen && (
          <figure className="mt-8">
            <img
              src={guardado.imagen}
              alt="Imagen que preparaste para tu reto"
              className="max-h-64 rounded-soft"
            />
            <figcaption className="mt-2 text-body-sm text-stone-text">
              Tu imagen se incluirá en el PDF.
            </figcaption>
          </figure>
        )}
      </div>

      <details className="group mt-8 rounded-soft bg-cream-paper">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 text-body font-medium [&::-webkit-details-marker]:hidden">
          Cómo se evalúa este reto
          <span className="text-body-sm text-stone-text group-open:hidden" aria-hidden="true">
            Abrir
          </span>
          <span
            className="hidden text-body-sm text-stone-text group-open:inline"
            aria-hidden="true"
          >
            Cerrar
          </span>
        </summary>
        <div className="grid gap-4 px-5 pb-6 md:grid-cols-2">
          {reto.rubrica.map((c) => (
            <section key={c.criterio} className="rounded-soft bg-pure-white p-4">
              <h5 className="text-body font-medium">{c.criterio}</h5>
              <dl className="mt-3 space-y-2 text-body-sm">
                {NIVELES.map((n) => (
                  <div key={n.id}>
                    <dt className="font-medium">{n.texto}</dt>
                    <dd className="text-stone-text">{c[n.id]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </details>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className={boton_reto}
          onClick={descargar}
          disabled={estado === 'generando'}
        >
          <FilePdf size={22} weight="bold" aria-hidden="true" />
          {estado === 'generando' ? 'Preparando el PDF...' : 'Descargar PDF'}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-4 flex min-h-7 items-center gap-2 text-body"
      >
        {estado === 'listo' && (
          <>
            <CheckCircle size={22} weight="fill" aria-hidden="true" />
            Tu PDF se descargó. Súbelo en la plataforma del curso.
          </>
        )}
        {estado === 'error' && 'No se pudo crear el PDF. Vuelve a intentarlo.'}
        {estado === 'reposo' &&
          campos_en === 'aqui' &&
          completos > 0 &&
          `Llevas ${completos} de ${reto.campos.length} campos.`}
      </p>
    </article>
  );
}

function agrupar(campos: CampoReto[]): [string, CampoReto[]][] {
  const orden: string[] = [];
  const mapa = new Map<string, CampoReto[]>();
  for (const c of campos) {
    const g = c.grupo ?? '';
    if (!mapa.has(g)) {
      mapa.set(g, []);
      orden.push(g);
    }
    mapa.get(g)?.push(c);
  }
  return orden.map((g) => [g, mapa.get(g) ?? []]);
}

function Campo({
  campo,
  unidad,
  valor,
  al_cambiar,
}: {
  campo: CampoReto;
  unidad: number;
  valor: string;
  al_cambiar: (id: string, valor: string) => void;
}) {
  const id = `reto-${unidad}-${campo.id}`;
  return (
    <div>
      <label htmlFor={id} className="text-body font-medium">
        {campo.etiqueta}
      </label>
      {campo.ayuda && (
        <p id={`${id}-ayuda`} className="text-body-sm text-stone-text">
          {campo.ayuda}
        </p>
      )}
      {campo.tipo === 'texto_largo' ? (
        <textarea
          id={id}
          rows={4}
          maxLength={1200}
          aria-describedby={campo.ayuda ? `${id}-ayuda` : undefined}
          value={valor}
          onChange={(e) => al_cambiar(campo.id, e.target.value)}
          className={`${area_texto} mt-2 bg-pure-white`}
        />
      ) : (
        <input
          id={id}
          type="text"
          maxLength={300}
          aria-describedby={campo.ayuda ? `${id}-ayuda` : undefined}
          value={valor}
          onChange={(e) => al_cambiar(campo.id, e.target.value)}
          className={`${campo_texto} mt-2 bg-pure-white`}
        />
      )}
    </div>
  );
}
