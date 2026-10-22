import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UsuarioSesion } from '../auth/sesion-usuario';
import { SesionesService } from '../auth/sesiones.service';
import { cifrarContrasena } from './contrasenas';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly sesiones: SesionesService,
  ) {}

  listar(): Promise<Usuario[]> {
    return this.usuarios.find({ order: { correo: 'ASC' } });
  }

  async obtener(id: string): Promise<Usuario> {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`No existe el usuario ${id}`);
    }
    return usuario;
  }

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    if (await this.usuarios.existsBy({ correo: dto.correo })) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
    const nuevo = this.usuarios.create({
      correo: dto.correo,
      nombre: dto.nombre,
      rol: dto.rol,
      passwordHash: await cifrarContrasena(dto.contrasena),
    });
    const { id } = await this.usuarios.save(nuevo);
    return this.obtener(id); // se vuelve a leer: asi la respuesta NO trae el hash
  }

  async actualizar(
    id: string,
    dto: ActualizarUsuarioDto,
    actual: UsuarioSesion,
  ): Promise<Usuario> {
    if (
      dto.nombre === undefined &&
      dto.rol === undefined &&
      dto.activo === undefined
    ) {
      throw new BadRequestException(
        'Envíe al menos un campo: nombre, rol o activo',
      );
    }
    if (
      id === actual.id &&
      ((dto.rol !== undefined && dto.rol !== 'ADMIN') || dto.activo === false)
    ) {
      throw new BadRequestException(
        'No puede quitarse su propio rol de administrador ni desactivarse',
      );
    }

    const usuario = await this.obtener(id);
    const cambiaAcceso =
      (dto.rol !== undefined && dto.rol !== usuario.rol) ||
      (dto.activo !== undefined && dto.activo !== usuario.activo);

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre;
    if (dto.rol !== undefined) usuario.rol = dto.rol;
    if (dto.activo !== undefined) usuario.activo = dto.activo;
    const guardado = await this.usuarios.save(usuario);

    // Si cambió su rol o su estado, sus sesiones abiertas ya no son válidas
    if (cambiaAcceso) {
      await this.sesiones.cerrarTodas(id);
    }
    return guardado;
  }

  async restablecerContrasena(id: string, contrasena: string): Promise<void> {
    await this.obtener(id); // 404 si no existe
    await this.usuarios.update(id, {
      passwordHash: await cifrarContrasena(contrasena),
    });
    // Si la contraseña se filtró, quien la usaba queda fuera de inmediato
    await this.sesiones.cerrarTodas(id);
  }
}
