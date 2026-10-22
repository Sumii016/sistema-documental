import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface ContextoPeticion {
  usuario: string | null;
  ip: string | null;
  idPeticion: string | null;
}

// uso metodo(@contexto() ctx: contextoPeticion)

export const Contexto = createParamDecorator(
  (_dato: unknown, c: ExecutionContext): ContextoPeticion => {
    const req = c.switchToHttp().getRequest<Request>();
    const id = req.res?.getHeader('X-Request-Id'); // lo puso elmiddleware de registro
    return {
      usuario: req.session?.usuario?.correo ?? null,
      ip: req.ip ?? null,
      idPeticion: typeof id === 'string' ? id : null,
    };
  },
);
