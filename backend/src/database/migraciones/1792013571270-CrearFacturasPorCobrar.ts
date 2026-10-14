import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { IS_MIME_TYPE } from 'class-validator';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrearFacturasPorCobrar1792013571270 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. La tabla provisional de la Fase 1 está vacía: la reemplazamos
    await queryRunner.query(`DROP TABLE IF EXISTS documentos`);

    // 2. El ARCHIVO (sirve para cualquier tipo de documento)
    await queryRunner.query(`
            CREATE TABLE documentos (
                id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tipo_documento_id  INT          NOT NULL REFERENCES tipos_documento(id),
                object_key         VARCHAR(255) NOT NULL UNIQUE,
                nombre_original    VARCHAR(255) NOT NULL,
                mime_type          VARCHAR(100) NOT NULL
                    CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
                tamano_bytes       BIGINT       NOT NULL
                    CHECK (tamano_bytes > 0 AND tamano_bytes <= 20971520),
                sha256             CHAR(64)     NOT NULL
                    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
                subido_por         VARCHAR(255) NOT NULL,
                subido_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
                eliminado_en       TIMESTAMPTZ
            )
        `);
    await queryRunner.query(
      `CREATE INDEX idx_documentos_sha256 ON documentos (sha256)`,
    );

    // 3. Los DATOS de la factura (para buscarla)
    await queryRunner.query(`
            CREATE TABLE facturas_por_cobrar (
                id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                documento_id       UUID         NOT NULL UNIQUE REFERENCES documentos(id),
                numero_factura     VARCHAR(19)  NOT NULL UNIQUE
                    CHECK (numero_factura ~ '^[0-9]{3}-[0-9]{3}-[0-9]{2}-[0-9]{8}$'),
                cai                VARCHAR(37)  NOT NULL
                    CHECK (cai ~ '^([0-9A-F]{6}-){5}[0-9A-F]{2}$'),
                fecha_emision      DATE         NOT NULL,
                fecha_vencimiento  DATE         NOT NULL,
                cliente_nombre     VARCHAR(200) NOT NULL CHECK (length(trim(cliente_nombre)) >= 2),
                cliente_rtn        VARCHAR(14)  CHECK (cliente_rtn ~ '^[0-9]{14}$'),
                vendedor           VARCHAR(150),
                sucursal           VARCHAR(100),
                condicion_pago     VARCHAR(30)  NOT NULL,
                moneda             CHAR(3)      NOT NULL DEFAULT 'HNL' CHECK (moneda IN ('HNL', 'USD')),
                subtotal           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
                isv_15             NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (isv_15 >= 0),
                isv_18             NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (isv_18 >= 0),
                total              NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
                referencia_odoo    VARCHAR(100),
                creado_por         VARCHAR(255) NOT NULL,
                creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
                actualizado_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
                CONSTRAINT chk_facturas_fechas CHECK (fecha_vencimiento >= fecha_emision)
            )
        `);

    // 4. Índices para los filtros de búsqueda
    await queryRunner.query(
      `CREATE INDEX idx_facturas_cliente_nombre ON facturas_por_cobrar (lower(cliente_nombre))`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_facturas_cliente_rtn ON facturas_por_cobrar (cliente_rtn)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_facturas_vendedor ON facturas_por_cobrar (lower(vendedor))`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_facturas_fecha_emision ON facturas_por_cobrar (fecha_emision)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deshacer en orden inverso y dejar la tabla provisional como estaba
    await queryRunner.query(`DROP TABLE facturas_por_cobrar`);
    await queryRunner.query(`DROP TABLE documentos`);
    await queryRunner.query(`
            CREATE TABLE documentos (
                id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                object_key        VARCHAR(255) NOT NULL UNIQUE,
                nombre_original   VARCHAR(255) NOT NULL,
                mime_type         VARCHAR(100) NOT NULL,
                tamano_bytes      BIGINT       NOT NULL CHECK (tamano_bytes > 0),
                sha256            CHAR(64)     NOT NULL,
                tipo_documento_id INT          NOT NULL REFERENCES tipos_documento(id),
                descripcion       TEXT,
                fecha_documento   DATE,
                tags              TEXT[]       NOT NULL DEFAULT '{}',
                autor_sub         VARCHAR(255) NOT NULL,
                creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
                eliminado_en      TIMESTAMPTZ
            )
        `);
  }
}
