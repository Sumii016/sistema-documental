import { createInterface } from 'node:readline/promises';
import fuenteDatos from '../database/data-source';
import {
  cifrarContrasena,
  MAX_CONTRASENA,
  MIN_CONTRASENA,
} from '../usuarios/contrasenas';
import { preguntarOculto } from './terminal';

async function principal() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const correo = (await rl.question('Correo del usuario: '))
    .trim()
    .toLowerCase();
  rl.close();

  const contrasena = await preguntarOculto(
    `Nueva contraseña (${MIN_CONTRASENA}-${MAX_CONTRASENA} caracteres): `,
  );
  const confirmacion = await preguntarOculto('Repite la nueva contraseña: ');

  if (contrasena !== confirmacion)
    throw new Error('Las contraseñas no coinciden');
  if (
    contrasena.length < MIN_CONTRASENA ||
    contrasena.length > MAX_CONTRASENA
  ) {
    throw new Error(
      `La contraseña debe tener entre ${MIN_CONTRASENA} y ${MAX_CONTRASENA} caracteres`,
    );
  }

  const hash = await cifrarContrasena(contrasena);

  await fuenteDatos.initialize();
  try {
    const [filas] = await fuenteDatos.query(
      `UPDATE usuarios SET password_hash = $1 WHERE correo = $2 RETURNING id`,
      [hash, correo],
    );
    console.log(
      filas.length
        ? `✅ Contraseña actualizada para ${correo}`
        : `⚠️ No existe un usuario con ${correo}`,
    );
  } finally {
    await fuenteDatos.destroy();
  }
}

principal().catch((error: Error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
