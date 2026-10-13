import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly Cliente: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('storage.bucket');
    this.Cliente = new S3Client({
      endpoint: config.getOrThrow<string>('storage.endpoint'),
      region: config.getOrThrow<string>('storage.region'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.getOrThrow<string>('storage.accessKey'),
        secretAccessKey: config.getOrThrow<string>('storage.secretKey'),
      },
    });
  }

  //comprueba si el bucket existe y que docs_app tiene permisos para verlo
  async verificarBucket(): Promise<void> {
    await this.Cliente.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  onApplicationShutdown(): void {
    this.Cliente.destroy();
  }
}
