import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearUsuarios1792517240015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE usuarios (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        correo         VARCHAR(254) NOT NULL,
        nombre         VARCHAR(100) NOT NULL,
        rol            VARCHAR(20)  NOT NULL,
        password_hash  TEXT NULL,
        activo         BOOLEAN NOT NULL DEFAULT true,
        creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
        ultimo_acceso  TIMESTAMPTZ NULL,
        CONSTRAINT chk_usuarios_rol CHECK (rol IN ('ADMIN', 'CARGADOR', 'CONSULTA')),
        CONSTRAINT chk_usuarios_correo CHECK (correo = lower(correo) AND correo LIKE '%_@_%'),
        CONSTRAINT chk_usuarios_nombre CHECK (length(trim(nombre)) >= 2)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_usuarios_correo ON usuarios (correo)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE usuarios`);
  }
}
