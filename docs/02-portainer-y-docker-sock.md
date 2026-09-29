# 02 — Portainer y el socket de Docker

## ¿Qué es Portainer?
Un panel web para ver y manejar contenedores, volúmenes, redes y logs sin la terminal.
Es como phpMyAdmin, pero para Docker.

## ¿Cómo controla Docker?
Docker tiene un "motor" (daemon) que escucha órdenes en un archivo especial:
`/var/run/docker.sock`. La terminal (`docker ps`) y Portainer le hablan por ahí.

```
Tú → Portainer (https://localhost:9443) → docker.sock → motor de Docker → contenedores
```

## El riesgo: docker.sock = administrador del equipo
Quien accede al socket puede crear un contenedor que monte todo el disco del host.
Por eso, **si alguien entra a Portainer, controla la máquina completa**.

`:ro` (solo lectura) en el montaje **no protege**: la API del socket sigue aceptando órdenes.

## Cómo lo mitigamos

| Medida | Qué evita |
|---|---|
| Puerto en `127.0.0.1` | Que alguien de la red llegue al panel |
| Solo HTTPS (9443), sin 9000 ni 8000 | Contraseña viajando en texto plano / túnel Edge innecesario |
| Contraseña desde `secrets/` | Clave hardcodeada o creada a mano con prisa |
| Admin creado al arrancar | La ventana de 5 min en que cualquiera podría crear el admin |
| Perfil `admin` | Que el panel esté encendido cuando no lo usas |
| Sin red `backend` | Que Portainer vea directamente la BD o Redis |

## Perfiles de Compose
`profiles: [admin]` hace que el servicio solo arranque si lo pides:
- `docker compose up -d` → db, redis, storage
- `docker compose --profile admin up -d` → lo anterior + Portainer

## En producción
No exponer Portainer a internet. Si se necesita: detrás de VPN, con SSO/2FA,
o usar el **Portainer Agent** en el servidor y la consola en otra máquina.
