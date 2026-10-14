import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class ActualizarTipoDocumentoDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
