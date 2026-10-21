import { SessionData, Store } from 'express-session';
import type Redis from 'ioredis';

const PREFIJO = 'sesion:';

export class AlmacenSesionesRedis extends Store {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSegundos: number,
  ) {
    super();
  }

  //buscar una sesion por su id
  get(
    sid: string,
    cb: (err: unknown, sesion?: SessionData | null) => void,
  ): void {
    this.redis.get(PREFIJO + sid).then(
      (valor) => cb(null, valor ? (JSON.parse(valor) as SessionData) : null),
      (error) => cb(error),
    );
  }

  // guardar o reemplazar una sesion, con expiracion
  set(sid: string, sesion: SessionData, cb?: (err?: unknown) => void): void {
    this.redis
      .set(PREFIJO + sid, JSON.stringify(sesion), 'EX', this.ttlSegundos)
      .then(
        () => cb?.(),
        (error) => cb?.(error),
      );
  }

  //borrar una sesion
  destroy(sid: string, cb?: (err?: unknown) => void): void {
    this.redis.del(PREFIJO + sid).then(
      () => cb?.(),
      (error) => cb?.(error),
    );
  }

  // renovar la expiracion cuando el usuario sigue activo
  touch(sid: string, _sesion: SessionData, cb?: () => void): void {
    this.redis.expire(PREFIJO + sid, this.ttlSegundos).then(
      () => cb?.(),
      () => cb?.(),
    );
  }
}
