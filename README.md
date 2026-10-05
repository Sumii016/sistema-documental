# 📁 Sistema Documental

Sistema para guardar, buscar y consultar documentos digitalizados (facturas, contratos, actas…).

**Estado:** Fase 1 lista ✅ — la infraestructura funciona. Próximo paso: el backend.

---

## ¿Qué hay aquí?

| Servicio | Para qué sirve | Dirección |
|---|---|---|
| **PostgreSQL** | Guarda los *datos* de cada documento (nombre, tipo, fecha…) | `localhost:5432` |
| **Redis** | Memoria rápida para no consultar la base de datos a cada rato | `localhost:6379` |
| **Almacenamiento (S3)** | Guarda los *archivos* (PDF, imágenes) | http://localhost:9001 |
| **Portainer** *(opcional)* | Panel para ver los contenedores | https://localhost:9443 |

Todo corre en **Docker** y solo se puede abrir desde tu propia computadora.

---

## 🔒 Regla de oro: las contraseñas nunca van en el código

- Las contraseñas se **generan solas** con un script y se guardan en la carpeta `secrets/`.
- Esa carpeta y el archivo `.env` **nunca se suben a GitHub** (están en `.gitignore`).
- Si clonas este proyecto en otra computadora, generas contraseñas nuevas ahí.

---

## 🚀 Cómo levantarlo (Windows / PowerShell)

Necesitas **Docker Desktop** abierto.

**1. Entra a la carpeta del proyecto**
```powershell
cd "C:\ruta\a\sistema-documental"
```

**2. Crea tu archivo de configuración**
```powershell
copy .env.example .env
```

**3. Genera las contraseñas**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generar-secretos.ps1
```

**4. Enciende todo**
```powershell
docker compose up -d
docker compose ps
```
Listo cuando `db` y `redis` dicen **healthy**.

---

## ✅ Cómo comprobar que funciona

**Base de datos** — debe mostrar las tablas `documentos` y `tipos_documento`:
```powershell
docker compose exec db psql -U docs_admin -d sistema_documental -c "\dt"
```

**Redis** — debe responder `PONG`:
```powershell
docker compose exec redis sh -c 'redis-cli -a $(cat /run/secrets/redis_password) --no-auth-warning ping'
```

**Almacenamiento** — abre http://localhost:9001 y entra con:
```powershell
type secrets\minio_root_user.txt
type secrets\minio_root_password.txt
```

---

## 🗄️ Configurar el almacenamiento (solo la primera vez)

1. **Crear el bucket:** *Buckets → Create Bucket* → nombre `documentos` → activar **Versioning**.
2. **Crear la política:** *Policies → Create Policy* → nombre `docs-app-policy` → pegar el contenido de `storage/politica-app.json`.
3. **Crear el usuario de la app:** *Identity → Users → Create User*
   - User Name: `docs-app`
   - Password: copiarla con `Get-Content secrets\storage_app_secret_key.txt | Set-Clipboard`
   - Política: **solo** `docs-app-policy`

> La aplicación usa `docs-app`, nunca el usuario administrador. Puede leer y subir archivos, pero **no borrarlos**.

---

## ⚙️ Backend (API en NestJS)

Necesitas **Node 20 o superior** y la infraestructura encendida.

```powershell
cd backend
copy .env.example .env
npm install
npm run start:dev
```
Prueba en el navegador: **http://127.0.0.1:3000/api/health**
Debe responder `{"estado":"ok","servicios":{"db":"ok","redis":"ok","storage":"ok"}}`

---

## 🧭 Portainer (opcional)

```powershell
docker compose --profile admin up -d
```
Abre https://localhost:9443 → usuario `admin` → contraseña en `secrets\portainer_admin_password.txt`.

> ⚠ Portainer controla todo Docker. Úsalo para **mirar**; los cambios se hacen en `docker-compose.yml`.

---

## 🛠️ Comandos útiles

| Quiero… | Comando |
|---|---|
| Ver qué está corriendo | `docker compose ps` |
| Ver errores de un servicio | `docker compose logs db` |
| Apagar todo | `docker compose down` |
| Borrar todo y empezar de cero ⚠ | `docker compose down -v` *(borra los datos)* |
| Copiar una contraseña sin verla | `Get-Content secrets\ARCHIVO.txt \| Set-Clipboard` |

---

## 📚 Para aprender más

- [`docs/01-arquitectura-y-secretos.md`](docs/01-arquitectura-y-secretos.md) — cómo encajan las piezas y por qué los secretos van aparte
- [`docs/02-portainer-y-docker-sock.md`](docs/02-portainer-y-docker-sock.md) — qué es Portainer y por qué hay que cuidarlo
- [`docs/03-login-microsoft-y-jwt.md`](docs/03-login-microsoft-y-jwt.md) — cómo funcionará el login con Microsoft
- [`docs/04-nestjs-estructura-y-configuracion.md`](docs/04-nestjs-estructura-y-configuracion.md) — cómo está organizado el backend

---

## 🗺️ Fases del proyecto

- [x] **Fase 1** — Infraestructura (Docker, base de datos, almacenamiento)
- [ ] **Fase 2** — Backend (API, inicio de sesión con JWT)
- [ ] **Fase 3** — Frontend (pantallas en React)
- [ ] **Fase 4** — Pruebas y puesta en producción
