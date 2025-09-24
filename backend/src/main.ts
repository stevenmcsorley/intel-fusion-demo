import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import helmet from 'helmet'
import * as compression from 'compression'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security middleware
  app.use(helmet())
  app.use(compression())

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  // API prefix
  app.setGlobalPrefix('api/v1')

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Intel Fusion Dashboard API')
    .setDescription('API for the London Crime Demo intelligence fusion system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('incidents', 'Incident management')
    .addTag('entities', 'Entity management')
    .addTag('cases', 'Case file management')
    .addTag('search', 'Search and similarity')
    .addTag('ingestion', 'Data ingestion')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  
  console.log(`🚀 Intel Fusion Dashboard API is running on port ${port}`)
  console.log(`📖 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()