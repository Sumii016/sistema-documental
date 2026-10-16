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
  @Transform(limpiar)
  @Matches(/^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$/, {
    message: 'numeroFactura: formato 000-000-00-00000000',
  })
  numeroFactura!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^([0-9A-F]{6}-){5}[0-9A-F]{2}$/, {
    message: 'cai: formato inválido',
  })
  cai!: string;

  @IsDateString({ strict: true })
  fechaEmision!: string;

  @IsDateString({ strict: true })
  fechaVencimiento!: string;

  @Transform(limpiar)
  @IsString()
  @Length(2, 200)
  clienteNombre!: string;

  @IsOptional()
  @Transform(limpiar)
  @Matches(/^[0-9]{14}$/, { message: 'clienteRtn: 14 dígitos' })
  clienteRtn?: string;

  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  vendedor!: string;

  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  sucursal!: string;

  @Transform(limpiar)
  @IsString()
  @Length(2, 50)
  condicionPago!: string;

  @IsIn(['HNL', 'USD'])
  moneda!: string;

  @IsDecimal(DINERO) subtotal!: string;
  @IsDecimal(DINERO) isv15!: string;
  @IsDecimal(DINERO) isv18!: string;
  @IsDecimal(DINERO) total!: string;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(1, 50)
  referenciaOdoo?: string;
}
