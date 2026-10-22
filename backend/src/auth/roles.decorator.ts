import { SetMetadata } from '@nestjs/common';
import { ROLES, type Rol } from '../usuarios/usuario.entity';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

// uso: @roles('ADMIN') o @Roles('ADMIN', 'CARGADOR')
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);
