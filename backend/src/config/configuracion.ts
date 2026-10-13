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
  redis: {
    host: process.env.DB_HOST,
    puerto: Number(process.env.REDIS_PORT),
    password: leerSecreto('REDIS_PASSWORD_FILE'),
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION,
    bucket: process.env.STORAGE_BUCKET,
    accessKey: leerSecreto('STORAGE_ACCESS_KEY_FILE'),
    secretKey: leerSecreto('STORAGE_SECRET_KEY_FILE'),
  },
});
