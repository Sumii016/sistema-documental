import type { ThrottlerStorage } from '@nestjs/throttler';
import type Redis from 'ioredis';

interface RegistroLimite {
  totalHits: number;
  timeToExpire: number;     // segundos
  isBlocked: boolean;
  timeToBlockExpire: number; // segundos
}

// Cuenta las peticiones de cada IP en Redis (compartido entre copias de la API y reinicios)
export class AlmacenThrottlerRedis implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    clave: string,
    ttlMs: number,
    limite: number,
    bloqueoMs: number,
    nombre: string,
  ): Promise<RegistroLimite> {
    const claveConteo = `limite:${nombre}:${clave}`;
    const claveBloqueo = `${claveConteo}:bloqueo`;

    // Sumar 1 y ver cuanto le queda a la ventana, en un solo viaje a Redis
    const resultado = (await this.redis.multi().incr(claveConteo).pttl(claveConteo).exec()) as [
      [Error | null, number],
      [Error | null, number],
    ];
    const conteo = resultado[0][1];
    let restanteMs = resultado[1][1];

    // Primera petición de la ventana: ponerle expiracion
    if (restanteMs < 0) {
      await this.redis.pexpire(claveConteo, ttlMs);
      restanteMs = ttlMs;
    }

    // Paso el limite: bloquear durante bloqueoMs (NX = solo si no estaba bloqueado ya)
    if (conteo > limite) {
      await this.redis.set(claveBloqueo, '1', 'PX', bloqueoMs, 'NX');
    }
    const bloqueoRestanteMs = await this.redis.pttl(claveBloqueo);
    const bloqueado = bloqueoRestanteMs > 0;

    return {
      totalHits: conteo,
      timeToExpire: Math.ceil(restanteMs / 1000),
      isBlocked: bloqueado,
      timeToBlockExpire: bloqueado ? Math.ceil(bloqueoRestanteMs / 1000) : 0,
    };
  }
}