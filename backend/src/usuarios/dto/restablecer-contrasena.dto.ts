import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { MAX_CONTRASENA, MIN_CONTRASENA } from '../contrasenas';

export class RestablecerContrasenaDto {
  @ApiProperty({
    format: 'password',
    minLength: MIN_CONTRASENA,
    maxLength: MAX_CONTRASENA,
  })
  @IsString()
  @Length(MIN_CONTRASENA, MAX_CONTRASENA)
  contrasena!: string;
}
