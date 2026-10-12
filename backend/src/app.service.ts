import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private dataSource: DataSource) {}
  getHello(): string {
    return 'Hello World!';
  }

  obtenerEstado(): { estado: string; hora: string } {
    return { estado: 'OK', hora: new Date().toISOString() };
  }

  async verificarBaseDeDatos(): Promise<{
    baseDeDatos: string;
    tiposDocumento: number;
  }> {
    const [fila] = await this.dataSource.query<{ bd: string; total: string }[]>(
      'SELECT current_database() AS bd, (SELECT COUNT(*) FROM tipos_documento) AS total',
    );
    return { baseDeDatos: fila.bd, tiposDocumento: Number(fila.total) };
  }
}
