# 12 — Subida de facturas: archivo + datos (Lección 8, partes A–D)

## 1. El recorrido de una subida
```
curl -F (multipart)
  → FileInterceptor      archivo en memoria, corta si > 20 MB (413)
  → ValidationPipe       valida los campos de texto con el DTO (400)
  → Servicio
      ¿firma de bytes = PDF/PNG/JPEG?           (400)
      ¿vencimiento ≥ emisión?                   (400)
      ¿número o SHA-256 repetido?               (409)
      TRANSACCIÓN { INSERT documento → INSERT factura → subir al bucket }
  → 201 + JSON (sin objectKey ni sha256)
```

## 2. Entidades
| Concepto | Ejemplo / regla |
|---|---|
| UUID | `@PrimaryGeneratedColumn('uuid') id!: string` |
| Dinero | `type: 'numeric'` → **`string`** en TS (`0.1+0.2` falla con number) |
| Fecha sin hora | `type: 'date'` → **`string`** `"2026-10-15"` (evita corrimiento por zona horaria) |
| Opcional | `type: 'varchar', nullable: true` → `string \| null` |
| Borrado lógico | `@DeleteDateColumn` → `find()` ignora lo eliminado; `softDelete()` = UPDATE |
| Relación | `@OneToOne(() => Documento) @JoinColumn({ name: 'documento_id' })` + columna `documentoId` |

⚠ Un espacio dentro de `name: 'mime_type '` = otra columna → `column "mime_type " does not exist`.

## 3. DTO para multipart
- Todo llega como **texto**.
- `@Transform` limpia antes de validar (`trim`, `toUpperCase` del CAI).
- `@IsDecimal({ decimal_digits: '0,2' })` valida dinero sin convertirlo a número.
- Reglas entre dos campos (fechas) → en el servicio.

## 4. Seguridad del archivo
| Riesgo | Defensa |
|---|---|
| `virus.exe` renombrado a `.pdf` | Firma de bytes: PDF empieza con `%PDF-` |
| Archivo enorme | `limits: { fileSize, files: 1, fields: 20 }` + CHECK en BD |
| Nombre malicioso (`../../x.pdf`) | La ruta usa UUID: `FAC/2026/10/<uuid>.pdf`; el nombre original solo se guarda |
| Mismo escaneo dos veces | Huella `SHA-256` (`node:crypto`) |
| Dos subidas simultáneas | `UNIQUE` en BD → código `23505` → 409 |
| Enlace compartido | URL firmada que expira en 5 min |

## 5. Transacción: el archivo va al final
| Falla en… | Resultado |
|---|---|
| Un INSERT | ROLLBACK, nada guardado |
| Subir al bucket | ROLLBACK de las filas |
| COMMIT (raro) | Archivo huérfano sin fila → limpieza futura con admin |
Lo único que no se puede deshacer (subir, porque `docs-app` no borra) se hace último.

## 6. Leer un error 500
- Afuera: `{"statusCode":500,"message":"Internal server error"}` (a propósito).
- Terminal 1: `ERROR [ExceptionsHandler]` + `query:` (SQL exacto) + `parameters:` (valores).
- Ahí estaban `"tipo_documento_id "` y `'applicattion/pdf'`.

## 7. PowerShell y curl
| Síntoma | Causa |
|---|---|
| `curl: (26)` | No encuentra el archivo local (ruta, carpeta actual o nombre con espacio) |
| `curl: (7)` / `Unable to connect` | La app no corre → Terminal 1 solo para `start:dev` |
| `-F is not recognized` | Se ejecutó una línea suelta del comando |
| `output stream already redirected` | Se pegó `PS ...>` o `>>` de la terminal |
| `numeric string is expected` | Se escribió `ID` literal en vez del número |
- `-i` muestra el código HTTP; `-s` oculta errores.
- Comando en una línea = menos errores al copiar.
- `muestras/` en `.gitignore`; comprobar con `git check-ignore -v`.
