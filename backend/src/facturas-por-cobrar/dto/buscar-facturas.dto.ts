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

const limpiar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class BuscarFacturasDto {
  @IsOptional()
  @Transform(limpiar)
  @Matches(/^[0-9-]{1,19}$/, { message: 'numero: solo dígitos y guiones' })
  numero?: string;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  cliente?: string;

  @IsOptional()
  @Transform(limpiar)
  @IsString()
  @Length(2, 100)
  vendedor?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  desde?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porPagina: number = 20;
}
