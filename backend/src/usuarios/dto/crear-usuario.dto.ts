import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, Length, MaxLength } from 'class-validator';
import { MAX_CONTRASENA, MIN_CONTRASENA } from '../contrasenas';
import { ROLES, type Rol } from '../usuario.entity';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'nuevo@prueba.local ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  correo!: string;

  @ApiProperty({ example: 'Nombre Apellido', minLength: 2, maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  nombre!: string;

  @ApiProperty({ enum: [...ROLES], example: 'CONSULTA' })
  @IsIn(ROLES)
  rol!: Rol;

  @ApiProperty({
    format: 'password',
    minLength: MIN_CONTRASENA,
    maxLength: MAX_CONTRASENA,
    description: 'Contrasena inicial',
  })
  @IsString()
  @Length(MIN_CONTRASENA, MAX_CONTRASENA)
  contrasena!: string;
}
