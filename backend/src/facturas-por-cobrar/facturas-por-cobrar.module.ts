import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documento } from '../documentos/documento.entity';
import { StorageModule } from '../storage/storage.module';
import { TipoDocumento } from '../tipos-documento/tipo-documento.entity';
import { FacturaPorCobrar } from './factura-por-cobrar.entity';
import { FacturasPorCobrarService } from './facturas-por-cobrar.service';
import { FacturasPorCobrarController } from './facturas-por-cobrar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, FacturaPorCobrar, TipoDocumento]),
    StorageModule,
  ],
  controllers: [FacturasPorCobrarController],
  providers: [FacturasPorCobrarService],
})
export class FacturasPorCobrarModule {}
