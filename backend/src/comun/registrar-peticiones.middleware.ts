import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function registrarPeticiones(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const idPeticion = randomUUID();
  const inicio = Date.now();
  res.setHeader('X-Request-Id', idPeticion);

  // 'finish' = cuando la respuesta ya se envio, se sabe el codigo y el tiempo
  res.on('finish', () => {
    const ms = Date.now() - inicio;
    const linea = `[${idPeticion}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms ${req.ip}`;
    if (res.statusCode >= 500) logger.error(linea);
    else if (res.statusCode >= 400) logger.warn(linea);
    else logger.log(linea);
  });

  next(); // deja pasar la peticion al siguiente paso
}
