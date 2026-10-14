# 10 — CRUD con entidades, DTOs y validación (Lección 5, partes A y B)

## 1. Las 4 piezas de un módulo de negocio
```
tipos-documento/
├─ tipo-documento.entity.ts        la tabla como clase (singular)
├─ dto/crear-tipo-documento.dto.ts  qué datos acepta crear
├─ tipos-documento.service.ts      la lógica (plural)
├─ tipos-documento.controller.ts   las rutas (plural)
└─ tipos-documento.module.ts       une todo + TypeOrmModule.forFeature([Entidad])
```
Registrar el módulo en `app.module.ts` → `imports: [...]` (si no, **404**).

## 2. Entidad (como Entity Framework)
```ts
@Entity('tipos_documento')
export class TipoDocumento {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ length: 20, unique: true }) codigo!: string;
  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' }) creadoEn!: Date;
}
```
- `name:` une `camelCase` (TS) con `snake_case` (SQL).
- `!` = "lo llena TypeORM, no yo".
- Con `synchronize: false` la entidad **describe** la tabla, no la crea.

## 3. Repositorio (como DbSet)
| Método | SQL equivalente |
|---|---|
| `find({ order: { codigo: 'ASC' } })` | `SELECT … ORDER BY codigo` |
| `findOneBy({ id })` | `SELECT … WHERE id = $1` (o `null`) |
| `existsBy({ codigo })` | `SELECT EXISTS(…)` |
| `create({...})` + `save()` | `INSERT … RETURNING *` |
TypeORM siempre usa **parámetros** → sin inyección SQL.

## 4. DTO + ValidationPipe
```ts
export class CrearTipoDocumentoDto {
  @IsString() @Length(2, 20) @Matches(/^[A-Za-z0-9_-]+$/) codigo!: string;
  @IsString() @Length(2, 100) nombre!: string;
}
```
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
```
- El DTO **no** incluye `id`, `activo`, `creadoEn`: los decide el sistema.
- `forbidNonWhitelisted` rechaza campos extra (`"activo": false`, `"esAdmin": true`).
- `ParseIntPipe` en `@Param('id')` rechaza `/tipos-documento/abc`.
- **Nunca confíes en lo que llega**; la BD también debe tener reglas (defensa en profundidad → migraciones).

## 5. Códigos HTTP
| Código | Cuándo | Excepción en Nest |
|---|---|---|
| 200 / 201 | OK / creado | — |
| 400 | Datos inválidos | `ValidationPipe`, `ParseIntPipe` |
| 404 | No existe | `NotFoundException` |
| 409 | Duplicado | `ConflictException` |
| 503 | Servicio caído | `ServiceUnavailableException` |

## 6. Probar con PowerShell
```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/tipos-documento -ContentType 'application/json' -Body '{"codigo":"orc","nombre":"Orden de compra"}'
try { ... } catch { $_.ErrorDetails.Message }   # ver el mensaje de error de la API
```

## 7. Lecciones de depuración de hoy
| Síntoma | Causa |
|---|---|
| `has no exported member 'X'. Did you mean 'Y'?` | Nombres distintos entre archivos → usar `Ctrl+Espacio` / `F2` |
| 404 en ruta nueva | Módulo no registrado en `AppModule` (revisar `Mapped {...}`) |
| Validación "no funciona" | Respondía una **copia vieja** de la app → `Get-Process node \| Stop-Process` y arrancar una sola |
| `refused to connect` | La app no corre; Terminal 1 solo para `start:dev`, Terminal 2 para comandos |
| Datos malos guardados | `docs_app` no puede `DELETE` → lo corrige `docs_admin` a mano |
