import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const databaseConfigured = Boolean(
  process.env.DATABASE_URL || process.env.DB_HOST || process.env.DB_NAME,
);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ...(databaseConfigured
      ? [
          TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const databaseUrl = config.get<string>('DATABASE_URL');
              const ssl = config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false;
              return {
                type: 'postgres' as const,
                ...(databaseUrl
                  ? { url: databaseUrl }
                  : {
                      host: config.get<string>('DB_HOST', 'localhost'),
                      port: Number(config.get<string>('DB_PORT', '5432')),
                      username: config.get<string>('DB_USERNAME', 'postgres'),
                      password: config.get<string>('DB_PASSWORD', 'postgres'),
                      database: config.get<string>('DB_NAME', 'helpdesk_ai'),
                    }),
                ssl,
                autoLoadEntities: true,
                synchronize: false,
                logging: config.get<string>('DB_LOGGING') === 'true',
              };
            },
          }),
        ]
      : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
