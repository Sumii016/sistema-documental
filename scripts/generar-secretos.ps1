# Genera contraseñas aleatorias en .\secrets\ (Windows PowerShell)
# No sobrescribe archivos existentes, para no romper una base de datos ya creada.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
New-Item -ItemType Directory -Force -Path "secrets" | Out-Null

function Nuevo-Secreto([int]$largo = 40) {
    $chars = [char[]]"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
    $bytes = New-Object byte[] $largo
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

function Generar([string]$nombre, [string]$valor = $null) {
    $archivo = "secrets\$nombre.txt"
    if (Test-Path $archivo) { Write-Host "Ya existe $archivo (no se sobrescribe)"; return }
    if (-not $valor) { $valor = Nuevo-Secreto }
    # Sin salto de línea final: Docker lee el archivo tal cual
    [System.IO.File]::WriteAllText((Join-Path (Get-Location) $archivo), $valor)
    Write-Host "Creado $archivo"
}

Generar "postgres_password"
Generar "redis_password"
Generar "minio_root_password"
Generar "portainer_admin_password"
# Credenciales de la aplicación para el almacenamiento (permisos solo sobre el bucket)
Generar "storage_app_access_key" "docs-app"
Generar "storage_app_secret_key"
Generar "minio_root_user" "storage-admin"
