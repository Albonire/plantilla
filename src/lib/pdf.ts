// pdf generation in the browser. jspdf is loaded only when a student presses a download button.
import type { jsPDF } from 'jspdf';

const CREMA: [number, number, number] = [245, 241, 228];
const TINTA: [number, number, number] = [44, 46, 42];
const PIEDRA: [number, number, number] = [95, 97, 94];
const SOL: [number, number, number] = [245, 226, 17];
const VERDE: [number, number, number] = [142, 212, 98];
const CORAL: [number, number, number] = [255, 112, 93];

export interface CampoPdf {
  etiqueta: string;
  valor: string;
  grupo?: string;
}

export interface SeccionPdf {
  titulo: string;
  campos: CampoPdf[];
  imagen?: string;
}

// standard pdf fonts only cover latin-1, so anything else is simplified
export function limpiar(texto: string): string {
  return texto
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\n\u0020-\u007E\u00A1-\u00FF]/g, '');
}

export function nombre_archivo(base: string): string {
  return (
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') + '.pdf'
  );
}

async function nuevo_documento(orientacion: 'p' | 'l' = 'p'): Promise<jsPDF> {
  const { jsPDF: JsPDF } = await import('jspdf');
  const doc = new JsPDF({ orientation: orientacion, unit: 'mm', format: 'a4' });
  fondo(doc);
  return doc;
}

function fondo(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...CREMA);
  doc.rect(0, 0, w, h, 'F');
}

function nueva_pagina(doc: jsPDF) {
  doc.addPage();
  fondo(doc);
}

function cabecera(doc: jsPDF, titulo: string, subtitulo: string, nombre: string): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...SOL);
  doc.rect(0, 0, w, 10, 'F');
  doc.setTextColor(...PIEDRA);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Aventura lectora', 20, 20);
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const lineas = doc.splitTextToSize(limpiar(titulo), w - 40);
  doc.text(lineas, 20, 32);
  let y = 32 + lineas.length * 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...PIEDRA);
  doc.text(limpiar(subtitulo), 20, y);
  y += 8;
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.text(`Detective: ${limpiar(nombre) || '(sin nombre)'}`, 20, y);
  doc.setDrawColor(...TINTA);
  doc.setLineWidth(0.4);
  doc.line(20, y + 4, w - 20, y + 4);
  return y + 12;
}

function asegurar_espacio(doc: jsPDF, y: number, necesario: number): number {
  const h = doc.internal.pageSize.getHeight();
  if (y + necesario > h - 18) {
    nueva_pagina(doc);
    return 22;
  }
  return y;
}

function pintar_seccion(doc: jsPDF, seccion: SeccionPdf, y_inicial: number): number {
  const w = doc.internal.pageSize.getWidth();
  let y = asegurar_espacio(doc, y_inicial, 30);
  doc.setFillColor(...VERDE);
  doc.roundedRect(20, y - 6, w - 40, 10, 3, 3, 'F');
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(limpiar(seccion.titulo), 24, y + 1);
  y += 12;

  let grupo_actual = '';
  for (const campo of seccion.campos) {
    if (campo.grupo && campo.grupo !== grupo_actual) {
      grupo_actual = campo.grupo;
      y = asegurar_espacio(doc, y, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...TINTA);
      doc.text(limpiar(campo.grupo), 20, y);
      y += 7;
    }
    const valor = campo.valor.trim();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lineas = doc.splitTextToSize(valor ? limpiar(valor) : '(sin responder)', w - 46);
    y = asegurar_espacio(doc, y, 10 + lineas.length * 5.6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...PIEDRA);
    doc.text(limpiar(campo.etiqueta), 20, y);
    y += 5.5;
    doc.setFont('helvetica', valor ? 'normal' : 'italic');
    doc.setFontSize(12);
    doc.setTextColor(...(valor ? TINTA : PIEDRA));
    doc.text(lineas, 23, y);
    y += lineas.length * 5.6 + 4;
  }

  if (seccion.imagen) {
    try {
      const props = doc.getImageProperties(seccion.imagen);
      const ancho = Math.min(w - 40, 120);
      const alto = (props.height / props.width) * ancho;
      y = asegurar_espacio(doc, y, alto + 12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PIEDRA);
      doc.text('Mi imagen', 20, y);
      doc.addImage(seccion.imagen, props.fileType, 20, y + 3, ancho, alto);
      y += alto + 12;
    } catch {
      // an unreadable image is skipped, the text still goes out
    }
  }
  return y + 4;
}

