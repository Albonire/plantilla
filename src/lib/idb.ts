// tiny IndexedDB wrapper for blobs (voice recordings). Every call fails soft.

const BASE = 'aventura_lectora';
const ALMACEN = 'blobs';

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolver) => {
    try {
      if (typeof indexedDB === 'undefined') return resolver(null);
      const peticion = indexedDB.open(BASE, 1);
      peticion.onupgradeneeded = () => {
        peticion.result.createObjectStore(ALMACEN);
      };
      peticion.onsuccess = () => resolver(peticion.result);
      peticion.onerror = () => resolver(null);
      peticion.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

function ejecutar<T>(
  modo: IDBTransactionMode,
  accion: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return new Promise((resolver) => {
    abrir().then((db) => {
      if (!db) return resolver(null);
      try {
        const peticion = accion(db.transaction(ALMACEN, modo).objectStore(ALMACEN));
        peticion.onsuccess = () => {
          resolver(peticion.result ?? null);
          db.close();
        };
        peticion.onerror = () => {
          resolver(null);
          db.close();
        };
      } catch {
        resolver(null);
        db.close();
      }
    });
  });
}

export async function guardar_blob(clave: string, blob: Blob): Promise<boolean> {
  const r = await ejecutar('readwrite', (s) => s.put(blob, clave));
  return r !== null;
}

export async function leer_blob(clave: string): Promise<Blob | null> {
  const r = await ejecutar<Blob>('readonly', (s) => s.get(clave));
  return r instanceof Blob ? r : null;
}

export async function borrar_blob(clave: string): Promise<boolean> {
  await ejecutar('readwrite', (s) => s.delete(clave));
  return true;
}
