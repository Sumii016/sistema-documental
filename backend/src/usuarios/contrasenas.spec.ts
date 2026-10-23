import { cifrarContrasena, verificarContrasena } from './contrasenas';

describe('contrasenas', () => {
  const CLAVE = 'una-clave-de-prueba-larga';

  it('acepta la contrasena correcta', async () => {
    const hash = await cifrarContrasena(CLAVE);

    const resultado = await verificarContrasena(CLAVE, hash);

    expect(resultado).toBe(true);
  });

  it('rechaza una contrasena incorrecta', async () => {
    const hash = await cifrarContrasena(CLAVE);

    const resultado = await verificarContrasena('otra-clave-cualquiera', hash);

    expect(resultado).toBe(false);
  });

  it('el hash no contiene la contrasena y usa el formato scrypt', async () => {
    const hash = await cifrarContrasena(CLAVE);

    expect(hash).not.toContain(CLAVE);
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash.split('$')).toHaveLength(6);
  });

  it('la misma contrasena produce hashes distintos (sal aleatoria)', async () => {
    const hash1 = await cifrarContrasena(CLAVE);
    const hash2 = await cifrarContrasena(CLAVE);

    expect(hash1).not.toBe(hash2);
  });

  it('rechaza un hash con formato invalido sin lanzar error', async () => {
    await expect(verificarContrasena(CLAVE, 'basura')).resolves.toBe(false);
  });
});
