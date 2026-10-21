import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { MAX_CONTRASENA } from '../../usuarios/contrasenas';
import { transform } from 'typescript';

export class LoginDto {
  @ApiProperty({ example: 'admin@prueba.local ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLocaleLowerCase() : value,
  )
  @IsEmail()
  correo!: string;

  @ApiProperty({ format: 'password' })
  @IsString()
  @Length(1, MAX_CONTRASENA)
  contrasena!: string;
}
