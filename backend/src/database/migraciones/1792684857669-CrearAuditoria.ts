import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearAuditoria1729612345678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE auditoria (
        id           BIGSERIAL PRIMARY KEY,
        ocurrido_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
        usuario      VARCHAR(254) NULL,
        accion       VARCHAR(50)  NOT NULL,
        entidad      VARCHAR(50)  NULL,
        entidad_id   VARCHAR(64)  NULL,
        detalle      JSONB        NULL,
        ip           VARCHAR(64)  NULL,
        id_peticion  UUID         NULL,
        CONSTRAINT chk_auditoria_accion CHECK (accion ~ '^[A-Z_]{3,50}$')
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_auditoria_ocurrido_en ON auditoria (ocurrido_en DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX ix_auditoria_usuario ON auditoria (usuario)`,
    );
    // La API solo puede AGREGAR y LEER registros: nunca modificarlos
    await queryRunner.query(`REVOKE UPDATE ON auditoria FROM docs_app`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE auditoria`);
  }
}
