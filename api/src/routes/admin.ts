import type { FastifyPluginAsync } from 'fastify'
import { db, schema, desc } from '../db/index.js'
import { requireAdmin } from '../plugins/auth.js'

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/contact-submissions', {
    preHandler: requireAdmin,
  }, async (request, reply) => {
    try {
      const submissions = await db
        .select()
        .from(schema.contactSubmissions)
        .orderBy(desc(schema.contactSubmissions.createdAt))
      return reply.send(submissions)
    } catch (err) {
      request.log.error(err, 'Failed to fetch contact submissions')
      return reply.code(500).send({ error: 'Failed to fetch submissions' })
    }
  })
}
