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
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthModule } from './auth/auth.module';
import { AutenticadoGuard } from './auth/autenticado.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuracion] }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    TiposDocumentoModule,
    FacturasPorCobrarModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AutenticadoGuard },
  ],
})
export class AppModule {}
