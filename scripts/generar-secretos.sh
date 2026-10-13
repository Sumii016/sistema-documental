#!/usr/bin/env bash
# Genera contraseñas aleatorias en ./secrets/ (Linux, macOS o Git Bash en Windows)
# No sobrescribe archivos existentes, para no romper una base de datos ya creada.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p secrets

generar() {
  local archivo="secrets/$1.txt"
  if [ -f "$archivo" ]; then
    echo "Ya existe $archivo (no se sobrescribe)"
  else
    # printf sin salto de línea: Docker lee el archivo tal cual
    printf '%s' "$(openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-40)" > "$archivo"
    chmod 600 "$archivo"
    echo "Creado $archivo"
  fi
}

generar postgres_password
generar postgres_app_password
generar redis_password
generar minio_root_password
generar portainer_admin_password
# Credenciales de la aplicación para el almacenamiento (permisos solo sobre el bucket)
generar storage_app_secret_key
if [ ! -f secrets/storage_app_access_key.txt ]; then
  printf '%s' "docs-app" > secrets/storage_app_access_key.txt
  chmod 600 secrets/storage_app_access_key.txt
  echo "Creado secrets/storage_app_access_key.txt"
fi

# El usuario root de almacenamiento no es secreto crítico, pero tampoco va en el código
if [ ! -f secrets/minio_root_user.txt ]; then
  printf '%s' "storage-admin" > secrets/minio_root_user.txt
  chmod 600 secrets/minio_root_user.txt
  echo "Creado secrets/minio_root_user.txt"
fi
