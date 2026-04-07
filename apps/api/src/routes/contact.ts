import type { FastifyPluginAsync } from 'fastify'
import { db, schema } from '@portfolio/db'
import type { ContactFormData } from '@portfolio/types'

const bodySchema = {
  type: 'object',
  required: ['name', 'email', 'message'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    message: { type: 'string', minLength: 1, maxLength: 2000 },
  },
  additionalProperties: false,
} as const

export const contactRoutes: FastifyPluginAsync = async (app) => {
  app.post('/contact', { schema: { body: bodySchema } }, async (request, reply) => {
    const { name, email, message } = request.body as ContactFormData

    try {
      await db.insert(schema.contactSubmissions).values({ name, email, message })
      return reply.code(201).send({ ok: true })
    } catch (err) {
      request.log.error(err, 'Failed to save contact submission')
      return reply.code(500).send({ error: 'Failed to send message' })
    }
  })
}
