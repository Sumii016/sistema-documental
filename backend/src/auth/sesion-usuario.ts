import 'express-session';
import type { Rol } from '../usuarios/usuario.entity';

export const NOMBRE_COOKIE = 'sgd.sid';

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
}

//le ensena a typescript que req.session.usuario existe
declare module 'express-session' {
  interface SessionData {
    usuario?: UsuarioSesion;
  }
}
