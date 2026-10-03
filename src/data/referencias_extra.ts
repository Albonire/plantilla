// references that are not resources of a case: the AI tool, the evaluation decree, the editions used to check the poem
// and the biography, and the news of the case 4 challenge.
import noticia_reto4 from './noticia_reto4.json';
// "verificado" is true only after the link was opened and its content read (date in "verificado_el").

export interface ReferenciaExtra {
  apa: string;
  url: string;
  verificado: boolean;
  verificado_el?: string;
}

export const referencias_extra: ReferenciaExtra[] = [
  {
    apa: 'Ministerio de Educación Nacional. (2009). *Decreto 1290 de 2009: Por el cual se reglamenta la evaluación del aprendizaje y promoción de los estudiantes de los niveles de educación básica y media*. https://www.mineducacion.gov.co/1759/w3-article-187765.html',
    url: 'https://www.mineducacion.gov.co/1759/w3-article-187765.html',
    verificado: true,
    verificado_el: '2026-09-24',
  },
  {
    apa: 'Pombo, R. (s. f.). *El renacuajo paseador*. En *Cuentos pintados* [Archivo PDF]. Biblioteca Luis Ángel Arango, Banco de la República. https://babel.banrepcultural.org/digital/api/collection/p17054coll10/id/2720/download',
    url: 'https://babel.banrepcultural.org/digital/api/collection/p17054coll10/id/2720/download',
    verificado: true,
    verificado_el: '2026-09-25',
  },
  {
    apa: 'Red Cultural del Banco de la República. (s. f.). Rafael Pombo. En *Enciclopedia*. https://enciclopedia.banrepcultural.org/Rafael_Pombo',
    url: 'https://enciclopedia.banrepcultural.org/Rafael_Pombo',
    verificado: true,
    verificado_el: '2026-09-25',
  },
  {
    apa: noticia_reto4.apa,
    url: noticia_reto4.url,
    verificado: Boolean(noticia_reto4.url && noticia_reto4.verificada_el),
    verificado_el: noticia_reto4.verificada_el,
  },
];
