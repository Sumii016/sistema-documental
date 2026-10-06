import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pedimos la configuración a Nest
  const config = app.get(ConfigService);
  const host = config.getOrThrow<string>('app.host');
  const puerto = config.getOrThrow<number>('app.puerto');
  const usuarioDb = config.getOrThrow<string>('db.usuario');

  await app.listen(puerto, host);

  Logger.log(`API en http://${host}:${puerto}`, 'Arranque');
  Logger.log(
    `Usuario de BD: ${usuarioDb} (la contraseña nunca se imprime)`,
    'Arranque',
  );
}

bootstrap().catch((error: Error) => {
  Logger.error(error.message, 'Arranque');
  process.exit(1);
});
