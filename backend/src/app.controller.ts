import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Ruta 1: GET /
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Ruta 2: GET /ping
  @Get('ping')
  ping(): { estado: string; hora: string } {
    return this.appService.obtenerEstado();
  }

  // Ruta 3: GET /db
  @Get('db')
  verificarBaseDeDatos() {
    return this.appService.verificarBaseDeDatos();
  }
}
