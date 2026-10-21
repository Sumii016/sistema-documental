# 15 — Documentación con Swagger (Lección 10)

## 1. Qué es
Página generada desde el código (`/docs`) que lista las rutas y permite probarlas con formularios.
Formato estándar: **OpenAPI 3** (lo entienden Postman, generadores de clientes, etc.).

## 2. Activarlo solo en desarrollo
```ts
// configuracion.ts → app
swagger: process.env.SWAGGER_HABILITADO === 'true',   // falta o "false" → apagado

// main.ts
if (swaggerHabilitado) {
  const doc = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('...').build());
  SwaggerModule.setup('docs', app, doc);
}
```
- **Seguro por defecto**: si nadie configura la variable, `/docs` no existe (404).
- En http local, helmet sin `upgradeInsecureRequests` para que cargue la página.

## 3. Decoradores
| Dónde | Decorador | Para qué |
|---|---|---|
| Clase | `@ApiTags('Facturas por cobrar')` | Grupo |
| Clase | `@ApiExcludeController()` | Ocultar (rutas de prueba) |
| Método | `@ApiOperation({ summary, description })` | Título y explicación |
| Método | `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiBadRequestResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse`, `@ApiPayloadTooLargeResponse`, `@ApiTooManyRequestsResponse` | Respuestas posibles |
| Método | `@ApiConsumes('multipart/form-data')` + `@ApiBody({ type })` | Formulario con archivo |
| Campo DTO | `@ApiProperty` / `@ApiPropertyOptional` | example, description, minLength, pattern, enum, format: 'date', default |
| Campo DTO | `@ApiProperty({ type: 'string', format: 'binary' })` | Botón "Elegir archivo" |

⚠ **Solo documentan.** Valida `class-validator`; responde el servicio. Si cambias una regla, cámbiala en ambos lados.

## 4. Archivo en el formulario
```ts
export class SubirFacturaConArchivoDto extends SubirFacturaDto {   // herencia, como en C#
  @ApiProperty({ type: 'string', format: 'binary' }) archivo!: unknown;
}
```
Clase solo para documentar; el archivo real llega por `@UploadedFile()`.

## 5. Dependencias
| Situación | Qué hacer |
|---|---|
| `ERESOLVE` · `peer @nestjs/common@"^12"` | Instalar la versión que coincide: `npm install @nestjs/swagger@11` |
| Sugiere `--force` / `--legacy-peer-deps` | ❌ No: instala combinaciones rotas |
| `npm audit` | Revisar primero `npm audit --omit=dev` (lo que llega a producción) |
| Vulnerabilidad sin arreglo compatible | Evaluar si el atacante puede alcanzarla → aceptar y **anotar** en README |
| `install-scripts not yet covered` | No aprobar lo innecesario (ej. `@scarf/scarf` = telemetría) |

## 6. Pendientes anotados
- Borrar `GET /db` antes de producción (revela el nombre de la BD).
- `js-yaml` moderada vía Swagger 11 → se resuelve con NestJS 12.
- Ejemplos en la documentación: siempre **inventados**, nunca datos reales.
