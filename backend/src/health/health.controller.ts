import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import { REDIS } from '../redis/redis.module';
import { StorageService } from '../storage/storage.service';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Publica } from '../auth/publica.decorator';

type Estado = 'ok' | 'error';

@ApiTags('Salud')
@Publica()
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de la base de datos, Redis y almacenamiento',
  })
  @ApiOkResponse({ description: 'Todos los servicios responden ' })
  @ApiServiceUnavailableResponse({
    description: 'Al menos un servicio no responde',
  })
  async verificar() {
    const [db, redis, storage] = await Promise.all([
      this.probar('db', () => this.dataSource.query('SELECT 1')),
      this.probar('redis', () => this.redis.ping()),
      this.probar('storage', () => this.storage.verificarBucket()),
    ]);

    const servicios = { db, redis, storage };

    if (db === 'error' || redis === 'error' || storage === 'error') {
      throw new ServiceUnavailableException({ estado: 'error', servicios });
    }
    return { estado: 'ok', servicios };
  }

  private async probar(
    nombre: string,
    prueba: () => Promise<unknown>,
  ): Promise<Estado> {
    try {
      await prueba();
      return 'ok';
    } catch (error) {
      this.logger.warn(
        `Falló la conexión con ${nombre}: ${(error as Error).message}`,
      );
      return 'error';
    }
  }
}
