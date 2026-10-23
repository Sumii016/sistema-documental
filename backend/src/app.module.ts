import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthModule } from './auth/auth.module';
import { AutenticadoGuard } from './auth/autenticado.guard';
import { RolesGuard } from './auth/roles.guard';
import { configuracion } from './config/configuracion';
import { DatabaseModule } from './database/database.module';
import { FacturasPorCobrarModule } from './facturas-por-cobrar/facturas-por-cobrar.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { TiposDocumentoModule } from './tipos-documento/tipos-documento.module';
import { UsuariosModule } from './usuarios/usuarios.module';

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
    UsuariosModule,
    AuditoriaModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AutenticadoGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
