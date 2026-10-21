import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ES_PUBLICA } from './publica.decorator';

@Injectable()
export class AutenticadoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    // la ruta o su controlador tiene @publica()?
    const esPublica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [
      contexto.getHandler(), //el metodo
      contexto.getClass(), //el controlador
    ]);
    if (esPublica) return true;

    const req = contexto.switchToHttp().getRequest<Request>();
    if (!req.session?.usuario) {
      throw new UnauthorizedException('Debe iniciar sesion');
    }
    return true;
  }
}
