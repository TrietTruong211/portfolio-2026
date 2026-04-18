import type { FastifyPluginAsync } from 'fastify'
import { db, schema, desc } from '../db/index.js'
import { requireAdmin } from '../plugins/auth.js'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const submissionSchema = {
  type: 'object',
  properties: {
    id:        { type: 'string', format: 'uuid' },
    name:      { type: 'string' },
    email:     { type: 'string', format: 'email' },
    message:   { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email', 'message', 'createdAt'],
} as const

const listSchema = {
  querystring: {
    type: 'object',
    properties: {
      limit:  { type: 'integer', minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data:   { type: 'array', items: submissionSchema },
        total:  { type: 'integer' },
        limit:  { type: 'integer' },
        offset: { type: 'integer' },
      },
      required: ['data', 'total', 'limit', 'offset'],
    },
    '5xx': {
      type: 'object',
      properties: { error: { type: 'string' } },
      required: ['error'],
    },
  },
} as const

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/contact-submissions', {
    preHandler: requireAdmin,
    schema: listSchema,
  }, async (request, reply) => {
    const { limit, offset } = request.query as { limit: number; offset: number }

    try {
      const [submissions, countResult] = await Promise.all([
        db.select()
          .from(schema.contactSubmissions)
          .orderBy(desc(schema.contactSubmissions.createdAt))
          .limit(limit)
          .offset(offset),
        db.$count(schema.contactSubmissions),
      ])

      return reply.send({ data: submissions, total: countResult, limit, offset })
    } catch (err) {
      request.log.error(err, 'Failed to fetch contact submissions')
      return reply.code(500).send({ error: 'Failed to fetch submissions' })
    }
  })
}
