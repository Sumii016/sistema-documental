import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICA = 'esPublica';

// Marca una ruta (o un controlador completo) como accesible sin sesión
export const Publica = () => SetMetadata(ES_PUBLICA, true);
