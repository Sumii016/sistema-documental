import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      //esto crea la conexion a la base de datos de manera asincrona, es decir, que espera a que se resuelva la promesa de la configuracion antes de crear la conexion
      inject: [ConfigService], //inyeccion de dependencias pero escrita de otra manera
      useFactory: (config: ConfigService) => ({
        //una funcion que recibe la config y devuelve un objeto de configuracion para TypeORM
        type: 'postgres',
        host: config.getOrThrow<string>('db.host'),
        port: config.getOrThrow<number>('db.puerto'),
        database: config.getOrThrow<string>('db.nombre'),
        username: config.getOrThrow<string>('db.usuario'),
        password: config.getOrThrow<string>('db.password'),
        autoLoadEntities: true,
        synchronize: false, // Nunca usar synchronize: true en producción
      }),
    }),
  ],
})
export class DatabaseModule {}
