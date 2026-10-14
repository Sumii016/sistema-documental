import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReglasTiposDocumento1792012118949 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE tipos_documento
                ADD CONSTRAINT chk_tipos_documento_codigo_formato
                    CHECK (codigo ~ '^[A-Z0-9_-]{2,20}$'),
                ADD CONSTRAINT chk_tipos_documento_nombre_no_vacio
                    CHECK (length(trim(nombre)) >= 2)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE tipos_documento
                DROP CONSTRAINT chk_tipos_documento_nombre_no_vacio,
                DROP CONSTRAINT chk_tipos_documento_codigo_formato
        `);
  }
}
