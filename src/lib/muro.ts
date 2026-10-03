// wall of notes shared through the url fragment: the data never reaches a server

export interface Respuesta {
  id: string;
  autor: string;
  texto: string;
}

export interface Nota {
  id: string;
  columna: string;
  autor: string;
  texto: string;
  respuestas: Respuesta[];
}

export interface Muro {
  version: 1;
  muro_id: string;
  notas: Nota[];
}

function a_base64url(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function de_base64url(texto: string): Uint8Array {
  const base = texto.replace(/-/g, '+').replace(/_/g, '/');
  const relleno = base + '='.repeat((4 - (base.length % 4)) % 4);
  const binario = atob(relleno);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function pasar(datos: Uint8Array, flujo: CompressionStream | DecompressionStream) {
  const escritor = flujo.writable.getWriter();
  // a write error also surfaces when reading the result, so it is safe to ignore it here
  const escritura = (async () => {
    await escritor.write(datos as unknown as BufferSource);
    await escritor.close();
  })();
  escritura.catch(() => undefined);
  const salida = await new Response(flujo.readable).arrayBuffer();
  return new Uint8Array(salida);
}

export async function codificar(muro: Muro): Promise<string> {
  const crudo = new TextEncoder().encode(JSON.stringify(muro));
  const comprimido = await pasar(crudo, new CompressionStream('deflate-raw'));
  return a_base64url(comprimido);
}

function es_muro(valor: unknown): valor is Muro {
  if (typeof valor !== 'object' || valor === null) return false;
  const m = valor as Partial<Muro>;
  return m.version === 1 && typeof m.muro_id === 'string' && Array.isArray(m.notas);
}

export async function decodificar(cadena: string): Promise<Muro | null> {
  try {
    const bytes = de_base64url(cadena);
    const plano = await pasar(bytes, new DecompressionStream('deflate-raw'));
    const dato: unknown = JSON.parse(new TextDecoder().decode(plano));
    return es_muro(dato) ? dato : null;
  } catch {
    return null;
  }
}

// merge notes from a shared wall into the local one, without duplicating ids
export function combinar(local: Muro, recibido: Muro): Muro {
  const por_id = new Map(local.notas.map((n) => [n.id, n]));
  for (const nota of recibido.notas) {
    const existente = por_id.get(nota.id);
    if (!existente) {
      por_id.set(nota.id, nota);
      continue;
    }
    const ids = new Set(existente.respuestas.map((r) => r.id));
    const extra = nota.respuestas.filter((r) => !ids.has(r.id));
    por_id.set(nota.id, { ...existente, respuestas: [...existente.respuestas, ...extra] });
  }
  return { ...local, notas: [...por_id.values()] };
}
