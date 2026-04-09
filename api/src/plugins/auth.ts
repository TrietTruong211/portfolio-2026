import fp from 'fastify-plugin'
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../lib/jwt.js'

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('user', null)

  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies['portfolio_access']
    if (!token) return

    try {
      request.user = verifyAccessToken(token)
    } catch {
      reply
        .clearCookie('portfolio_access')
        .clearCookie('portfolio_refresh')
    }
  })
})

export { authPlugin }

export function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  if (!request.user || request.user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden' })
    return
  }
  done()
}
