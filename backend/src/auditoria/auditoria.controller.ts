import { Controller, Get } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AuditoriaService } from './auditoria.service';

@ApiTags('Auditoria')
@Roles('ADMIN')
@ApiForbiddenResponse({ description: 'Solo administradores ' })
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly servicio: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Ultimos 100 registros de auditoria ' })
  @ApiOkResponse({ description: 'Del mas reciente al mas antiguo' })
  ultimos() {
    return this.servicio.ultimos();
  }
}
