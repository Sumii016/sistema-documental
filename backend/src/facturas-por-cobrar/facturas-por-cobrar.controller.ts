import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  SubirFacturaConArchivoDto,
  SubirFacturaDto,
} from './dto/subir-factura.dto';
import { BuscarFacturasDto } from './dto/buscar-facturas.dto';
import { FacturasPorCobrarService } from './facturas-por-cobrar.service';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB, igual que el CHECK de la BD

@ApiTags('Facturas por cobrar')
@ApiTooManyRequestsResponse({
  description: 'Demasiadas peticiones; espere e intente de nuevo',
})
@Controller('facturas-por-cobrar')
export class FacturasPorCobrarController {
  constructor(private readonly servicio: FacturasPorCobrarService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: MAX_BYTES, files: 1, fields: 20 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: SubirFacturaConArchivoDto })
  @ApiOperation({
    description:
      'Acepta PDF, PNG o JPEG (max. 20 MB). Limite: 10 subidas por minuto.',
  })
  @ApiCreatedResponse({ description: 'Factura guardada ' })
  @ApiBadRequestResponse({
    description: 'Datos invalidos o el archivo no es PDF/PNG/JPEG',
  })
  @ApiConflictResponse({
    description: 'El numero de factura o el archivo ya existen',
  })
  @ApiPayloadTooLargeResponse({ description: 'El archivo pasa de 20 MB' })
  subir(
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Body() dto: SubirFacturaDto,
  ) {
    return this.servicio.subir(archivo, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Buscar facturas con filtros y paginacion',
    description:
      'Todos los filtros son opcionales. Orden: fecha de emision (mas reciente primero).',
  })
  @ApiOkResponse({
    description: 'Pagina de resultados con total y totalPaginas',
  })
  @ApiBadRequestResponse({
    description: 'Filtro invalido o parametro desconocido',
  })
  buscar(@Query() filtros: BuscarFacturasDto) {
    return this.servicio.buscar(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los datos de una factura' })
  @ApiOkResponse({ description: 'La factura (sin datos internos el archivo)' })
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'No existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.obtener(id);
  }

  @Get(':id/descarga')
  @ApiOperation({
    summary: 'Obtener un enlace temporal para descargar el archivo',
    description: 'El enlace expira en 5 minutos.',
  })
  @ApiOkResponse({ description: '{ url, expiraEnMinmutos }' })
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'No existe' })
  descarga(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.urlDescarga(id);
  }
}
