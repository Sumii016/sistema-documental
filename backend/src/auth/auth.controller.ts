import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  Contexto,
  type ContextoPeticion,
} from '../auditoria/contexto-peticion.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Publica } from './publica.decorator';
import { NOMBRE_COOKIE } from './sesion-usuario';
import type { UsuarioSesion } from './sesion-usuario';
import { UsuarioActual } from './usuario-actual.decorator';

function regenerar(req: Request): Promise<void> {
  return new Promise((ok, mal) =>
    req.session.regenerate((e) => (e ? mal(e) : ok())),
  );
}

function destruir(req: Request): Promise<void> {
  return new Promise((ok, mal) =>
    req.session.destroy((e) => (e ? mal(e) : ok())),
  );
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly auditoria: AuditoriaService,
  ) {}

  @Post('login')
  @Publica()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Iniciar sesión con correo y contraseña',
    description: 'Máximo 5 intentos por minuto.',
  })
  @ApiOkResponse({ description: 'Sesión iniciada; se envía la cookie sgd.sid' })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Contexto() ctx: ContextoPeticion,
  ): Promise<UsuarioSesion> {
    let usuario: UsuarioSesion;
    try {
      usuario = await this.auth.validar(dto.correo, dto.contrasena);
    } catch (error) {
      await this.auditoria.registrar(ctx, {
        accion: 'LOGIN_FALLIDO',
        usuario: dto.correo,
      });
      throw error; // se sigue respondiendo el mismo 401
    }
    await regenerar(req);
    req.session.usuario = usuario;
    await this.auditoria.registrar(ctx, {
      accion: 'LOGIN_OK',
      usuario: usuario.correo,
    });
    return usuario;
  }

  @Post('logout')
  @Publica()
  @HttpCode(204)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiNoContentResponse({ description: 'Sesión cerrada y borrada de Redis' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Contexto() ctx: ContextoPeticion,
  ): Promise<void> {
    const habiaSesion = !!req.session.usuario;
    await destruir(req);
    res.clearCookie(NOMBRE_COOKIE);
    if (habiaSesion) {
      await this.auditoria.registrar(ctx, { accion: 'LOGOUT' });
    }
  }

  @Get('yo')
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ApiOkResponse({ description: 'Datos del usuario' })
  @ApiUnauthorizedResponse({ description: 'No ha iniciado sesión' })
  yo(@UsuarioActual() usuario: UsuarioSesion): UsuarioSesion {
    return usuario;
  }
}
