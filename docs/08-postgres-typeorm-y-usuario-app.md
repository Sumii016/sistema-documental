# 08 — PostgreSQL con TypeORM y usuario de mínimo privilegio (Lección 3)

## 1. Conexión con TypeORM
TypeORM traduce entre clases TypeScript y tablas (como **Entity Framework** en C#).
`pg` es el **driver** que habla con PostgreSQL (como `mysqli` en PHP).

```ts
TypeOrmModule.forRootAsync({
  inject: [ConfigService],                      // necesita la configuración
  useFactory: (config) => ({                    // fábrica: arma las opciones
    type: 'postgres',
    host, port, database, username, password,   // todo desde .env + secrets/
    autoLoadEntities: true,                     // encuentra entidades solo
    synchronize: false,                         // ⚠ nunca true: no altera tablas solo
  }),
})
```
- La conexión se abre **una vez al arrancar** y se reutiliza en cada petición.
- Si falta `database`, el driver usa el **nombre del usuario** como base de datos.

## 2. Consultas
```ts
const [fila] = await this.dataSource.query('SELECT current_database() AS bd');
```
| Concepto | Qué es |
|---|---|
| `DataSource` | La conexión; se pide por inyección de dependencias |
| `async/await` | Esperar a la BD sin bloquear (como `async Task<T>`) |
| `const [fila] = lista` | Toma el primer elemento (`$filas[0]` en PHP) |
| `Number(fila.total)` | `COUNT(*)` llega como texto en Postgres |

**MySQL ≠ PostgreSQL:** `DATABASE()` → `current_database()`.

### ⚠ Inyección SQL
```ts
query(`... WHERE nombre = '${nombre}'`)        // ❌ nunca
query('... WHERE nombre = $1', [nombre])        // ✅ parámetro
```

## 3. Usuario de mínimo privilegio
| Usuario | Lo usa | Permisos |
|---|---|---|
| `docs_admin` | Tú (administración, scripts) | Todo |
| `docs_app` | La API | `SELECT`, `INSERT`, `UPDATE` — sin `DELETE`, `DROP`, `ALTER` |

- Sin `DELETE` porque usamos **borrado lógico** (`eliminado_en`).
- `ALTER DEFAULT PRIVILEGES` da los mismos permisos a tablas futuras.
- Script: `db/roles/01-usuario-app.sql`; la contraseña entra como variable `:'app_password'` leída **dentro** del contenedor (`$(cat /run/secrets/...)`), nunca en pantalla.

**Comprobado:**
```
DROP TABLE   → ERROR: must be owner of table
DELETE FROM  → ERROR: permission denied for table
```

## 4. Docker secrets: dos lugares, siempre
```yaml
services:
  db:
    secrets:
      - postgres_app_password          # ENTREGA al contenedor
secrets:
  postgres_app_password:
    file: ./secrets/postgres_app_password.txt   # CATÁLOGO: qué archivo
```
- Cada usuario, **su propio** archivo de secreto.
- Tras cambiar secretos: `docker compose up -d --force-recreate db`.
- Comparar archivos sin verlos: huella `SHA256` (`Get-FileHash` vs `sha256sum`).

## 5. Errores de esta lección
| Mensaje | Causa |
|---|---|
| `database "docs_admin" does not exist` | Faltaba `database` en las opciones |
| `function database() does not exist` | Sintaxis de MySQL en PostgreSQL |
| `500 Internal server error` | El detalle real está en la **terminal** |
| `password authentication failed` | El secreto montado ≠ el archivo que lee la API |
| `refers to undefined secret a - b` | Dos elementos YAML en una sola línea |
