import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '../usuarios/usuario.entity';
import { RolesGuard } from './roles.guard';

// Una petición falsa con (o sin) usuario en la sesión
function contextoCon(rol: Rol | undefined): ExecutionContext {
  const req = {
    session: {
      usuario: rol
        ? { id: '1', correo: 'prueba@prueba.local', nombre: 'Prueba', rol }
        : undefined,
    },
  };
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

// Un guard cuyo Reflector "dice" que la ruta permite estos roles
function guardQuePermite(permitidos: Rol[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(permitidos),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('deja pasar si la ruta no tiene @Roles', () => {
    expect(
      guardQuePermite(undefined).canActivate(contextoCon('CONSULTA')),
    ).toBe(true);
  });

  it('deja pasar si el rol está en la lista', () => {
    expect(
      guardQuePermite(['ADMIN', 'CARGADOR']).canActivate(
        contextoCon('CARGADOR'),
      ),
    ).toBe(true);
  });

  it('responde 403 si el rol no está en la lista', () => {
    expect(() =>
      guardQuePermite(['ADMIN']).canActivate(contextoCon('CARGADOR')),
    ).toThrow(ForbiddenException);
  });

  it('responde 403 si no hay usuario en la sesión', () => {
    expect(() =>
      guardQuePermite(['ADMIN']).canActivate(contextoCon(undefined)),
    ).toThrow(ForbiddenException);
  });
});
