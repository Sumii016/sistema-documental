import { DataSource } from 'typeorm';
import { leerSecreto } from '../config/leer-secreto';

// Devuelve la variable de entorno o detiene todo con un mensaje claro
function requerida(variable: string): string {
  const valor = process.env[variable];
  if (!valor) {
    throw new Error(`Falta la variable ${variable} en el .env`);
  }
  return valor;
}

// Conexión SOLO para migraciones, con el administrador (puede crear y alterar tablas).
// La API nunca usa este archivo: ella sigue conectada como docs_app.
export default new DataSource({
  type: 'postgres',
  host: requerida('DB_HOST'),
  port: Number(requerida('DB_PORT')),
  database: requerida('DB_NAME'),
  username: requerida('DB_ADMIN_USER'),
  password: leerSecreto('DB_ADMIN_PASSWORD_FILE'),
  migrations: ['dist/database/migraciones/*.js'],
  migrationsTableName: 'migraciones',
});
