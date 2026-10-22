import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  Contexto,
  type ContextoPeticion,
} from '../auditoria/contexto-peticion.decorator';
import { Roles } from '../auth/roles.decorator';
import type { UsuarioSesion } from '../auth/sesion-usuario';
import { UsuarioActual } from '../auth/usuario-actual.decorator';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { RestablecerContrasenaDto } from './dto/restablecer-contrasena.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@ApiForbiddenResponse({ description: 'Solo administradores' })
@Roles('ADMIN')
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly servicio: UsuariosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({ description: 'Lista ordenada por correo (sin contraseñas)' })
  listar() {
    return this.servicio.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario' })
  @ApiNotFoundResponse({ description: 'No existe' })
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.obtener(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un usuario con rol y contraseña inicial' })
  @ApiCreatedResponse({ description: 'Creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese correo' })
  async crear(@Body() dto: CrearUsuarioDto, @Contexto() ctx: ContextoPeticion) {
    const usuario = await this.servicio.crear(dto);
    await this.auditoria.registrar(ctx, {
      accion: 'USUARIO_CREADO',
      entidad: 'usuario',
      entidadId: usuario.id,
      detalle: { correo: usuario.correo, rol: usuario.rol },
    });
    return usuario;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar nombre, rol o activar/desactivar' })
  @ApiOkResponse({ description: 'Actualizado' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o intento de quitarse su propio acceso',
  })
  @ApiNotFoundResponse({ description: 'No existe' })
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual() actual: UsuarioSesion,
    @Contexto() ctx: ContextoPeticion,
  ) {
    const usuario = await this.servicio.actualizar(id, dto, actual);
    await this.auditoria.registrar(ctx, {
      accion: 'USUARIO_ACTUALIZADO',
      entidad: 'usuario',
      entidadId: id,
      detalle: { correo: usuario.correo, cambios: { ...dto } },
    });
    return usuario;
  }

  @Post(':id/contrasena')
  @HttpCode(204)
  @ApiOperation({ summary: 'Restablecer la contraseña de un usuario' })
  @ApiNoContentResponse({ description: 'Contraseña cambiada' })
  @ApiNotFoundResponse({ description: 'No existe' })
  async restablecer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestablecerContrasenaDto,
    @Contexto() ctx: ContextoPeticion,
  ): Promise<void> {
    await this.servicio.restablecerContrasena(id, dto.contrasena);
    // Sin "detalle": la contraseña NUNCA va a la auditoría
    await this.auditoria.registrar(ctx, {
      accion: 'CONTRASENA_RESTABLECIDA',
      entidad: 'usuario',
      entidadId: id,
    });
  }
}
