import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import helmet from 'helmet';
import type Redis from 'ioredis';
import { AppModule } from './app.module';
import { AlmacenSesionesRedis } from './auth/almacen-sesiones-redis';
import { NOMBRE_COOKIE } from './auth/sesion-usuario';
import { ErroresFilter } from './comun/errores.filter';
import { registrarPeticiones } from './comun/registrar-peticiones.middleware';
import { REDIS } from './redis/redis.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Arranque');

  const host = config.getOrThrow<string>('app.host');
  const puerto = config.getOrThrow<number>('app.puerto');
  const frontendOrigen = config.getOrThrow<string>('app.frontendOrigen');
  const swaggerHabilitado = config.get<boolean>('app.swagger') === true;
  const horasSesion = config.getOrThrow<number>('sesion.horas');

  // 0. Registro de peticiones
  app.use(registrarPeticiones);

  // 1. Cabeceras seguras
  app.use(
    helmet(
      swaggerHabilitado
        ? {
            contentSecurityPolicy: {
              directives: { upgradeInsecureRequests: null },
            },
          }
        : undefined,
    ),
  );

  // 2. CORS
  app.enableCors({
    origin: [frontendOrigen],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH'],
  });

  // 3. Sesiones (cookie httpOnly + datos en Redis)
  app.use(
    session({
      name: NOMBRE_COOKIE,
      secret: config.getOrThrow<string>('sesion.secreto'),
      store: new AlmacenSesionesRedis(
        app.get<Redis>(REDIS),
        horasSesion * 3600,
      ),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: config.getOrThrow<boolean>('sesion.cookieSegura'),
        sameSite: 'lax',
        maxAge: horasSesion * 3600 * 1000,
      },
    }),
  );

  // 4. Validación global y manejo de errores
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ErroresFilter());

  // 5. Documentación (solo si está habilitada)
  if (swaggerHabilitado) {
    const configSwagger = new DocumentBuilder()
      .setTitle('Sistema Documental API')
      .setDescription(
        'Gestión de documentos escaneados: facturas por cobrar y catálogos.',
      )
      .setVersion('1.0')
      .build();
    const documento = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('docs', app, documento);
  }

  // 6. Apagado limpio
  app.enableShutdownHooks();

  await app.listen(puerto, host);
  logger.log(`API en http://${host}:${puerto}`);
  logger.log(`CORS permitido para ${frontendOrigen}`);
  logger.log(
    swaggerHabilitado
      ? `Swagger en http://${host}:${puerto}/docs`
      : 'Swagger deshabilitado',
  );
}

bootstrap().catch((error) => {
  new Logger('Arranque').error(error);
  process.exit(1);
});
