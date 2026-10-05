# 03 — Login con Microsoft (Entra ID), JWT y el patrón BFF

## 1. Conceptos en una línea

| Término | Qué es |
|---|---|
| **Entra ID** | El "guardia" de Microsoft: donde viven las cuentas de la empresa |
| **OAuth 2.0** | Protocolo para *dar permiso* a una app sin darle tu contraseña |
| **OpenID Connect (OIDC)** | Capa sobre OAuth para saber *quién eres* (login) |
| **JWT** | El "gafete": un texto firmado con datos del usuario (`nombre`, `email`, `roles`, `exp`) |
| **App Registration** | El registro de *tu* sistema dentro de Entra; lo crea TI |
| **Client ID / Tenant ID** | Identificadores públicos de tu app y de la empresa (no son secretos) |
| **Client Secret** | Contraseña de *tu backend* ante Microsoft → va en `secrets/`, nunca en código |

## 2. Anatomía de un JWT
```
eyJhbGciOi...   .   eyJuYW1lIjoiTWljaGVsbGUi...   .   Xk3f9...
   header                 payload (datos)                firma
```
- Cualquiera puede **leer** el payload (es base64, no está cifrado) → nunca pongas datos sensibles.
- Nadie puede **modificarlo** sin romper la firma. Microsoft firma con su clave privada; tu backend verifica con la clave pública (JWKS).

**Qué debe validar SIEMPRE el backend:**
1. Firma (con las claves públicas de Microsoft)
2. `iss` → que lo emitió *tu* empresa
3. `aud` → que es para *tu* app (tu Client ID)
4. `exp` → que no ha expirado

## 3. Patrón BFF (Backend For Frontend) — el que usaremos

El token **nunca** llega al JavaScript del navegador.

```
 Navegador (React)         NestJS (BFF)                    Microsoft
      │  clic "Entrar"          │                              │
      │ ───────────────────────▶│ /auth/login                  │
      │ ◀── redirige ───────────│ (con PKCE + state)           │
      │ ─────────────── inicia sesión (y MFA) ────────────────▶│
      │ ◀──────────────── vuelve con un "code" ────────────────│
      │ ───────────────────────▶│ /auth/callback               │
      │                         │ ── code + client secret ────▶│
      │                         │ ◀─────── JWT (tokens) ───────│
      │                         │ valida JWT, guarda sesión     │
      │                         │ en Redis                      │
      │ ◀── cookie httpOnly ────│ (solo un ID aleatorio)        │
      │                         │                              │
      │ /api/documentos + cookie│                              │
      │ ───────────────────────▶│ busca sesión en Redis → OK   │
```

**¿Por qué así?**
- Si un script malicioso entra a la página (XSS), no puede robar el token: la cookie `httpOnly` es invisible para JavaScript.
- El `client secret` solo lo conoce el backend.
- Cerrar sesión = borrar la sesión de Redis (efecto inmediato).

## 4. Atributos de la cookie
| Atributo | Para qué |
|---|---|
| `HttpOnly` | JavaScript no puede leerla |
| `Secure` | Solo viaja por HTTPS |
| `SameSite=Lax` | Otros sitios no pueden usarla para hacer peticiones en tu nombre (CSRF) |

## 5. Roles
TI define **App Roles** en el registro (ej. `Lector`, `Editor`, `Admin`) y los asigna a usuarios o grupos.
Llegan dentro del JWT en el campo `roles`, y NestJS los usa para permitir o negar cada acción.
Ventaja: los permisos se administran en Microsoft, no en tu base de datos.
