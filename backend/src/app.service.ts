import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  obtenerEstado(): { estado: string; hora: string } {
    return { estado: 'OK', hora: new Date().toISOString() };
  }
}
