import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import {
  claveSesionesDeUsuario,
  PREFIJO_SESION,
} from './almacen-sesiones-redis';

@Injectable()
export class SesionesService {
  private readonly logger = new Logger('Sesiones');

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // Borra TODAS las sesiones abiertas de un usuario, devuelve cuantas cerro
  async cerrarTodas(usuarioId: string): Promise<number> {
    const clave = claveSesionesDeUsuario(usuarioId);
    const sids = await this.redis.smembers(clave);
    if (sids.length > 0) {
      await this.redis.del(...sids.map((sid) => PREFIJO_SESION + sid));
    }
    await this.redis.del(clave);
    this.logger.log(
      `Cerradas ${sids.length} sesión(es) del usuario ${usuarioId}`,
    );
    return sids.length;
  }
}
