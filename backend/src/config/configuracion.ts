import { leerSecreto } from './leer-secreto';

export const configuracion = () => ({
  app: {
    host: process.env.HOST,
    puerto: Number(process.env.PORT),
    frontendOrigen: process.env.FRONTEND_ORIGIN,
    swagger: process.env.SWAGGER_HABILITADO === 'true',
  },
  db: {
    host: process.env.DB_HOST,
    puerto: Number(process.env.DB_PORT),
    nombre: process.env.DB_NAME,
    usuario: process.env.DB_USER,
    password: leerSecreto('DB_PASSWORD_FILE'),
  },
  redis: {
    host: process.env.REDIS_HOST,
    puerto: Number(process.env.REDIS_PORT),
    password: leerSecreto('REDIS_PASSWORD_FILE'),
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION,
    bucket: process.env.STORAGE_BUCKET,
    accessKey: leerSecreto('STORAGE_ACCESS_KEY_FILE'),
    secretKey: leerSecreto('STORAGE_SECRET_KEY_FILE'),
    endpointPublico: process.env.STORAGE_PUBLIC_ENDPOINT ?? process.env.STORAGE_ENDPOINT,
  },
  sesion: {
    secreto: leerSecreto('SESSION_SECRET_FILE'),
    cookieSegura: process.env.COOKIE_SEGURA !== 'false',
    horas: 8,
  },
});
