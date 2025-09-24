import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from '@nestjs/bull'
import { WinstonModule } from 'nest-winston'
import * as winston from 'winston'

// Configuration
import { databaseConfig } from './config/database.config'
import { redisConfig } from './config/redis.config'

// Modules
import { IncidentsModule } from './modules/incidents/incidents.module'
import { EntitiesModule } from './modules/entities/entities.module'
import { CasesModule } from './modules/cases/cases.module'
import { SearchModule } from './modules/search/search.module'
import { IngestionModule } from './modules/ingestion/ingestion.module'
import { HealthModule } from './modules/health/health.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [databaseConfig, redisConfig]
    }),

    // Logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        autoLoadEntities: true,
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging')
      }),
      inject: [ConfigService]
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password')
        }
      }),
      inject: [ConfigService]
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    HealthModule,
    IncidentsModule,
    EntitiesModule,
    CasesModule,
    SearchModule,
    IngestionModule
  ]
})
export class AppModule {}