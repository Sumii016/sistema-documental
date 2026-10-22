# 16 — Usuarios, contraseñas y sesiones (Lección 11)

## 1. El diseño (preparado para Microsoft)
```
Hoy:      [Login local: correo + contraseña] ──┐
                                               ├──► sesión en Redis + cookie httpOnly ──► guards / roles
Después:  [Login Microsoft (Entra ID)] ────────┘
```
Todo lo de la derecha no cambia cuando llegue Microsoft.

## 2. Tabla `usuarios`
| Columna / regla | Por qué |
|---|---|
| `correo` en minúsculas (CHECK) + UNIQUE | Una persona, una cuenta |
| `rol` CHECK ADMIN/CARGADOR/CONSULTA | Valores imposibles rechazados por la BD |
| `password_hash` NULL permitido | Usuarios de Microsoft no tendrán contraseña local |
| `activo` | Desactivar, **nunca borrar** (auditoría) |
| `select: false` en la entidad | El hash nunca sale en un `find()` ni en un JSON |
```ts
export const ROLES = ['ADMIN', 'CARGADOR', 'CONSULTA'] as const;
export type Rol = (typeof ROLES)[number];   // 'ADMIN' | 'CARGADOR' | 'CONSULTA'
```

## 3. Contraseñas
- Se guarda un **hash** (un solo sentido), nunca la contraseña. No se puede "ver", solo **restablecer**.
- **scrypt** (`node:crypto`, sin paquetes): lento y con mucha memoria a propósito. OWASP: N=2^17, r=8, p=1.
- **Sal** aleatoria → misma contraseña, hashes distintos.
- Formato `scrypt$N$r$p$sal$hash` → se pueden subir los parámetros después.
- `timingSafeEqual` → comparación en tiempo constante.
- 12–128 caracteres (mínimo solo al crear; máximo siempre).
- MD5/SHA-256 ❌ para contraseñas: demasiado rápidos.

## 4. Scripts de administración (con la app detenida)
| Comando | Qué hace |
|---|---|
| `npm run usuario:crear-admin` | Pide datos y contraseña oculta (2 veces); `ON CONFLICT DO NOTHING` |
| `npm run usuario:cambiar-contrasena` | `UPDATE` del hash; conserva id e historial |
Usan la conexión **admin** (`data-source.ts`). `preguntarOculto` compartido en `scripts/terminal.ts`.

## 5. Sesión
```
login OK → regenerate() (id nuevo) → req.session.usuario = {...} → Redis "sesion:<id>" (EX 8h)
navegador ← Set-Cookie: sgd.sid=<id firmado>; HttpOnly; SameSite=Lax; (Secure en prod)
```
| Opción | Por qué |
|---|---|
| Cookie solo con id | Datos del usuario quedan en el servidor |
| `HttpOnly` | `document.cookie` → `''`; JS no la roba |
| `SameSite=Lax` | Otro sitio no hace POST con tu sesión (CSRF) |
| `secure` según `COOKIE_SEGURA !== 'false'` | Seguro por defecto |
| `saveUninitialized: false` | Sin sesión para visitantes anónimos |
| `rolling: true` | 8 h desde la última actividad |
| `regenerate()` | Evita fijación de sesión |
| Secreto en `secrets/session_secret.txt` | Firma la cookie; nadie inventa ids |
| Almacén propio `AlmacenSesionesRedis extends Store` | get/set(EX)/destroy/touch con el ioredis existente |

## 6. Login seguro
- **Mismo mensaje** para correo inexistente, inactivo o contraseña mala → no revela qué correos existen.
- **Hash de relleno** → mismo tiempo de respuesta en todos los casos.
- `@Throttle` 5/min en `/auth/login`.
- El log registra la ruta, **nunca** el cuerpo → contraseñas fuera de los logs.

## 7. Guard global: cerrado por defecto
```ts
{ provide: APP_GUARD, useClass: ThrottlerGuard },   // 1º: contar
{ provide: APP_GUARD, useClass: AutenticadoGuard }, // 2º: ¿hay sesión?
```
- `@Publica()` (`SetMetadata`) en login, logout y `/health`; todo lo demás → 401.
- `Reflector.getAllAndOverride(clave, [método, clase])`.
- `@UsuarioActual()` → decorador de parámetro propio con el usuario de la sesión.

## 8. Errores de esta lección
| Mensaje | Causa |
|---|---|
| `Cannot find module dist/scripts/...js` | El `.ts` no existía en `src/scripts/` (creado en otra ventana/carpeta) |
| `Cannot find name 'process'` solo en el editor | Archivo abierto fuera del proyecto → abrir desde el explorador / Restart TS Server |
| `has no exported member 'Stores'` | Typo → `Store` |
| `TS1272 ... must be imported with 'import type'` | Tipos (interfaces) en métodos con decoradores |
| `Falta la variable SESSION_SECRET_FILE` | Estaba en `.env.example`, no en `.env` |
| Sin rutas `/auth/...` | Módulo sin registrar en `AppModule` |
| `Failed to fetch` en Swagger | La API no estaba corriendo |
| Cookie visible tras logout | Lista de DevTools sin refrescar; lo que importa: `/auth/yo` → 401 y sesión fuera de Redis |

⚠ Nunca pegar contraseñas en chats, tickets o commits → reemplazar por `***`.
