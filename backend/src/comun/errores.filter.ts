import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch() // sin argumentos = atrapa TODOS los errores
export class ErroresFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(error: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const idPeticion = String(res.getHeader('X-Request-Id') ?? '');

    // errores 'esperados' (400, 404, 409, 429..) se responden tal cual +idPeticion
    if (error instanceof HttpException) {
      const estado = error.getStatus();
      const cuerpo = error.getResponse();
      res
        .status(estado)
        .json(
          typeof cuerpo === 'string'
            ? { statusCode: estado, message: cuerpo, idPeticion }
            : { ...cuerpo, idPeticion },
        );
      return;
    }

    // errores inesperados (db caida, bug..): detalle SOLO en el log
    this.logger.error(
      `[${idPeticion}] ${req.method} ${req.path}`,
      error instanceof Error ? error.stack : String(error),
    );

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: 'Error interno. Reporte este código a soporte.',
      idPeticion,
    });
  }
}
