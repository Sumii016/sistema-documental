import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MINUTOS_ENLACE = 5;

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly cliente: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('storage.bucket');
    this.cliente = new S3Client({
      endpoint: config.getOrThrow<string>('storage.endpoint'),
      region: config.getOrThrow<string>('storage.region'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('storage.accessKey'),
        secretAccessKey: config.getOrThrow<string>('storage.secretKey'),
      },

      // el SDK reciente agrega verificaciones extra que algunos servidores
      // compatibles con S3 no aceptan; solo las usamos cuando son obligatorias.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  //comprueba que el bucket existe y que docs-app tiene permiso para verlo
  async verificarBucket(): Promise<void> {
    await this.cliente.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  //sube un archivo con la clave indicada (ej. FAC/2026/10/uuid.pdf)
  async subir(
    clave: string,
    contenido: Buffer,
    tipoMime: string,
  ): Promise<void> {
    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: clave,
        Body: contenido,
        ContentType: tipoMime,
      }),
    );
  }

  //genera un enlace que permite descargar UN archivo durante unos pocos minutos
  urlDescarga(clave: string, nombreDescarga: string): Promise<string> {
    const comando = new GetObjectCommand({
      Bucket: this.bucket,
      Key: clave,
      ResponseContentDisposition: 'attachment; filename="${nombreDescarga}"',
    });
    return getSignedUrl(this.cliente, comando, {
      expiresIn: MINUTOS_ENLACE * 60,
    });
  }

  onApplicationShutdown(): void {
    this.cliente.destroy();
  }
}
