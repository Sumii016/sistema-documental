# 11 — Migraciones y diseño de facturas por cobrar (Lección 6)

## 1. Qué es una migración
Un archivo con **un cambio** a la estructura de la BD, versionado en Git.
- `up` = aplicar · `down` = deshacer (en orden inverso).
- TypeORM anota las aplicadas en la tabla `migraciones` → nunca repite una.
- Mismo comando en cualquier PC/servidor → misma BD.

## 2. Quién las ejecuta
| Quién | Usuario BD | Puede |
|---|---|---|
| La API | `docs_app` | SELECT / INSERT / UPDATE |
| Migraciones | `docs_admin` | Crear y alterar tablas |
`src/database/data-source.ts` es una conexión **aparte**; la API nunca la carga, así nunca conoce la contraseña del admin.

## 3. Comandos (desde `backend`, con la app detenida)
| Comando | Para qué |
|---|---|
| `npm run migracion:crear -- src/database/migraciones/Nombre` | Crea el archivo (con timestamp) |
| `npm run migracion:ejecutar` | Aplica pendientes |
| `npm run migracion:revertir` | Deshace la última |
| `npm run migracion:estado` | `[X]` aplicada · `[ ]` pendiente |

- `nest build &&` compila primero; `node --env-file=.env` carga el `.env` sin Nest.
- `nest` no existe fuera del proyecto → usar `npm run …` o `npx nest …`.
- Si falta una variable, el driver **adivina** (usuario de Windows, BD = usuario) → validar con `requerida()`.

## 4. Defensa en profundidad
| Capa | Ejemplo |
|---|---|
| API (DTO) | `@Matches(/^[A-Za-z0-9_-]+$/)` |
| BD (CHECK) | `CHECK (codigo ~ '^[A-Z0-9_-]{2,20}$')` |
Si una capa falla, la otra rechaza. Probado insertando directo como `docs_app`.

## 5. Diseño: archivo ≠ datos
```
tipos_documento ◄── documentos (PDF escaneado) ◄── facturas_por_cobrar (datos para buscar)
```
| Decisión | Por qué |
|---|---|
| `UUID` como id | No se puede adivinar el id de otra factura |
| `NUMERIC(14,2)` para dinero | Los flotantes redondean mal (`0.1+0.2`) |
| RTN y número como texto | Ceros a la izquierda y guiones |
| `CHECK` de formato (número, CAI, RTN, mime, 20 MB) | Datos imposibles rechazados por la BD |
| `UNIQUE numero_factura` | Sin facturas duplicadas |
| Índices `lower(cliente_nombre)`, `lower(vendedor)`, RTN, fecha | Filtros rápidos |
| Sin detalle de productos | Vive en Odoo; el SGD guarda el PDF + datos de búsqueda |
| `referencia_odoo` opcional | Integración futura |

**Trampa:** dentro de `` `…` `` en JS, `\d` se convierte en `d` → usar `[0-9]`.

## 6. Contexto del negocio
- Las facturas salen de **Odoo**, pero el taller envía **copias impresas** → se suben **escaneadas** (imágenes).
- Llenar campos automáticamente requeriría **OCR** → mejora futura.
- Estados (pendiente/pagada/…) → se definirán después con una nueva migración.
