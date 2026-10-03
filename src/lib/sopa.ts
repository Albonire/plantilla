import { aleatorio_con_semilla, hash_texto } from './semilla';

export interface Celda {
  fila: number;
  col: number;
}

export interface Colocacion {
  palabra: string;
  fila: number;
  col: number;
  dfila: number;
  dcol: number;
}

export interface Sopa {
  tamano: number;
  celdas: string[][];
  colocaciones: Colocacion[];
  palabras: string[];
}

// forward directions only: right, down, diagonal down-right and diagonal up-right
const DIRECCIONES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];

const RELLENO = 'AAAEEEIIOOOUUSSRRNNDLCTMPBGVFHQJZ';

export function normalizar(palabra: string): string {
  return palabra
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (marca) => (marca === '\u0303' ? marca : ''))
    .normalize('NFC')
    .replace(/[^A-ZÑ]/g, '');
}

function cabe(celdas: string[][], p: string, fila: number, col: number, df: number, dc: number) {
  const n = celdas.length;
  const fin_f = fila + df * (p.length - 1);
  const fin_c = col + dc * (p.length - 1);
  if (fin_f < 0 || fin_f >= n || fin_c < 0 || fin_c >= n) return false;
  for (let i = 0; i < p.length; i++) {
    const actual = celdas[fila + df * i][col + dc * i];
    if (actual !== '' && actual !== p[i]) return false;
  }
  return true;
}

export function generar_sopa(palabras: string[], tamano: number, semilla: string): Sopa {
  const limpias = palabras.map(normalizar).filter(Boolean);
  const mas_larga = Math.max(...limpias.map((p) => p.length));
  if (mas_larga > tamano) throw new Error('la palabra más larga no cabe en la sopa');

  for (let intento = 0; intento < 60; intento++) {
    const azar = aleatorio_con_semilla(hash_texto(`${semilla}:${intento}`));
    const celdas: string[][] = Array.from({ length: tamano }, () => Array(tamano).fill(''));
    const colocaciones: Colocacion[] = [];
    // longest words first: they are the hardest to place
    const orden = [...limpias].sort((a, b) => b.length - a.length);
    let completo = true;

    for (const p of orden) {
      let puesta = false;
      for (let t = 0; t < 200 && !puesta; t++) {
        const [df, dc] = DIRECCIONES[Math.floor(azar() * DIRECCIONES.length)];
        const fila = Math.floor(azar() * tamano);
        const col = Math.floor(azar() * tamano);
        if (!cabe(celdas, p, fila, col, df, dc)) continue;
        for (let i = 0; i < p.length; i++) celdas[fila + df * i][col + dc * i] = p[i];
        colocaciones.push({ palabra: p, fila, col, dfila: df, dcol: dc });
        puesta = true;
      }
      if (!puesta) {
        completo = false;
        break;
      }
    }

    if (!completo) continue;

    for (let f = 0; f < tamano; f++) {
      for (let c = 0; c < tamano; c++) {
        if (celdas[f][c] === '') celdas[f][c] = RELLENO[Math.floor(azar() * RELLENO.length)];
      }
    }
    return { tamano, celdas, colocaciones, palabras: limpias };
  }
  throw new Error('no se pudo generar la sopa de letras');
}

// cells on the straight line from a to b, or null if the line is not horizontal, vertical or diagonal
export function celdas_de_linea(a: Celda, b: Celda): Celda[] | null {
  const df = b.fila - a.fila;
  const dc = b.col - a.col;
  const pasos = Math.max(Math.abs(df), Math.abs(dc));
  if (pasos === 0) return [a];
  if (df !== 0 && dc !== 0 && Math.abs(df) !== Math.abs(dc)) return null;
  const sf = Math.sign(df);
  const sc = Math.sign(dc);
  return Array.from({ length: pasos + 1 }, (_, i) => ({
    fila: a.fila + sf * i,
    col: a.col + sc * i,
  }));
}

export function palabra_en_seleccion(sopa: Sopa, a: Celda, b: Celda): string | null {
  const linea = celdas_de_linea(a, b);
  if (!linea || linea.length < 2) return null;
  const texto = linea.map((c) => sopa.celdas[c.fila][c.col]).join('');
  const reves = [...texto].reverse().join('');
  return sopa.palabras.find((p) => p === texto || p === reves) ?? null;
}
