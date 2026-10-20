import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const limpiar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class BuscarFacturasDto {
  @ApiPropertyOptional({
    description: 'Inicio del numero de factura',
    example: '000-001',
  })
  @IsOptional()
  @Transform(limpiar)
  @Matches(/^[0-9-]{1,19}$/, { message: 'numero: solo dígitos y guiones' })
  numero?: string;

  @ApiPropertyOptional({
    description: 'Parte del nombre del cliente (sin importar mayúsculas)',
    example: 'taller',
  })
  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  cliente?: string;

  @ApiPropertyOptional({
    description: 'Parte del nombre del vendedor',
    example: 'juan',
  })
  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  vendedor?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Fecha de emisión desde (incluida)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  desde?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Fecha de emisión hasta (incluida)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsDateString({ strict: true })
  hasta?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porPagina: number = 20;
}
