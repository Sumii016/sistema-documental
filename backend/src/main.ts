import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ErroresFilter } from './comun/errores.filter';
import { registrarPeticiones } from './comun/registrar-peticiones.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Arranque');

  const host = config.getOrThrow<string>('app.host');
  const puerto = config.getOrThrow<number>('app.puerto');
  const frontendOrigen = config.getOrThrow<string>('app.frontendOrigen');

  // 0. Registro de peticiones (primero, para que todo tenga idPeticion)
  app.use(registrarPeticiones);

  // 1. Cabeceras seguras
  app.use(helmet());

  // 2. CORS: solo nuestro frontend puede llamar a la API desde un navegador
  app.enableCors({
    origin: [frontendOrigen],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
  });

  // 3. Validación global y manejo de errores
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErroresFilter());

  // 4. Apagado limpio
  app.enableShutdownHooks();

  await app.listen(puerto, host);
  logger.log(`API en http://${host}:${puerto}`);
  logger.log(`CORS permitido para ${frontendOrigen}`);
}

bootstrap().catch((error) => {
  new Logger('Arranque').error(error);
  process.exit(1);
});
