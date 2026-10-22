import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ContextoPeticion } from './contexto-peticion.decorator';
import { Accion, RegistroAuditoria } from './registro-auditoria.entity';

interface DatosAuditoria {
  accion: Accion;
  usuario?: string; // solo si es distinto al de la sesion (ej. en el login)
  entidad?: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger('Auditoria');

  constructor(
    @InjectRepository(RegistroAuditoria)
    private readonly registros: Repository<RegistroAuditoria>,
  ) {}

  async registrar(ctx: ContextoPeticion, datos: DatosAuditoria): Promise<void> {
    try {
      const registro = this.registros.create({
        usuario: datos.usuario ?? ctx.usuario,
        accion: datos.accion,
        entidad: datos.entidad ?? null,
        entidadId: datos.entidadId ?? null,
        detalle: datos.detalle ?? null,
        ip: ctx.ip,
        idPeticion: ctx.idPeticion,
      });
      await this.registros.save(registro);
    } catch (error) {
      this.logger.error(
        `[${ctx.idPeticion}] No se pudo registrar ${datos.accion}`,
        (error as Error).stack,
      );
    }
  }

  ultimos(limite = 100): Promise<RegistroAuditoria[]> {
    return this.registros.find({ order: { ocurridoEn: 'DESC' }, take: limite });
  }
}
