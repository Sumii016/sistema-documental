import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tipos_documento')
export class TipoDocumento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20, unique: true })
  codigo!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn!: Date;
}
