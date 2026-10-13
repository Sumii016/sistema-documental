# 06 — Configuración y secretos en NestJS (Lección 2)

## La idea en una línea
El código **no sabe** las contraseñas: el `.env` dice **dónde** están y la app las lee al arrancar.

## Cómo fluye
```
backend/.env                     DB_PASSWORD_FILE=../secrets/postgres_password.txt
      │
      ▼
leer-secreto.ts                  abre el archivo → devuelve la contraseña (sin imprimirla)
      │
      ▼
configuracion.ts                 { app: {host, puerto}, db: {..., password} }
      │
      ▼
app.module.ts                    ConfigModule.forRoot({ isGlobal: true, load: [configuracion] })
      │
      ▼
main.ts                          config.getOrThrow('app.puerto') → app.listen(puerto, host)
```

## Archivos y su papel
| Archivo | Rol | ¿Va a Git? |
|---|---|---|
| `.env.example` | Plantilla con los nombres de las variables | ✅ Sí |
| `.env` | Tu copia local | ❌ Nunca |
| `secrets/*.txt` | Las contraseñas reales | ❌ Nunca |
| `src/config/leer-secreto.ts` | Lee un secreto desde archivo | ✅ |
| `src/config/configuracion.ts` | Junta toda la config en un objeto | ✅ |

## Conceptos nuevos
| Concepto | Qué es | En C# / PHP |
|---|---|---|
| `process.env.X` | Lee una variable de entorno | `Environment.GetEnvironmentVariable` / `getenv()` |
| `readFileSync` | Lee un archivo | `File.ReadAllText` / `file_get_contents()` |
| `.trim()` | Quita espacios y saltos de línea | `.Trim()` / `trim()` |
| `() => ({ ... })` | Función flecha que devuelve un objeto | Lambda `() => new { ... }` |
| `getOrThrow<T>()` | "Dámelo o detén la app" | `GetRequiredSection` |
| `` `Hola ${x}` `` | Texto con variables | `$"Hola {x}"` / `"Hola $x"` |
| `.catch(...)` | Atrapa errores de una tarea async | `try/catch` con `await` |

## Reglas de seguridad aplicadas
1. **Fallar al inicio:** si falta un secreto, la app no arranca (mejor que fallar a mitad de una petición).
2. **Errores sin secretos:** los mensajes muestran la ruta o la variable, nunca el valor.
3. **Escuchar en `127.0.0.1`:** la API solo acepta conexiones de tu PC.
4. **Nada hardcodeado:** ni el puerto ni las claves están escritos en el código.

## Errores que aprendimos a leer
| Mensaje | Causa |
|---|---|
| `Delete ␍ prettier/prettier` | Saltos de línea de Windows → `"endOfLine": "auto"` en `.prettierrc` |
| `EADDRINUSE ... :3000` | La app ya corre en otra terminal |
| `No se pudo leer el secreto en ...` | Ruta del secreto incorrecta |
| `Falta la variable ... en el .env` | La variable no existe o está comentada |
