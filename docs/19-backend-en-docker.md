# 19 — El backend en Docker (Lección 14)

## 1. Throttler en Redis
Contador en memoria → se reinicia con la API y cada copia cuenta por su lado.
`AlmacenThrottlerRedis implements ThrottlerStorage`:
| Redis | Para qué |
|---|---|
| `INCR` + `PTTL` (en `multi`) | Sumar 1 y ver cuánto le queda a la ventana |
| `PEXPIRE` | Poner la ventana (60 s) en la primera petición |
| `SET ... PX ... NX` | Bloqueo, solo si no existía |
Claves `limite:default:<hash ip+ruta>`. Se registra con `ThrottlerModule.forRootAsync({ inject: [REDIS], ... })`.
Probado: tras 6 logins fallidos y **reiniciar la API**, sigue en 429.

## 2. `src` vs `dist`
`src` = TypeScript que escribes (va a Git). `dist` = JavaScript compilado (no va a Git, no se edita, se puede borrar).

## 3. Dockerfile en 3 etapas
```
construccion  → npm ci + nest build          (tiene TypeScript, Jest…)
dependencias  → npm ci --omit=dev --ignore-scripts
final         → solo node_modules de prod + dist, USER node, HEALTHCHECK /health
```
- Imagen más pequeña y con menos superficie de ataque (≈ `dotnet publish`).
- `USER node`: nunca como root.
- `.dockerignore`: fuera `node_modules`, `dist`, `test`, `.env`.

## 4. Servicio `api` en docker-compose (perfil `app`)
```powershell
docker compose --profile app up -d --build
docker inspect --format '{{.State.Health.Status}}' sistema-documental-api-1
```
| Decisión | Por qué |
|---|---|
| Perfil `app` + puerto 3001 | La rutina diaria (`start:dev` en 3000) no cambia |
| `HOST=0.0.0.0` dentro | Para que Docker conecte el puerto; afuera solo `127.0.0.1:3001` |
| Hosts por nombre (`db`, `redis`, `storage`) | Red interna `backend` |
| Solo los secretos que necesita | Sin admin de BD ni root del almacenamiento |
| `read_only`, `tmpfs /tmp`, `no-new-privileges` | No puede modificar archivos ni ganar permisos |
| `COOKIE_SEGURA:-true`, `SWAGGER_HABILITADO:-false` | Seguro por defecto si nadie configura |

## 5. Dos direcciones del almacenamiento
| Variable | Quién la usa | En Docker |
|---|---|---|
| `STORAGE_ENDPOINT` | La API (subir, comprobar) | `http://storage:9000` |
| `STORAGE_PUBLIC_ENDPOINT` | El navegador (enlaces firmados) | `http://127.0.0.1:9000` |
La firma incluye la dirección → segundo `S3Client` solo para firmar.

## 6. Dos `.env` distintos
| Archivo | Lo lee | Contiene |
|---|---|---|
| `.env` (raíz) | Docker Compose | Puertos, imágenes, `API_PORT`, `COOKIE_SEGURA`, `SWAGGER_HABILITADO`, `FRONTEND_ORIGIN` |
| `backend/.env` | `npm run start:dev` | Hosts `127.0.0.1`, rutas `../secrets/...`, `E2E_*` |

## 7. El error que solo Docker reveló
`configuracion.ts` tenía `redis.host: process.env.DB_HOST` (copiar/pegar).
En la laptop todo vive en `127.0.0.1` → funcionaba por casualidad. En Docker: `ECONNREFUSED 172.18.0.2:6379` = **el contenedor de la BD**.
Diagnóstico: `docker network inspect sistema-documental_backend --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}'`.

## 8. Comprobación final
```powershell
$env:E2E_URL = "http://127.0.0.1:3001"; npm run test:e2e; Remove-Item Env:E2E_URL
```
Las mismas 13 pruebas E2E pasan contra el **contenedor**.

## 9. Errores de esta lección
| Mensaje | Causa |
|---|---|
| `path "./backend" not found` | Ya estabas en `backend` → usar `.` |
| `mapping key "image" already defined` | Sangría YAML: el bloque `api` cayó dentro de `storage` |
| `The "API_PORT" variable is not set` | Faltaba en el `.env` de la raíz |
| `syntax error ... expecting ")"` en `sh -c` | Comillas dobles dentro de `'...'` en PowerShell → quitarlas o usar tubería |
| `ECONNREFUSED 127.0.0.1:3000` en E2E | La API de desarrollo no estaba corriendo |
| `docker compose config --quiet` | Valida el YAML sin arrancar nada |

## Pendientes para producción
Fijar versión exacta de `pgsty/minio` (no `latest`) · https + `COOKIE_SEGURA=true` · `trust proxy` detrás de un proxy · respaldos · migraciones con un servicio aparte (usuario admin).
