import { createInterface } from 'node:readline/promises';
import fuenteDatos from '../database/data-source';
import {
  cifrarContrasena,
  MAX_CONTRASENA,
  MIN_CONTRASENA,
} from '../usuarios/contrasenas';
import { Rol, ROLES } from '../usuarios/usuario.entity';
import { preguntarOculto } from './terminal';

function esRol(valor: string): valor is Rol {
  return (ROLES as readonly string[]).includes(valor);
}

async function principal() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const correo = (await rl.question('Correo: ')).trim().toLowerCase();
  const nombre = (await rl.question('Nombre: ')).trim();
  const rol = (await rl.question(`Rol (${ROLES.join(' / ')}): `))
    .trim()
    .toUpperCase();
  rl.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    throw new Error('Correo inválido');
  if (nombre.length < 2) throw new Error('Nombre muy corto');
  if (!esRol(rol))
    throw new Error(`Rol inválido. Opciones: ${ROLES.join(', ')}`);

  const contrasena = await preguntarOculto(
    `Contraseña (${MIN_CONTRASENA}-${MAX_CONTRASENA} caracteres): `,
  );
  const confirmacion = await preguntarOculto('Repite la contraseña: ');

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
    const filas: { id: string }[] = await fuenteDatos.query(
      `INSERT INTO usuarios (correo, nombre, rol, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (correo) DO NOTHING
       RETURNING id`,
      [correo, nombre, rol, hash],
    );
    console.log(
      filas.length
        ? `✅ Usuario ${rol} creado: ${correo}`
        : `⚠️ Ya existe un usuario con ${correo}`,
    );
  } finally {
    await fuenteDatos.destroy();
  }
}

principal().catch((error: Error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
