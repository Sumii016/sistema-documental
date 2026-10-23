// Funciones puras: no dependen de Nest, TypeORM ni la BD → fáciles de probar

// Los primeros bytes de cada formato ("número mágico")
const FIRMAS = [
  {
    mime: 'application/pdf',
    ext: 'pdf',
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2d],
  }, // %PDF-
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] }, // .PNG
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
];

export function detectarTipo(contenido: Buffer) {
  return FIRMAS.find((f) => f.bytes.every((b, i) => contenido[i] === b));
}

// En LIKE, % y _ son comodines; los "escapamos" para buscarlos como texto normal
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}
