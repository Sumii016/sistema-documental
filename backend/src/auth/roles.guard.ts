import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Rol } from '../usuarios/usuario.entity';
import { ROLES_PERMITIDOS } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Rol[] | undefined>(
      ROLES_PERMITIDOS,
      [contexto.getHandler(), contexto.getClass()],
    );

    // Sin @Roles → basta con haber iniciado sesión
    if (!permitidos || permitidos.length === 0) return true;

    const usuario = contexto.switchToHttp().getRequest<Request>()
      .session.usuario;
    if (!usuario || !permitidos.includes(usuario.rol)) {
      throw new ForbiddenException('No tiene permiso para esta acción');
    }
    return true;
  }
}
