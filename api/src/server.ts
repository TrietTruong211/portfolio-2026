import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import sensible from '@fastify/sensible'
import { authPlugin } from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { chatRoutes } from './routes/chat.js'
import { documentRoutes } from './routes/documents.js'
import { contactRoutes } from './routes/contact.js'
import { adminRoutes } from './routes/admin.js'

export async function buildServer() {
  const app = Fastify({
    logger: process.env['NODE_ENV'] !== 'test',
  })

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
    credentials: true,
  })

  await app.register(cookie)
  await app.register(sensible)
  await app.register(authPlugin)

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(chatRoutes, { prefix: '/api' })
  await app.register(documentRoutes, { prefix: '/api' })
  await app.register(contactRoutes, { prefix: '/api' })
  await app.register(adminRoutes, { prefix: '/api' })

  app.get('/health', async () => ({ status: 'ok', ts: Date.now() }))

  return app
}
