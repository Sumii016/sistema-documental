# 07 — Cómo viaja el dato (Lección 3)

Hay **dos momentos** distintos: el **arranque** (pasa una sola vez) y cada **petición** (pasa cada vez que abres `/db`).

## 1. Arranque: la app prepara la conexión (una sola vez)

```mermaid
flowchart TD
    A["backend/.env<br/>DB_NAME, DB_USER,<br/>DB_PASSWORD_FILE=../secrets/..."] --> B["leer-secreto.ts<br/>abre el archivo y lee la contraseña"]
    S[("secrets/postgres_password.txt")] --> B
    A --> C["configuracion.ts<br/>arma el objeto { app, db }"]
    B --> C
    C --> D["app.module.ts<br/>ConfigModule.forRoot()"]
    D --> E["database.module.ts<br/>TypeOrmModule.forRootAsync()<br/>pide host, puerto, nombre, usuario, password"]
    E --> F[("PostgreSQL en Docker<br/>127.0.0.1:5432")]
    F -- "conexión lista ✅" --> G["main.ts<br/>app.listen(3000, 127.0.0.1)"]
```

- Si falta un secreto, el flujo se corta en **leer-secreto.ts** y la app no arranca.
- La contraseña viaja de `secrets/` a la conexión **sin aparecer nunca en el código**.

## 2. Petición: abrir `http://127.0.0.1:3000/db`

```mermaid
sequenceDiagram
    autonumber
    participant N as Navegador
    participant C as AppController<br/>(mesero)
    participant S as AppService<br/>(cocinero)
    participant T as TypeORM<br/>(DataSource)
    participant P as PostgreSQL

    N->>C: GET /db
    C->>S: verificarBaseDeDatos()
    S->>T: query("SELECT current_database() ...")
    T->>P: SQL por la conexión ya abierta
    P-->>T: fila { bd: "sistema_documental", total: "3" }
    T-->>S: [ fila ]
    S-->>S: Number("3") → 3
    S-->>C: { baseDeDatos, tiposDocumento: 3 }
    C-->>N: JSON {"baseDeDatos":"sistema_documental","tiposDocumento":3}
```

## 3. Si algo falla en la petición

```mermaid
flowchart LR
    E["Error en SQL<br/>ej. function database() does not exist"] --> T["Terminal<br/>ERROR [ExceptionsHandler] detalle completo"]
    E --> N["Navegador<br/>{statusCode: 500, Internal server error}"]
```
El **detalle** se queda en el servidor (para ti); el usuario solo ve un mensaje genérico (seguridad).

## Quién hace qué
| Pieza | Responsabilidad | Analogía |
|---|---|---|
| Controlador | Recibe la ruta y responde | Mesero |
| Servicio | Hace el trabajo (consulta) | Cocinero |
| TypeORM / DataSource | Traduce y envía el SQL | Intérprete |
| PostgreSQL | Guarda y devuelve los datos | Bodega |
