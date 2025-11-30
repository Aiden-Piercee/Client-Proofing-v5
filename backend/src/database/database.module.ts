import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createPool, Pool } from 'mysql2/promise';
import { DatabaseConfig, KOKEN_DB, PROOFING_DB } from '../config/database.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PROOFING_DB,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const settings = configService.get<DatabaseConfig>('database')?.proofing;
        if (!settings) {
          throw new Error('Missing proofing database configuration.');
        }
        return createPool({
          host: settings.host,
          port: settings.port,
          user: settings.user,
          password: settings.password,
          database: settings.database,
          waitForConnections: true,
          connectionLimit: 10
        }) as Pool;
      }
    },
    {
      provide: KOKEN_DB,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const settings = configService.get<DatabaseConfig>('database')?.koken;
        if (!settings) {
          throw new Error('Missing Koken database configuration.');
        }
        return createPool({
          host: settings.host,
          port: settings.port,
          user: settings.user,
          password: settings.password,
          database: settings.database,
          waitForConnections: true,
          connectionLimit: 10
        }) as Pool;
      }
    }
  ],
  exports: [PROOFING_DB, KOKEN_DB]
})
export class DatabaseModule {}
