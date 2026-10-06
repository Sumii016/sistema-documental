import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuracion } from './config/configuracion';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuracion],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
