import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubirFacturaDto } from './dto/subir-factura.dto';
import { FacturasPorCobrarService } from './facturas-por-cobrar.service';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB, igual que el CHECK de la BD

@Controller('facturas-por-cobrar')
export class FacturasPorCobrarController {
  constructor(private readonly servicio: FacturasPorCobrarService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: MAX_BYTES, files: 1, fields: 20 },
    }),
  )
  subir(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body() dto: SubirFacturaDto,
  ) {
    return this.servicio.subir(archivo, dto);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.obtener(id);
  }

  @Get(':id/descarga')
  descarga(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.urlDescarga(id);
  }
}
