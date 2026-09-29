# 01 — Arquitectura del sistema documental y manejo de secretos

## 1. Las piezas y qué hace cada una

| Pieza | Rol | Analogía con tu proyecto PHP |
|---|---|---|
| **React + Shadcn** | Interfaz en el navegador | Tus `.html` + `.js` |
| **NestJS** | Backend principal: login, reglas de negocio, subir/bajar archivos | Tus `.php` |
| **FastAPI** | CRUD de catálogos (tipos de documento, departamentos) | Otro `.php` separado solo para catálogos |
| **PostgreSQL** | Guarda los *datos* (metadatos) | MySQL + phpMyAdmin |
| **Almacenamiento S3** | Guarda los *archivos* (PDF, imágenes) | La carpeta `uploads/` |
| **Redis** | Caché en memoria: respuestas frecuentes sin ir a la BD | `$_SESSION`, pero compartido y rapidísimo |
| **Docker Compose** | Levanta todo con un comando | XAMPP, pero reproducible en cualquier máquina |

**Flujo al subir un documento:**
```
Navegador → NestJS (valida JWT) → guarda archivo en S3 con clave UUID
                               → guarda metadatos en PostgreSQL
```

## 2. ¿Por qué archivos en S3 y no en la BD?
- La BD se vuelve enorme y lenta si guarda binarios.
- S3 escala solo, tiene versionado y URLs temporales de descarga (*presigned URLs*).
- La BD guarda solo `object_key` (la "dirección" del archivo).

## 3. ¿Por qué el archivo se llama con UUID?
`FAC/2026/09/3f2a9c...pdf` en vez de `factura cliente final (2).pdf`
- Sin colisiones ni caracteres raros.
- El nombre del usuario no puede usarse para atacar rutas (`../../etc`).
- El nombre "humano" queda en `nombre_original`.

## 4. Secretos: las 3 capas

| Capa | Qué va | ¿Se sube a Git? |
|---|---|---|
| Código / `docker-compose.yml` | Nada sensible; solo *referencias* a secretos | ✅ Sí |
| `.env` | Config no sensible (puertos, nombres) | ❌ No (se sube `.env.example`) |
| `secrets/*.txt` | Contraseñas generadas aleatoriamente | ❌ Nunca |

**Docker secrets:** el archivo se monta en `/run/secrets/<nombre>` dentro del contenedor. Las imágenes que soportan variables `*_FILE` (Postgres, MinIO) leen la contraseña de ahí.

**¿Por qué mejor que variable de entorno?** Las variables aparecen en `docker inspect`, en logs de error y se heredan a procesos hijos. Un archivo montado no.

**En producción:** los `.txt` se reemplazan por un gestor de secretos (Vault, Azure Key Vault, AWS Secrets Manager). El código no cambia: sigue leyendo un archivo o variable.

## 5. Mínimo privilegio
- El usuario root de S3 **no** lo usa la app; crearemos uno limitado al bucket.
- Puertos atados a `127.0.0.1`: accesibles solo desde tu PC, no desde la red.

## 6. Ajustes al plan original (y por qué)

| Plan original | Ajuste | Motivo |
|---|---|---|
| Tokens en `localStorage` | Cookie `httpOnly` + `Secure` + `SameSite` | Un script malicioso (XSS) puede leer `localStorage`; una cookie `httpOnly` no |
| Imagen oficial de MinIO | Fork comunitario o alternativa S3 | MinIO dejó de publicar imágenes y archivó su repo en 2026 |
| Dos backends (NestJS + FastAPI) | Evaluar si FastAPI aporta algo | Dos lenguajes = el doble de dependencias, pruebas y despliegues |
| OAuth2 "genérico" | Definir el proveedor (Keycloak, Entra ID…) | OAuth necesita un servidor que emita los JWT |
