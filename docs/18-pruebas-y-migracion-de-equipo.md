# 18 — Pruebas automáticas y montaje en otra computadora (Lección 13)

## 1. Tipos de prueba
| Tipo | Qué prueba | Comando | ¿App corriendo? |
|---|---|---|---|
| Unitaria (`src/**/*.spec.ts`) | Una pieza aislada, con mocks | `npm test` | No |
| E2E (`test/*.e2e-spec.ts`) | La API real por HTTP: login, cookies, roles | `npm run test:e2e` | **Sí** |
Las unitarias no detectan errores **de conexión entre piezas** (ej. el `Roles` importado de otra librería); las E2E sí.

## 2. Jest en 1 minuto (≈ xUnit)
```ts
describe('grupo', () => {
  it('qué debe pasar', async () => {
    const x = await algo();          // Preparar / Actuar
    expect(x).toBe(true);            // Comprobar
  });
});
```
`toBe`, `not.toContain`, `toHaveLength`, `toBeUndefined`, `toThrow(Excepcion)`, `.resolves.toBe(...)`.
Una prueba que nunca falla no sirve → **romper el código a propósito** y ver que falle.

## 3. Mocks
```ts
const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']) } as unknown as Reflector;
```
Objetos falsos que devuelven lo que queremos (≈ Moq en C#). Se prueba el guard sin levantar Nest.

## 4. Diseño que facilita probar
- Lógica **pura** (sin BD, sin framework) en su propio archivo → `facturas-por-cobrar/archivos.ts`.
- Importar el servicio en la prueba arrastraba TypeORM (ESM) → error de Jest.
- **Refactorizar** = reorganizar sin cambiar lo que hace; las pruebas dan la confianza.
- Se borró `AppController` (`/`, `/ping`, `/db`): `/db` revelaba la BD; `/health` lo reemplaza.

## 5. E2E contra la API real
- `class Cliente`: guarda la cookie `sgd.sid` (`getSetCookie()`) → cada `new Cliente()` = una ventana distinta.
- Usuarios temporales con `Date.now()` y contraseñas `randomBytes` → nadie las conoce; `afterAll` los **desactiva**.
- Admin de pruebas `e2e-admin@prueba.local`, contraseña en `secrets/e2e_admin_password.txt`.
- Variables con `node --env-file=.env` en el script (igual que las migraciones):
  `"test:e2e": "node --env-file=.env ./node_modules/jest/bin/jest.js --config ./test/jest-e2e.json"`
- Límite de login 5/min → esperar 1 minuto entre ejecuciones.

## 6. Montar el proyecto en otra computadora
| # | Paso |
|---|---|
| 1 | Git, GitHub Desktop, VS Code, **Node 24**, Docker Desktop |
| 2 | Clonar con GitHub Desktop |
| 3 | `npm ci` en `backend` (con la app **detenida**) |
| 4 | `scripts\generar-secretos.ps1` + `session_secret` + `e2e_admin_password` |
| 5 | `Copy-Item .env.example .env` (raíz y `backend`) — el `.env` no tiene secretos, solo rutas |
| 6 | `docker compose up -d` (Portainer: `--profile admin`) |
| 7 | Usuario `docs_app` (`db/roles/01-usuario-app.sql`) |
| 8 | Almacenamiento: bucket `documentos` + versionado + usuario `docs-app` + política de `storage/` |
| 9 | `npm run migracion:ejecutar` |
| 10 | `npm run usuario:crear` (admin + e2e-admin) |
| 11 | `npm run start:dev` → `/health` |
| 12 | `npm test` + `npm run test:e2e` |

## 7. Lo que reveló la migración ("en mi PC sí funciona")
| Problema | Causa | Arreglo |
|---|---|---|
| `Cannot find module 'express-session'` | Se instaló en la **raíz**; Node lo encontraba subiendo carpetas | Instalar en `backend`, borrar `package.json` de la raíz |
| Faltaban `E2E_*` | Solo estaban en `.env`, no en `.env.example` | Toda variable nueva va en **los dos** |
| Faltaba `session_secret` | El script de secretos no se actualizó | Agregarlo a `generar-secretos.ps1` / `.sh` |
| `nest` no se reconoce / faltan `@types` | `npm ci` con la app corriendo | Detener la app antes de instalar |
| `Read-Host` no guardó nada | Al pegar varias líneas, Read-Host toma la siguiente como respuesta | `Read-Host "..." \| Set-Content ...` en **una** línea |

## 8. Trabajar en dos computadoras
- Al empezar: **Fetch → Pull**. Al terminar: **Commit → Push**.
- Cada PC tiene sus propios secretos, `.env`, BD y usuarios.
- Antes de `npm install`: la terminal debe terminar en `...\backend>`.
