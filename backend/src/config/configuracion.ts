import { leerSecreto } from './leer-secreto';

export const configuracion = () => ({
  app: {
    host: process.env.HOST,
    puerto: Number(process.env.PORT),
  },
  db: {
    host: process.env.DB_HOST,
    puerto: Number(process.env.DB_PORT),
    nombre: process.env.DB_NAME,
    usuario: process.env.DB_USER,
    password: leerSecreto('DB_PASSWORD_FILE'),
  },
});
