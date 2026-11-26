import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.cwd() + '/.env' });
dotenv.config({ path: process.cwd() + '/../../.env' });

const databaseUrl = process.env.DATABASE_URL;

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'helpdesk_ai',
      }),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [__dirname + '/../database/entities/*.{ts,js}'],
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

export default new DataSource(dataSourceOptions);
