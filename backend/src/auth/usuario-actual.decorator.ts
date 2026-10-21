import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioSesion } from './sesion-usuario';

//uso metodo (@usuarioActual() usuario: UsuarioSesion)
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioSesion | undefined =>
    contexto.switchToHttp().getRequest<Request>().session.usuario,
);
