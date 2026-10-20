import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class ActualizarTipoDocumentoDto {
  @ApiPropertyOptional({
    description: ' Nuevo nombre',
    example: 'Contrato de servicios',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'false = ya no se puede usar en documentos nuevos',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
