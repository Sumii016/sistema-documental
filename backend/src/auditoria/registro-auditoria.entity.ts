import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const ACCIONES = [
  'LOGIN_OK',
  'LOGIN_FALLIDO',
  'LOGOUT',
  'FACTURA_SUBIDA',
  'FACTURA_DESCARGADA',
  'USUARIO_CREADO',
  'USUARIO_ACTUALIZADO',
  'CONTRASENA_RESTABLECIDA',
] as const;
export type Accion = (typeof ACCIONES)[number];

@Entity('auditoria')
export class RegistroAuditoria {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string; //BIGINT llega como texto, igual que numeric

  @CreateDateColumn({ name: 'ocurrido_en', type: 'timestamptz' })
  ocurridoEn!: Date;

  @Column({ type: 'varchar', nullable: true })
  usuario!: string | null;

  @Column({ type: 'varchar' })
  accion!: Accion;

  @Column({ type: 'varchar', nullable: true })
  entidad!: string | null;

  @Column({ name: 'entidad_id', type: 'varchar', nullable: true })
  entidadId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalle!: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ip!: string | null;

  @Column({ name: 'id_peticion', type: 'uuid', nullable: true })
  idPeticion!: string | null;
}
