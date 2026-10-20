import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CrearTipoDocumentoDto } from './dto/crear-tipo-documento.dto';
import { TiposDocumentoService } from './tipos-documento.service';
import { ActualizarTipoDocumentoDto } from './dto/actualizar-tipo-documento.dto';

@ApiTags('Tipos de documento')
@Controller('tipos-documento')
export class TiposDocumentoController {
  constructor(private readonly servicio: TiposDocumentoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de documento' })
  @ApiOkResponse({ description: 'Lista ordenada por codigo' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id/')
  @ApiOperation({ summary: 'Obtener un tipo de documento ' })
  @ApiOkResponse({ description: 'El tipo de documento' })
  @ApiBadRequestResponse({ description: 'El id no es un numero' })
  @ApiNotFoundResponse({ description: 'No existe' })
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un tipo de documento' })
  @ApiCreatedResponse({ description: 'Creado' })
  @ApiConflictResponse({ description: 'Ya existe ese codigo ' })
  crear(@Body() datos: CrearTipoDocumentoDto) {
    return this.servicio.crear(datos);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar nombre o activar/desactivar' })
  @ApiOkResponse({ description: 'Actualizado' })
  @ApiBadRequestResponse({ description: 'Datos invalidos o cuerpo vacio' })
  @ApiNotFoundResponse({ description: 'No existe' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: ActualizarTipoDocumentoDto,
  ) {
    return this.servicio.actualizar(id, datos);
  }
}