function pie(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PIEDRA);
    doc.text('Aventura lectora. Curso para 5.º de primaria.', 20, h - 10);
    doc.text(`${i} de ${total}`, w - 20, h - 10, { align: 'right' });
  }
}

export interface DatosReto {
  nombre: string;
  caso: number;
  titulo_caso: string;
  titulo_reto: string;
  campos: CampoPdf[];
  imagen?: string;
}

export async function descargar_reto(datos: DatosReto) {
  const doc = await nuevo_documento();
  const y = cabecera(
    doc,
    datos.titulo_reto,
    `Reto del caso ${datos.caso}: ${datos.titulo_caso}`,
    datos.nombre,
  );
  pintar_seccion(doc, { titulo: 'Mi trabajo', campos: datos.campos, imagen: datos.imagen }, y + 4);
  pie(doc);
  doc.save(nombre_archivo(`aventura_lectora_caso_${datos.caso}_reto`));
}

export interface DatosExpediente {
  nombre: string;
  frase_final: string;
  retos: {
    caso: number;
    titulo_caso: string;
    titulo_reto: string;
    campos: CampoPdf[];
    imagen?: string;
  }[];
}

export async function descargar_expediente(datos: DatosExpediente) {
  const doc = await nuevo_documento();
  const w = doc.internal.pageSize.getWidth();

  // cover page
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, w, 120, 'F');
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.text('Expediente del', 20, 60);
  doc.text('detective lector', 20, 74);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Aventura lectora', 20, 92);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(limpiar(datos.nombre) || '(sin nombre)', 20, 148);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...PIEDRA);
  doc.text('Nombre del detective', 20, 140);
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Lo que más aprendí como detective fue...', 20, 172);
  doc.setFont('helvetica', 'normal');
  const frase = doc.splitTextToSize(limpiar(datos.frase_final) || '(sin responder)', w - 40);
  doc.text(frase, 20, 180);

  for (const reto of datos.retos) {
    nueva_pagina(doc);
    const y = cabecera(
      doc,
      reto.titulo_reto,
      `Caso ${reto.caso}: ${reto.titulo_caso}`,
      datos.nombre,
    );
    pintar_seccion(doc, { titulo: 'Mi trabajo', campos: reto.campos, imagen: reto.imagen }, y + 4);
  }
  pie(doc);
  doc.save(nombre_archivo('expediente_del_detective_lector'));
}

export async function descargar_certificado(nombre: string) {
  const doc = await nuevo_documento('l');
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...TINTA);
  doc.setLineWidth(1.2);
  doc.roundedRect(12, 12, w - 24, h - 24, 10, 10, 'S');
  doc.setFillColor(...SOL);
  doc.roundedRect(12, 12, w - 24, 16, 8, 8, 'F');
  doc.roundedRect(12, 12, w - 24, 16, 8, 8, 'S');

  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Aventura lectora', w / 2, 23, { align: 'center' });

  doc.setFontSize(38);
  doc.text('Certificado', w / 2, 56, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Certifico que', w / 2, 76, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  const nombre_limpio = limpiar(nombre) || '(escribe tu nombre)';
  doc.text(nombre_limpio, w / 2, 96, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(w / 2 - 70, 100, w / 2 + 70, 100);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(15);
  const cuerpo = doc.splitTextToSize(
    'resolvió los cinco casos de la Aventura lectora y ahora es Detective de la Lectura.',
    200,
  );
  doc.text(cuerpo, w / 2, 116, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...PIEDRA);
  doc.text('El equipo de Aventura lectora', 50, h - 30, { align: 'center' });
  doc.setDrawColor(...PIEDRA);
  doc.setLineWidth(0.3);
  doc.line(25, h - 36, 75, h - 36);

  // stamp
  const cx = w - 55;
  const cy = h - 42;
  doc.setDrawColor(...TINTA);
  doc.setLineWidth(1);
  doc.setFillColor(...CORAL);
  doc.circle(cx, cy, 19, 'FD');
  doc.setFillColor(...CREMA);
  doc.circle(cx, cy, 14, 'FD');
  doc.setTextColor(...TINTA);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DETECTIVE', cx, cy - 1, { align: 'center' });
  doc.text('LECTOR', cx, cy + 5, { align: 'center' });

  doc.save(nombre_archivo('certificado_aventura_lectora'));
}
