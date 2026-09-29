-- Esquema inicial del sistema documental
-- Se ejecuta automáticamente SOLO la primera vez que se crea el volumen de Postgres.
-- (Más adelante lo reemplazaremos por migraciones versionadas desde el backend.)

-- Catálogo: tipos de documento (Factura, Contrato, Acta...)
CREATE TABLE tipos_documento (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL UNIQUE,     -- ej. 'FAC', 'CON', 'ACT'
    nombre      VARCHAR(100) NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Metadatos de cada documento. El archivo físico vive en el almacenamiento S3.
CREATE TABLE documentos (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Clave del objeto en S3: la genera el sistema, nunca el nombre del usuario.
    -- Formato: <codigo_tipo>/<año>/<mes>/<uuid>.<ext>   ej. FAC/2026/09/3f2a...pdf
    object_key        VARCHAR(255) NOT NULL UNIQUE,
    nombre_original   VARCHAR(255) NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    tamano_bytes      BIGINT       NOT NULL CHECK (tamano_bytes > 0),
    sha256            CHAR(64)     NOT NULL,       -- detecta duplicados y alteraciones
    tipo_documento_id INT          NOT NULL REFERENCES tipos_documento(id),
    descripcion       TEXT,
    fecha_documento   DATE,
    tags              TEXT[]       NOT NULL DEFAULT '{}',
    autor_sub         VARCHAR(255) NOT NULL,       -- id del usuario según el proveedor OAuth ("sub" del JWT)
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    eliminado_en      TIMESTAMPTZ                  -- borrado lógico, nunca físico de entrada
);

CREATE INDEX idx_documentos_tipo   ON documentos (tipo_documento_id);
CREATE INDEX idx_documentos_fecha  ON documentos (fecha_documento);
CREATE INDEX idx_documentos_tags   ON documentos USING GIN (tags);   -- búsqueda por tags
CREATE INDEX idx_documentos_sha256 ON documentos (sha256);

-- Datos semilla del catálogo
INSERT INTO tipos_documento (codigo, nombre) VALUES
    ('FAC', 'Factura'),
    ('CON', 'Contrato'),
    ('ACT', 'Acta');
