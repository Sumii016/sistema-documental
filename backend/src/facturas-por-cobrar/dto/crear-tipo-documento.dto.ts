import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CrearTipoDocumento {
  @ApiProperty({
    description: 'Codigo corto; se guarda en mayusculas',
    example: 'CON',
    minLength: 2,
    maxLength: 20,
    pattern: '^[A-Za-z0-9_-]+$',
  })
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Za-z0-9_-]+$/)
  codigo!: string;

  @ApiProperty({
    description: 'Nombre visible',
    example: 'Contrato',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  nombre!: string;
}
