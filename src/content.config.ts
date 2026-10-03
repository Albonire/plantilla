import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ids_integrantes } from './config/sitio';

const unidades = defineCollection({
  loader: glob({ pattern: 'unidad_*.mdx', base: './src/content/unidades' }),
  schema: z.object({
    numero: z.number().int().min(1).max(5),
    titulo: z.string(),
    color: z.enum(['fresh-grass', 'sky-pop', 'sunshine-pop', 'coral-pop', 'mixto']),
    responsable: z.enum(ids_integrantes),
    imagen_portada: z.object({
      alt: z.string(),
      tipo: z.enum(['propio', 'web']),
      credito: z.string(),
    }),
    aprendizajes_esperados: z.array(z.string()).min(1),
    mision: z.string(),
    referentes: z.object({
      dba: z.array(z.string()),
      estandares: z.array(z.string()),
    }),
    contenidos: z
      .array(z.object({ id: z.string(), titulo: z.string(), detalle: z.string().optional() }))
      .min(1),
    insignia: z.object({ nombre: z.string(), descripcion: z.string() }),
    para_familias: z.string(),
  }),
});

// one MDX file per page of a case (unidad_N/abrir, pistas, lupa, cerrar). They receive the unit data as props.unidad.
const paginas = defineCollection({
  loader: glob({ pattern: 'unidad_*/*.mdx', base: './src/content/paginas' }),
  schema: z.object({}),
});

export const collections = { unidades, paginas };
