import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tipo_documento_id' })
  tipoDocumentoId!: number;

  @Column({ name: 'object_key', unique: true })
  objectKey!: string;

  @Column({ name: 'nombre_original' })
  nombreOriginal!: string;

  @Column({ name: 'mime_type' })
  mimeType!: string;

  @Column({ name: 'tamano_bytes', type: 'integer' })
  tamanoBytes!: number;

  @Column({ length: 64 })
  sha256!: string;

  @Column({ name: 'subido_por' })
  subidoPor!: string;

  @Column({ name: 'subido_en', type: 'timestamptz', default: () => 'now()' })
  subidoEn!: string;

  @Column({ name: 'eliminado_en', type: 'timestamptz', nullable: true })
  eliminadoEn!: Date | null;
}
