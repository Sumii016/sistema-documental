import { createHash, privateDecrypt, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Documento } from '../documentos/documento.entity';
import { StorageService } from '../storage/storage.service';
import { TipoDocumento } from '../tipos-documento/tipo-documento.entity';
import { BuscarFacturasDto } from './dto/buscar-facturas.dto';
import { SubirFacturaDto } from './dto/subir-factura.dto';
import { FacturaPorCobrar } from './factura-por-cobrar.entity';

//temporal: se reemplaza por el usuario real cuando el login de microsoft
const USUARIO_PROVISIONAL = 'sistema';

//los primeros bytes de cada formato ("numero magico")
const FIRMAS = [
  {
    mime: 'application/pdf',
    ext: 'pdf',
    bytes: [0x25, 0x50, 0x44, 0x46, 0x2d],
  }, //%PDF--
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
];

function detectarTipo(contenido: Buffer) {
  return FIRMAS.find((f) => f.bytes.every((b, i) => contenido[i] === b));
}

// En LIKE, % y _ son comodines; los "escapamos" para buscarlos como texto normal
function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class FacturasPorCobrarService {
  constructor(
    @InjectRepository(FacturaPorCobrar)
    private readonly facturas: Repository<FacturaPorCobrar>,
    @InjectRepository(Documento)
    private readonly documentos: Repository<Documento>,
    @InjectRepository(TipoDocumento)
    private readonly tipos: Repository<TipoDocumento>,
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
  ) {}

  async subir(
    archivo: Express.Multer.File | undefined,
    dto: SubirFacturaDto,
  ): Promise<FacturaPorCobrar> {
    // 1. Validar el archivo por su CONTENIDO, no por su nombre
    if (!archivo || archivo.size === 0) {
      throw new BadRequestException('Falta el archivo');
    }
    const tipo = detectarTipo(archivo.buffer);
    if (!tipo) {
      throw new BadRequestException('Solo se aceptan archivos PDF, PNG o JPEG');
    }

    // 2.regla entre 2 campos
    if (dto.fechaVencimiento < dto.fechaEmision) {
      throw new BadRequestException(
        'fechaVencimiento no puede ser anterior a fechaEmision',
      );
    }

    // 3.duplicados
    if (await this.facturas.existsBy({ numeroFactura: dto.numeroFactura })) {
      throw new ConflictException(`La factura ${dto.numeroFactura} ya existe`);
    }
    const sha256 = createHash('sha256').update(archivo.buffer).digest('hex');
    if (await this.documentos.existsBy({ sha256 })) {
      throw new ConflictException('Este archivo ya fue subido');
    }

    // 4.tipo de documento FAC
    const tipoFac = await this.tipos.findOneBy({ codigo: 'FAC', activo: true });
    if (!tipoFac) {
      throw new InternalServerErrorException(
        'Falta configurar el tipo de documento FAC',
      );
    }

    // 5.Ids y ubicacion del archivo: FAC/2026/10/<uuid>.pdf
    const documentoId = randomUUID();
    const facturaId = randomUUID();
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const clave = `FAC/${hoy.getFullYear()}/${mes}/${documentoId}.${tipo.ext}`;

    // 6.todo o nada
    try {
      await this.dataSource.transaction(async (tx) => {
        await tx.insert(Documento, {
          id: documentoId,
          tipoDocumentoId: tipoFac.id,
          objectKey: clave,
          nombreOriginal: archivo.originalname.slice(0, 255),
          mimeType: tipo.mime,
          tamanoBytes: archivo.size,
          sha256,
          subidoPor: USUARIO_PROVISIONAL,
        });
        await tx.insert(FacturaPorCobrar, {
          ...dto,
          id: facturaId,
          documentoId,
          creadoPor: USUARIO_PROVISIONAL,
        });
        await this.storage.subir(clave, archivo.buffer, tipo.mime);
      });
    } catch (error) {
      //23505 = violacion de UNIQUE (dos personas subiendo lo mismo al mismo timpo)
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('La factura o el archivo ya existen');
      }
      throw error;
    }

    return this.obtener(facturaId);
  }

  async obtener(id: string): Promise<FacturaPorCobrar> {
    const factura = await this.facturas.findOneBy({ id });
    if (!factura) {
      throw new NotFoundException(`No existe la factura ${id}`);
    }
    return factura;
  }

  async buscar(filtros: BuscarFacturasDto) {
    const { numero, cliente, vendedor, desde, hasta, pagina, porPagina } =
      filtros;

    if (desde && hasta && hasta < desde) {
      throw new BadRequestException('hasta no puede ser anterior a desde');
    }

    const where: FindOptionsWhere<FacturaPorCobrar> = {};
    if (numero) where.numeroFactura = ILike(`${numero}%`);
    if (cliente) where.clienteNombre = ILike(`%${escaparLike(cliente)}%`);
    if (vendedor) where.vendedor = ILike(`%${escaparLike(vendedor)}%`);
    if (desde && hasta) where.fechaEmision = Between(desde, hasta);
    else if (desde) where.fechaEmision = MoreThanOrEqual(desde);
    else if (hasta) where.fechaEmision = LessThanOrEqual(hasta);

    const [datos, total] = await this.facturas.findAndCount({
      where,
      order: { fechaEmision: 'DESC', numeroFactura: 'ASC' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    });

    return {
      datos,
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina),
    };
  }

  async urlDescarga(
    id: string,
  ): Promise<{ url: string; expiraEnMinutos: number }> {
    const factura = await this.facturas.findOne({
      where: { id },
      relations: { documento: true },
    });
    if (!factura) {
      throw new NotFoundException(`No existe la factura ${id}`);
    }
    const { objectKey } = factura.documento;
    const extension = objectKey.split('.').pop();
    const url = await this.storage.urlDescarga(
      objectKey,
      `factura-${factura.numeroFactura}.${extension}`,
    );
    return { url, expiraEnMinutos: 5 };
  }
}
