import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'fusion_user',
  password: process.env.DATABASE_PASSWORD || 'fusion_password',
  name: process.env.DATABASE_NAME || 'intel_fusion',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development'
}))