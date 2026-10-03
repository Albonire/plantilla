// safe localStorage wrapper: every access is guarded, the site works without it

const PREFIJO = 'aventura_lectora:';

function disponible(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function leer<T>(clave: string, por_defecto: T): T {
  try {
    const almacen = disponible();
    if (!almacen) return por_defecto;
    const crudo = almacen.getItem(PREFIJO + clave);
    if (crudo === null) return por_defecto;
    return JSON.parse(crudo) as T;
  } catch {
    return por_defecto;
  }
}

export function guardar(clave: string, valor: unknown): boolean {
  try {
    const almacen = disponible();
    if (!almacen) return false;
    almacen.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export function borrar(clave: string): boolean {
  try {
    const almacen = disponible();
    if (!almacen) return false;
    almacen.removeItem(PREFIJO + clave);
    return true;
  } catch {
    return false;
  }
}

export function claves_con_prefijo(sub_prefijo: string): string[] {
  try {
    const almacen = disponible();
    if (!almacen) return [];
    const salida: string[] = [];
    for (let i = 0; i < almacen.length; i++) {
      const completa = almacen.key(i);
      if (completa && completa.startsWith(PREFIJO + sub_prefijo)) {
        salida.push(completa.slice(PREFIJO.length));
      }
    }
    return salida;
  } catch {
    return [];
  }
}
