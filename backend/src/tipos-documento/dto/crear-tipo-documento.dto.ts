import { IsString, Length, Matches } from 'class-validator';

export class CrearTipoDocumentoDto {
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'codigo solo puede tener letras, números, guion o guion bajo',
  })
  codigo!: string;

  @IsString()
  @Length(2, 100)
  nombre!: string;
}
