import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { NOMBRE_COOKIE } from './sesion-usuario';
import type { UsuarioSesion } from './sesion-usuario';
import { Publica } from './publica.decorator';
import { UsuarioActual } from './usuario-actual.decorator';

function regenerar(req: Request): Promise<void> {
  return new Promise((ok, mal) =>
    req.session.regenerate((e) => (e ? mal(e) : ok())),
  );
}

function destruir(req: Request): Promise<void> {
  return new Promise((ok, mal) =>
    req.session.regenerate((e) => (e ? mal(e) : ok())),
  );
}

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
  ): Promise<UsuarioSesion> {
    const usuario = await this.auth.validar(dto.correo, dto.contrasena);
    await regenerar(req); // id de sesión nuevo (evita fijación de sesión)
    req.session.usuario = usuario;
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
  ): Promise<void> {
    await destruir(req);
    res.clearCookie(NOMBRE_COOKIE);
  }

  @Get('yo')
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ApiOkResponse({ description: 'Datos del usuario' })
  @ApiUnauthorizedResponse({ description: 'No ha iniciado sesión' })
  yo(@UsuarioActual() usuario: UsuarioSesion): UsuarioSesion {
    return usuario;
  }
}
