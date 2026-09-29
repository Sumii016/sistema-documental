# Sistema Documental

Fase actual: **1 — Infraestructura base** (PostgreSQL, Redis, almacenamiento S3).

## Requisitos
- Docker Desktop (o Docker Engine + Compose v2)
- Git Bash o PowerShell en Windows

## Arranque

```bash
# 1. Configuración no sensible
cp .env.example .env

# 2. Contraseñas aleatorias (elige uno)
./scripts/generar-secretos.sh          # Linux / macOS / Git Bash
.\scripts\generar-secretos.ps1         # PowerShell

# 3. Levantar
docker compose up -d
docker compose ps                      # db y redis deben decir "healthy"
```

## Verificar

| Servicio | Cómo probar |
|---|---|
| PostgreSQL | `docker compose exec db psql -U docs_admin -d sistema_documental -c "\dt"` → debe listar `documentos` y `tipos_documento` |
| Redis | `docker compose exec redis sh -c 'redis-cli -a $(cat /run/secrets/redis_password) --no-auth-warning ping'` → `PONG` (sin comillas internas: PowerShell 5 las rompe) |
| Almacenamiento | Abrir http://localhost:9001, entrar con los valores de `secrets/minio_root_user.txt` y `secrets/minio_root_password.txt`, crear el bucket `documentos` |

## Portainer (opcional, administración visual)

```bash
docker compose --profile admin up -d
```
Abrir **https://localhost:9443** (acepta el aviso del certificado autofirmado).
Usuario: `admin` · Contraseña: `secrets/portainer_admin_password.txt`

Para apagarlo sin tocar lo demás: `docker compose stop portainer`

> Si ya habías levantado todo antes, vuelve a correr el script de secretos:
> solo crea el archivo que falta, no cambia las contraseñas existentes.

## Reglas de seguridad del proyecto
- Ninguna contraseña en código, `docker-compose.yml` ni `.env`: todas en `secrets/` (ignorado por git).
- Los puertos solo escuchan en `127.0.0.1`; nada queda expuesto a la red.
- Las credenciales root del almacenamiento son solo para administrar. La app usará un usuario propio con permisos limitados al bucket (Fase 2).

## Reiniciar desde cero
```bash
docker compose down -v   # ⚠ borra volúmenes: datos y archivos
```
