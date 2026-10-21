import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const ROLES = ['ADMIN', 'CARGADOR', 'CONSULTA'] as const;
export type Rol = (typeof ROLES)[number];

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 254, unique: true })
  correo!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 20 })
  rol!: Rol;

  // select: false -> NUNCA SE CARGA salvo que se pida explicitamente
  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  ultimoAcceso!: Date | null;
}
