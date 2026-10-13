import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrearTipoDocumentoDto } from './dto/crear-tipo-documento.dto';
import { TipoDocumento } from './tipo-documento.entity';

@Injectable()
export class TiposDocumentoService {
  constructor(
    @InjectRepository(TipoDocumento)
    private readonly repositorio: Repository<TipoDocumento>,
  ) {}

  listar(): Promise<TipoDocumento[]> {
    return this.repositorio.find({ order: { codigo: 'ASC' } });
  }

  async obtener(id: number): Promise<TipoDocumento> {
    const tipo = await this.repositorio.findOneBy({ id });
    if (!tipo) {
      throw new NotFoundException(`No existe el tipo de documento ${id}`);
    }
    return tipo;
  }

  async crear(datos: CrearTipoDocumentoDto): Promise<TipoDocumento> {
    const codigo = datos.codigo.toUpperCase();

    const yaExiste = await this.repositorio.existsBy({ codigo });
    if (yaExiste) {
      throw new ConflictException(
        `Ya existe un tipo de documento con el código ${codigo}`,
      );
    }

    const nuevo = this.repositorio.create({
      codigo,
      nombre: datos.nombre.trim(),
    });
    return this.repositorio.save(nuevo);
  }
}
