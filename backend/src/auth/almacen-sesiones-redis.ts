import { SessionData, Store } from 'express-session';
import type Redis from 'ioredis';

export const PREFIJO_SESION = 'sesion:';
export const claveSesionesDeUsuario = (usuarioId: string) =>
  `sesiones-usuario:${usuarioId}`;

export class AlmacenSesionesRedis extends Store {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSegundos: number,
  ) {
    super();
  }

  get(
    sid: string,
    cb: (err: unknown, sesion?: SessionData | null) => void,
  ): void {
    this.redis.get(PREFIJO_SESION + sid).then(
      (valor) => cb(null, valor ? (JSON.parse(valor) as SessionData) : null),
      (error) => cb(error),
    );
  }

  // Guarda la sesión y, si tiene usuario, la anota en su índice
  set(sid: string, sesion: SessionData, cb?: (err?: unknown) => void): void {
    const tx = this.redis
      .multi()
      .set(
        PREFIJO_SESION + sid,
        JSON.stringify(sesion),
        'EX',
        this.ttlSegundos,
      );
    const usuarioId = sesion.usuario?.id;
    if (usuarioId) {
      tx.sadd(claveSesionesDeUsuario(usuarioId), sid).expire(
        claveSesionesDeUsuario(usuarioId),
        this.ttlSegundos,
      );
    }
    tx.exec().then(
      () => cb?.(),
      (error) => cb?.(error),
    );
  }

  destroy(sid: string, cb?: (err?: unknown) => void): void {
    this.redis.del(PREFIJO_SESION + sid).then(
      () => cb?.(),
      (error) => cb?.(error),
    );
  }

  // Renueva la expiración de la sesión y de su índice
  touch(sid: string, sesion: SessionData, cb?: () => void): void {
    const tx = this.redis
      .multi()
      .expire(PREFIJO_SESION + sid, this.ttlSegundos);
    const usuarioId = sesion.usuario?.id;
    if (usuarioId) {
      tx.expire(claveSesionesDeUsuario(usuarioId), this.ttlSegundos);
    }
    tx.exec().then(
      () => cb?.(),
      () => cb?.(),
    );
  }
}
