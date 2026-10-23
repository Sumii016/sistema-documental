# 17 — Roles, administración de usuarios y auditoría (Lección 12)

## 1. Autenticación ≠ autorización
```
Petición → ThrottlerGuard → AutenticadoGuard → RolesGuard → Controlador
             429 abuso        401 ¿quién eres?   403 ¿puedes?
```
| Rol | Ver/descargar facturas | Subir facturas | Tipos de documento | Usuarios / auditoría |
|---|---|---|---|---|
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| CARGADOR | ✅ | ✅ | solo ver | ❌ |
| CONSULTA | ✅ | ❌ | solo ver | ❌ |

## 2. `@Roles()` + `RolesGuard`
```ts
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);   // ...rest = params de C#
@Roles('ADMIN')            // en un método o en toda la clase
```
- Sin `@Roles` → basta con sesión.
- Guards globales se ejecutan **en el orden de registro**.

## 3. Depuración: el `Roles` equivocado
- Síntoma: cargador creaba tipos (201). Código "correcto".
- Log temporal en el guard → `permitidos=undefined` → el controlador importaba **otro** `Roles` (autocompletado de VS Code).
- Lección: si el código parece bien y falla, **loguea lo que el código ve**; revisa **de dónde** importa VS Code.
- Los logs de depuración se borran al terminar.

## 4. Administración de usuarios (`/usuarios`, solo ADMIN)
| Regla | Cómo |
|---|---|
| Hash nunca en respuestas | `select: false` + releer con `obtener(id)` tras `save()` |
| Correo inmutable | No está en `ActualizarUsuarioDto` → `forbidNonWhitelisted` = 400 |
| No quitarse el propio acceso | `id === actual.id` + rol ≠ ADMIN o activo = false → 400 |
| Sin DELETE | Solo `activo: false` |
| Scripts | `usuario:crear` (pregunta rol, `valor is Rol`) · `usuario:cambiar-contrasena` (emergencias) |

## 5. Auditoría
- `creado_por` / `subido_por` = **correo de la sesión** (nunca del formulario → no se puede falsificar). Registros viejos quedan con `sistema`: no se reescribe la historia.
- Tabla `auditoria`: fecha, usuario, acción, entidad, id, `detalle` (JSONB), IP, `idPeticion`.
- `REVOKE UPDATE ON auditoria FROM docs_app` → `docs_app=ar` → **inmutable** (append-only). Probado: `permission denied`.
- Acciones: `LOGIN_OK`, `LOGIN_FALLIDO`, `LOGOUT`, `FACTURA_SUBIDA`, `FACTURA_DESCARGADA`, `USUARIO_CREADO`, `USUARIO_ACTUALIZADO`, `CONTRASENA_RESTABLECIDA`.
- **Nunca** contraseñas en la auditoría.
- Se registra desde los **controladores** con `@Contexto()` (usuario, IP, idPeticion); los servicios no saben de HTTP.
- `try/catch` en `registrar`: si falla, la acción sigue y queda error en el log.
- JSONB con TypeORM: `create()` + `save()` (insert() es muy estricto con tipos).

## 6. Cerrar sesiones de un usuario
```
sesion:<sid>                → datos de la sesión
sesiones-usuario:<id>       → SET de sids (SADD + EXPIRE en set/touch del almacén)
```
`SesionesService.cerrarTodas(id)`: `SMEMBERS` → `DEL sesion:...` → `DEL` índice.
Se llama al cambiar **rol**, **activo** o **contraseña** (no al cambiar solo el nombre).
`multi()…exec()` = varios comandos de Redis juntos.

## 7. Errores de esta lección
| Mensaje | Causa |
|---|---|
| Comando `crear-admin` pedía "Correo del usuario" | Código de otro script pegado en el archivo equivocado → revisar la **pestaña** antes de pegar |
| `Cannot find module './terminal'` | Copia suelta del script en `src/auth/` |
| `Unexpected token ':'` en PowerShell | Se pegó texto de `package.json` en la terminal |
| `await ... only allowed within async` | Falta `async` en el método |
| `TS1272 import type` | Interfaces en métodos con decoradores |
| `MAX_CONTRASEN` | Autocompletado agregó un nombre de más |
| Comando con comillas anidadas falla en PowerShell | Mandar SQL por tubería: `"SQL;" \| docker compose exec -T db sh -c '...'` |
| Archivos a medias | Si el mensaje dice "completo": **Ctrl+A y pegar** |
| Mayúscula/minúscula | `Usuario` = clase/tipo · `usuario` = variable |
