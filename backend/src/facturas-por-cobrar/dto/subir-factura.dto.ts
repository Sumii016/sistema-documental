import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const DINERO = { decimal_digits: '0,2' };
const limpiar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SubirFacturaDto {
  @ApiProperty({
    description: 'Número de la factura',
    example: '000-001-01-00000123',
    pattern: '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$',
  })
  @Transform(limpiar)
  @Matches(/^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$/, {
    message: 'numeroFactura: formato 000-000-00-00000000',
  })
  numeroFactura!: string;

  @ApiProperty({
    description: 'Código CAI (se guarda en mayúsculas)',
    example: 'A1B2C3-D4E5F6-A7B8C9-D0E1F2-A3B4C5-D6',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^([0-9A-F]{6}-){5}[0-9A-F]{2}$/, {
    message: 'cai: formato inválido',
  })
  cai!: string;

  @ApiProperty({ format: 'date', example: '2026-10-01' })
  @IsDateString({ strict: true })
  fechaEmision!: string;

  @ApiProperty({
    format: 'date',
    example: '2026-10-31',
    description: 'No puede ser anterior a fechaEmision',
  })
  @IsDateString({ strict: true })
  fechaVencimiento!: string;

  @ApiProperty({ example: 'Taller de Prueba', minLength: 2, maxLength: 200 })
  @Transform(limpiar)
  @IsString()
  @Length(2, 200)
  clienteNombre!: string;

  @ApiPropertyOptional({
    description: 'RTN de 14 dígitos',
    example: '08011999123456',
  })
  @IsOptional()
  @Transform(limpiar)
  @Matches(/^[0-9]{14}$/, { message: 'clienteRtn: 14 dígitos' })
  clienteRtn?: string;

  @ApiProperty({ example: 'Juan Perez', minLength: 2, maxLength: 100 })
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  vendedor!: string;

  @ApiProperty({ example: 'Central', minLength: 2, maxLength: 100 })
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  sucursal!: string;

  @ApiProperty({ example: 'Credito 30 dias', minLength: 2, maxLength: 50 })
  @Transform(limpiar)
  @IsString()
  @Length(2, 50)
  condicionPago!: string;

  @ApiProperty({ enum: ['HNL', 'USD'], example: 'HNL' })
  @IsIn(['HNL', 'USD'])
  moneda!: string;

  @ApiProperty({ description: 'Hasta 2 decimales', example: '1000.00' })
  @IsDecimal(DINERO)
  subtotal!: string;

  @ApiProperty({ example: '150.00' })
  @IsDecimal(DINERO)
  isv15!: string;

  @ApiProperty({ example: '0.00' })
  @IsDecimal(DINERO)
  isv18!: string;

  @ApiProperty({ example: '1150.00' })
  @IsDecimal(DINERO)
  total!: string;

  @ApiPropertyOptional({
    description: 'Referencia del documento en Odoo',
    example: 'INV/2026/00123',
    maxLength: 50,
  })
  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(1, 50)
  referenciaOdoo?: string;
}

// Solo para la documentación: el formulario de Swagger necesita saber que también va un archivo
export class SubirFacturaConArchivoDto extends SubirFacturaDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'PDF, PNG o JPEG (máx. 20 MB)',
  })
  archivo!: unknown;
}
