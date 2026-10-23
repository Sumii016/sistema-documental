import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MINUTOS_ENLACE = 5;

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly cliente: S3Client;        // para hablar con el almacenamiento
  private readonly clienteFirmas: S3Client;  // solo para firmar enlaces que abre el navegador
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('storage.bucket');

    const comun = {
      region: config.getOrThrow<string>('storage.region'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('storage.accessKey'),
        secretAccessKey: config.getOrThrow<string>('storage.secretKey'),
      },
      requestChecksumCalculation: 'WHEN_REQUIRED' as const,
      responseChecksumValidation: 'WHEN_REQUIRED' as const,
    };

    this.cliente = new S3Client({ ...comun, endpoint: config.getOrThrow<string>('storage.endpoint') });
    this.clienteFirmas = new S3Client({ ...comun, endpoint: config.getOrThrow<string>('storage.endpointPublico') });
  }

  async verificarBucket(): Promise<void> {
    await this.cliente.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  async subir(clave: string, contenido: Buffer, tipoMime: string): Promise<void> {
    await this.cliente.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: clave, Body: contenido, ContentType: tipoMime }),
    );
  }

  urlDescarga(clave: string, nombreDescarga: string): Promise<string> {
    const comando = new GetObjectCommand({
      Bucket: this.bucket,
      Key: clave,
      ResponseContentDisposition: `attachment; filename="${nombreDescarga}"`,
    });
    // Firmar no necesita conexion: solo calcula la firma con la direccion publica
    return getSignedUrl(this.clienteFirmas, comando, { expiresIn: MINUTOS_ENLACE * 60 });
  }

  onApplicationShutdown(): void {
    this.cliente.destroy();
    this.clienteFirmas.destroy();
  }
}