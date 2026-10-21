import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cifrarContrasena, verificarContrasena } from '../usuarios/contrasenas';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuarioSesion } from './sesion-usuario';

@Injectable()
export class AuthService {
  // hash de relleno se usa cuando el correo no existe, para tardar lo mismo
  private readonly hashRelleno = cifrarContrasena(
    'relleno-para-igualar-tiempos',
  );

  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  async validar(correo: string, contrasena: string): Promise<UsuarioSesion> {
    const usuario = await this.usuarios.findOne({
      where: { correo },
      select: {
        id: true,
        correo: true,
        nombre: true,
        rol: true,
        activo: true,
        passwordHash: true,
      },
    });

    const puedeEntrar = !!usuario && usuario.activo && !!usuario.passwordHash;
    const hash = puedeEntrar ? usuario.passwordHash! : await this.hashRelleno;
    const correcta = await verificarContrasena(contrasena, hash);

    if (!puedeEntrar || !correcta) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    await this.usuarios.update(usuario.id, { ultimoAcceso: new Date() });
    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
  }
}
