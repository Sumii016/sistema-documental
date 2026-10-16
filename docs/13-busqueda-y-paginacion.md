# 13 — Búsqueda con filtros y paginación (Lección 8, parte E)

## 1. La ruta
```
GET /facturas-por-cobrar?numero=000-001&cliente=taller&vendedor=maria&desde=2026-09-01&hasta=2026-09-30&pagina=1&porPagina=20
```
Respuesta:
```json
{ "datos": [ ... ], "total": 2, "pagina": 1, "porPagina": 20, "totalPaginas": 1 }
```

## 2. DTO de consulta (`@Query()`)
| Pieza | Para qué |
|---|---|
| `@IsOptional()` en todo | Ningún filtro es obligatorio |
| `@Type(() => Number)` | La URL siempre trae texto (`"2"`) → número antes de validar |
| `pagina = 1`, `porPagina = 20` | Valores por defecto |
| `@Max(100)` | Nadie pide un millón de filas de golpe |
| `forbidNonWhitelisted` | `?admin=true` → 400 `property admin should not exist` |

## 3. WHERE dinámico, siempre con parámetros
```ts
const where: FindOptionsWhere<FacturaPorCobrar> = {};
if (cliente) where.clienteNombre = ILike(`%${escaparLike(cliente)}%`);
if (desde && hasta) where.fechaEmision = Between(desde, hasta);
```
| TypeORM | SQL |
|---|---|
| `ILike('%x%')` | `ILIKE` (contiene, sin importar mayúsculas) |
| `ILike('x%')` | empieza con |
| `Between(a, b)` | `BETWEEN $1 AND $2` |
| `MoreThanOrEqual` / `LessThanOrEqual` | `>=` / `<=` |
| `skip` / `take` | `OFFSET` / `LIMIT` |
| `findAndCount` | datos de la página + total sin paginar |

Como en PHP armar el `WHERE` con `if`, pero **sin concatenar SQL**.

## 4. Comodines de LIKE
- `%` = cualquier texto, `_` = un carácter.
- Sin escape, `?cliente=%` devolvería **todo**.
- `escaparLike` → `texto.replace(/[\\%_]/g, '\\$&')` → se buscan como caracteres normales.
- No es inyección SQL (el valor sigue siendo parámetro), pero sí un resultado no pedido.

## 5. Orden estable
`order: { fechaEmision: 'DESC', numeroFactura: 'ASC' }` → con fechas iguales, el segundo campo desempata y las páginas no repiten ni saltan filas.

## 6. Probar con un solo PDF
```powershell
Copy-Item muestras/Factura_de_repuestos.pdf muestras/Factura_2.pdf
Add-Content muestras/Factura_2.pdf " "      # 1 byte distinto → otra huella SHA-256
Get-FileHash muestras/*.pdf
```
En PowerShell, URLs con `&` van **entre comillas**.
