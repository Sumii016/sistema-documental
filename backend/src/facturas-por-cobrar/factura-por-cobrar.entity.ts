import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Documento } from '../documentos/documento.entity';

@Entity('facturas_por_cobrar')
export class FacturaPorCobrar {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Documento)
  @JoinColumn({ name: 'documento_id' })
  documento!: Documento;

  @Column({ name: 'documento_id' })
  documentoId!: string;

  @Column({ name: 'numero_factura', length: 19, unique: true })
  numeroFactura!: string;

  @Column()
  cai!: string;

  @Column({ name: 'fecha_emision', type: 'date' })
  fechaEmision!: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento!: string;

  @Column({ name: 'cliente_nombre' })
  clienteNombre!: string;

  @Column({ name: 'cliente_rtn', type: 'varchar', nullable: true })
  clienteRtn!: string | null;

  @Column()
  vendedor!: string;

  @Column()
  sucursal!: string;

  @Column({ name: 'condicion_pago' })
  condicionPago!: string;

  @Column({ length: 3 })
  moneda!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string;

  @Column({ name: 'isv_15', type: 'numeric', precision: 14, scale: 2 })
  isv15!: string;

  @Column({ name: 'isv_18', type: 'numeric', precision: 14, scale: 2 })
  isv18!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total!: string;

  @Column({ name: 'referencia_odoo', type: 'varchar', nullable: true })
  referenciaOdoo!: string | null;

  @Column({ name: 'creado_por' })
  creadoPor!: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn!: Date;
}
