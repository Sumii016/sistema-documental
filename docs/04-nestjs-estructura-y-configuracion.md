# 04 — NestJS: estructura, inyección de dependencias y configuración segura

## 1. Si sabes C#/ASP.NET, ya conoces la mitad

| NestJS | ASP.NET (C#) | Para qué |
|---|---|---|
| `@Controller('health')` | `[Route("health")]` en un `Controller` | Recibe peticiones HTTP |
| `@Get()` | `[HttpGet]` | Define el verbo y la ruta |
| `@Injectable()` servicio | Clase registrada en `builder.Services` | Lógica de negocio |
| Constructor con parámetros | Constructor con parámetros | **Inyección de dependencias** |
| `@Module({...})` | `Program.cs` / extensiones de servicios | Agrupa y registra piezas |
| DTO + `class-validator` | Modelo + `[Required]`, `[MaxLength]` | Valida lo que llega |

Los `@Algo` se llaman **decoradores**: son el equivalente de los *atributos* de C#.

## 2. Las 3 piezas

```
Módulo  →  agrupa una funcionalidad (ej. catálogos)
  ├─ Controlador  →  recibe la petición y responde (delgado, sin lógica)
  └─ Servicio     →  hace el trabajo (consultar BD, subir archivos…)
```
Regla: **el controlador no habla con la BD**; le pide al servicio.

## 3. Inyección de dependencias (DI) en una frase
Tú no haces `new StorageService()`: lo **pides en el constructor** y NestJS te lo entrega ya configurado.
Ventaja: una sola instancia compartida, y en las pruebas puedes darle una versión falsa.

## 4. Estructura del backend

```
backend/src/
├─ main.ts               arranque: helmet, validación, prefijo /api
├─ app.module.ts         enchufa todos los módulos
├─ config/
│   ├─ leer-secreto.ts   lee contraseñas desde archivos (*_FILE)
│   └─ configuracion.ts  junta y valida toda la config al arrancar
├─ database/             conexión a PostgreSQL (TypeORM)
├─ redis/                cliente de Redis
├─ storage/              cliente S3 con el usuario docs-app
└─ health/               GET /api/health → ¿llego a todo?
```

## 5. El patrón `*_FILE` para secretos

```
backend/.env                       →  DB_PASSWORD_FILE=../secrets/postgres_password.txt
en Docker (más adelante)           →  DB_PASSWORD_FILE=/run/secrets/postgres_password
```
- El `.env` dice **dónde** está el secreto, nunca **cuál** es.
- Mismo código en tu PC y en producción; solo cambia la ruta.
- Si falta algo, la app **no arranca** y te dice qué falta (sin mostrar el valor).

## 6. Decisiones de seguridad del esqueleto

| Decisión | Por qué |
|---|---|
| `synchronize: false` | TypeORM no puede cambiar tablas solo; los cambios van por migraciones |
| `helmet()` | Agrega cabeceras HTTP de seguridad |
| `ValidationPipe({ whitelist, forbidNonWhitelisted })` | Rechaza campos que no esperamos (evita inyectar datos extra) |
| Escucha en `127.0.0.1` | Solo accesible desde tu PC |
| `/health` responde solo "ok"/"error" | No revela detalles internos a quien pregunte |
| S3 con `docs-app` | Mínimo privilegio: no puede borrar archivos |

## 7. Pendiente (bloque 2)
La app aún se conecta a Postgres con `docs_admin` (superusuario). En el bloque 2 crearemos
un usuario de BD propio para la app, con permisos solo sobre sus tablas.
