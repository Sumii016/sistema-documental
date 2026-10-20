# 14 — Seguridad general de la API (Lección 9)

## 1. El camino de una petición
```
Petición
 → registrarPeticiones (middleware)  crea idPeticion, mide tiempo
 → helmet                            cabeceras seguras
 → CORS                              ¿origen permitido?
 → ThrottlerGuard (guard)            ¿pasó el límite? → 429
 → FileInterceptor (interceptor)     ¿archivo > 20 MB? → 413
 → ValidationPipe (pipe)             ¿datos válidos? → 400
 → Controlador → Servicio
 → ErroresFilter (filtro)            atrapa cualquier error
```
Mientras más temprano se rechaza, menos recursos se gastan.

## 2. Helmet (cabeceras)
| Cabecera | Evita |
|---|---|
| `X-Content-Type-Options: nosniff` | Que el navegador ejecute algo que no es script |
| `X-Frame-Options: SAMEORIGIN` | Meter la página en un iframe ajeno |
| `Strict-Transport-Security` | Volver a http después de https |
| `Content-Security-Policy` | Cargar scripts de otros orígenes |
| Sin `X-Powered-By` | Anunciar la tecnología usada |

## 3. CORS
- Lista de **orígenes** (sitios web) a los que el navegador deja leer la API.
- `FRONTEND_ORIGIN` en `.env` (no es secreto) → `getOrThrow` si falta.
- `credentials: true` (cookie de sesión) ⇒ el origen **no puede ser `*`**.
- ⚠ Solo protege en navegadores: curl/Postman lo ignoran → no reemplaza al login.

## 4. Throttler (límite de peticiones)
```ts
ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }])   // imports
{ provide: APP_GUARD, useClass: ThrottlerGuard }                            // providers
@Throttle({ default: { limit: 10, ttl: 60_000 } })                          // subir factura
@SkipThrottle()                                                             // /health
```
- `ttl` en **milisegundos**. Respuesta **429** + `Retry-After`.
- El módulo **configura**; el guard **revisa**. Sin guard, no hay límite.
- Pendiente producción: contador en Redis (varios servidores) y `trust proxy`.

## 5. Registro y errores con idPeticion
| Pieza | Qué hace |
|---|---|
| Middleware | `randomUUID()` → cabecera `X-Request-Id`; al terminar registra método, ruta, código, ms, IP |
| `req.path` (no `req.url`) | Sin `?cliente=...` → sin datos personales en el log |
| Niveles | `log` 2xx · `warn` 4xx · `error` 5xx |
| `@Catch()` filtro | `HttpException` → se responde tal cual + `idPeticion`; otro error → stack solo en log, afuera mensaje genérico |
| No aceptar el ID del cliente | Evita texto falso en los logs |

## 6. Errores de esta lección
| Mensaje | Causa |
|---|---|
| `Configuration key "app.frontendOrigen" does not exist` | Falta en `.env` o fuera del grupo `app`; el `.env` solo se lee al **arrancar** |
| `${frontendOrigen}` literal en el log | Comillas simples en vez de **invertidas** |
| `',' expected` en `ThrottlerModule.forRoot` | Quedó dentro de las llaves de `ConfigModule.forRoot({})` |
| 105 × 200, sin `X-RateLimit-*` | Faltaba el guard en `providers` |
| `000` en curl | No encontró el archivo local (ruta relativa a la carpeta actual) |
| `Expression expected` en `(...)` | `...` copiado literal (era una abreviatura) |
