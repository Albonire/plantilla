import { usar_almacen } from './hooks';

interface Props {
  unidad: number;
  titulo?: string;
}

const NIVELES = [
  { id: 'lo_se', texto: 'Ya lo sé hacer' },
  { id: 'con_ayuda', texto: 'Lo hago con ayuda' },
  { id: 'dificil', texto: 'Todavía se me dificulta' },
];

export function Autoevaluacion({ unidad, titulo = '¿Cómo te fue en este caso?' }: Props) {
  const [valor, set_valor] = usar_almacen<string>(`autoeval:${unidad}`, '');
  return (
    <fieldset className="rounded-card bg-pure-white p-7 md:p-10">
      <legend className="px-1 text-heading-sm font-medium tracking-tight">{titulo}</legend>
      <p className="mt-2 text-body-sm text-stone-text">
        Elige la frase que más se parece a ti. No tiene nota: sirve para saber qué repasar.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {NIVELES.map((n) => (
          <label
            key={n.id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-soft border-2 border-ink-black px-4 text-body ${
              valor === n.id ? 'bg-fresh-grass font-medium' : 'bg-pure-white hover:bg-cream-paper'
            }`}
          >
            <input
              type="radio"
              name={`autoeval-${unidad}`}
              checked={valor === n.id}
              onChange={() => set_valor(n.id)}
              className="size-5 accent-ink-black"
            />
            {n.texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
