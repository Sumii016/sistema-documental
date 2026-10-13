import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CrearTipoDocumentoDto } from './dto/crear-tipo-documento.dto';
import { TiposDocumentoService } from './tipos-documento.service';

@Controller('tipos-documento')
export class TiposDocumentoController {
  constructor(private readonly servicio: TiposDocumentoService) {}

  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }

  @Post()
  crear(@Body() datos: CrearTipoDocumentoDto) {
    return this.servicio.crear(datos);
  }
}
