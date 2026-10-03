import { Autoevaluacion } from './autoevaluacion';
import { usar_almacen } from './hooks';
import { Superficie, area_texto } from './ui';

interface Props {
  casos: { numero: number; titulo: string }[];
}

export function AutoevaluacionFinal({ casos }: Props) {
  const [gusto, set_gusto] = usar_almacen<string>('cierre:gusto', '');
  const [estrategia, set_estrategia] = usar_almacen<string>('cierre:estrategia', '');

  return (
    <Superficie titulo="Autoevaluación final" etiqueta="Mira cómo te fue en cada caso" tono="arena">
      <div className="grid gap-5 lg:grid-cols-2">
        {casos.map((c) => (
          <Autoevaluacion
            key={c.numero}
            unidad={c.numero}
            titulo={`Caso ${c.numero}: ${c.titulo}`}
          />
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="cierre-gusto" className="text-body font-medium">
            ¿Qué caso te gustó más y por qué?
          </label>
          <textarea
            id="cierre-gusto"
            rows={3}
            maxLength={500}
            value={gusto}
            onChange={(e) => set_gusto(e.target.value)}
            className={`${area_texto} mt-2 bg-pure-white`}
          />
        </div>
        <div>
          <label htmlFor="cierre-estrategia" className="text-body font-medium">
            ¿Qué estrategia vas a seguir usando cuando leas?
          </label>
          <textarea
            id="cierre-estrategia"
            rows={3}
            maxLength={500}
            value={estrategia}
            onChange={(e) => set_estrategia(e.target.value)}
            className={`${area_texto} mt-2 bg-pure-white`}
          />
        </div>
      </div>
    </Superficie>
  );
}
