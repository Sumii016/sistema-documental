import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ROLES, type Rol } from '../usuario.entity';

export class ActualizarUsuarioDto {
  @ApiPropertyOptional({
    example: 'Nombre Corregido',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @ApiPropertyOptional({ enum: [...ROLES], example: 'CARGADOR' })
  @IsOptional()
  @IsIn(ROLES)
  rol?: Rol;

  @ApiPropertyOptional({
    description: 'false = no puede iniciar sesión',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
