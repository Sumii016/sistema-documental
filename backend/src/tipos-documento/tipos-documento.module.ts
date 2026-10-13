import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoDocumento } from './tipo-documento.entity';
import { TiposDocumentoController } from './tipos-documento.controller';
import { TiposDocumentoService } from './tipos-documento.service';

@Module({
  imports: [TypeOrmModule.forFeature([TipoDocumento])],
  controllers: [TiposDocumentoController],
  providers: [TiposDocumentoService],
})
export class TiposDocumentoModule {}
