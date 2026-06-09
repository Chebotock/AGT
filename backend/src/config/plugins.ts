import { FastifyInstance } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'

export async function registerPlugins(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: false, // настроить под нужды позже
  })
  await app.register(cors, {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /\.vercel\.app$/,   // разрешить все preview-деплои Vercel
    ],
    credentials: true,
  })
  await app.register(cookie, { secret: process.env.JWT_SECRET })
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  })
}
