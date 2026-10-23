import { detectarTipo, escaparLike } from './archivos';

describe('detectarTipo (firma de bytes)', () => {
  it('reconoce un PDF por sus primeros bytes', () => {
    const pdf = Buffer.from('%PDF-1.7\n...contenido...');
    expect(detectarTipo(pdf)?.mime).toBe('application/pdf');
  });

  it('reconoce un PNG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectarTipo(png)?.ext).toBe('png');
  });

  it('reconoce un JPEG', () => {
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(detectarTipo(jpg)?.mime).toBe('image/jpeg');
  });

  it('rechaza un texto renombrado a .pdf', () => {
    const falso = Buffer.from('esto no es un pdf');
    expect(detectarTipo(falso)).toBeUndefined();
  });

  it('rechaza un archivo vacío', () => {
    expect(detectarTipo(Buffer.alloc(0))).toBeUndefined();
  });
});

describe('escaparLike (comodines de búsqueda)', () => {
  it('deja igual un texto normal', () => {
    expect(escaparLike('taller')).toBe('taller');
  });

  it('escapa % para que no actúe como comodín', () => {
    expect(escaparLike('100%')).toBe('100\\%');
  });

  it('escapa _ para que no actúe como comodín', () => {
    expect(escaparLike('a_b')).toBe('a\\_b');
  });

  it('escapa la barra invertida', () => {
    expect(escaparLike('a\\b')).toBe('a\\\\b');
  });
});
