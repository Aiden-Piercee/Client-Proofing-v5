import { registerAs } from '@nestjs/config';

export interface MysqlConnectionSettings {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface DatabaseConfig {
  proofing: MysqlConnectionSettings;
  koken: MysqlConnectionSettings;
}

export const PROOFING_DB = 'PROOFING_DB_CONNECTION';
export const KOKEN_DB = 'KOKEN_DB_CONNECTION';

export default registerAs<DatabaseConfig>('database', () => ({
  proofing: {
    host: process.env.PROOFING_DB_HOST ?? 'localhost',
    port: Number(process.env.PROOFING_DB_PORT ?? 3306),
    user: process.env.PROOFING_DB_USER ?? 'root',
    password: process.env.PROOFING_DB_PASSWORD ?? '',
    database: process.env.PROOFING_DB_NAME ?? 'proofing_db'
  },
  koken: {
    host: process.env.KOKEN_DB_HOST ?? 'localhost',
    port: Number(process.env.KOKEN_DB_PORT ?? 3306),
    user: process.env.KOKEN_DB_USER ?? 'root',
    password: process.env.KOKEN_DB_PASSWORD ?? '',
    database: process.env.KOKEN_DB_NAME ?? 'koken_db'
  }
}));
