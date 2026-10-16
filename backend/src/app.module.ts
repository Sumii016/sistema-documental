import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuracion } from './config/configuracion';
import { DatabaseModule } from './database/database.module';
import { FacturasPorCobrarModule } from './facturas-por-cobrar/facturas-por-cobrar.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { TiposDocumentoModule } from './tipos-documento/tipos-documento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuracion] }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    TiposDocumentoModule,
    FacturasPorCobrarModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
