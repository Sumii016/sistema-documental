import { randomBytes, scrypt, timingSafeEqual } from 'crypto';

// parametros recomendados por owasp para scrypt
const N = 2 ** 17; //costo de la cpu/memoria
const R = 8; //tamano del bloque
const P = 1; //paralelismo
const LARGO_CLAVE = 64;
const MAX_MEMORIA = 256 * 1024 * 1024; //128 MB necesarios, dejamos margen

export const MIN_CONTRASENA = 12;
export const MAX_CONTRASENA = 128; //evita que alguien mande 10 MB de "contrasena"

function derivar(
  contrasena: string,
  sal: Buffer,
  n: number,
  r: number,
  p: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      contrasena,
      sal,
      LARGO_CLAVE,
      { N: N, r, p, maxmem: MAX_MEMORIA },
      (error, clave) => (error ? reject(error) : resolve(clave)),
    );
  });
}

export async function cifrarContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(contrasena, sal, N, R, P);
  return [
    'scrypt',
    N,
    R,
    P,
    sal.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

export async function verificarContrasena(
  contrasena: string,
  guardado: string,
): Promise<boolean> {
  const partes = guardado.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;

  const [, n, r, p, salB64, hashB64] = partes;
  const esperado = Buffer.from(hashB64, 'base64');
  const calculado = await derivar(
    contrasena,
    Buffer.from(salB64, 'base64'),
    Number(n),
    Number(r),
    Number(p),
  );

  return (
    calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  );
}
