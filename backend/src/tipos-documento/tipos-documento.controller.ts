import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CrearTipoDocumentoDto } from './dto/crear-tipo-documento.dto';
import { TiposDocumentoService } from './tipos-documento.service';
import { ActualizarTipoDocumentoDto } from './dto/actualizar-tipo-documento.dto';

@Controller('tipos-documento')
export class TiposDocumentoController {
  constructor(private readonly servicio: TiposDocumentoService) {}

  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Get(':id/descarga')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }

  @Post()
  crear(@Body() datos: CrearTipoDocumentoDto) {
    return this.servicio.crear(datos);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarTipoDocumentoDto,
  ) {
    return this.servicio.actualizar(id, datos);
  }
}
