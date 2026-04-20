import type { FastifyPluginAsync } from 'fastify'
import { proxyToAws } from '../lib/aws.js'
import type { ChatRequest, ChatResponse } from '../types/index.js'

const bodySchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message:   { type: 'string', minLength: 1, maxLength: 2000 },
    sessionId: { type: 'string' },
  },
  additionalProperties: false,
} as const

const responseSchema = {
  200: {
    type: 'object',
    required: ['reply', 'sessionId'],
    properties: {
      reply:        { type: 'string' },
      sessionId:    { type: 'string' },
      flagForHuman: { type: 'boolean' },
    },
  },
  '4xx': {
    type: 'object',
    required: ['error'],
    properties: { error: { type: 'string' } },
  },
  '5xx': {
    type: 'object',
    required: ['error'],
    properties: { error: { type: 'string' } },
  },
} as const

function isChatResponse(v: unknown): v is ChatResponse {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>)['response'] === 'string' &&
    typeof (v as Record<string, unknown>)['sessionId'] === 'string'
  )
}

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/chat',
    { schema: { body: bodySchema, response: responseSchema } },
    async (request, reply) => {
      const chatbotUrl = process.env['AWS_CHATBOT_URL']
      if (!chatbotUrl || !/^https?:\/\//.test(chatbotUrl)) {
        request.log.error('AWS_CHATBOT_URL is missing or has an invalid scheme')
        return reply.code(503).send({ error: 'Chat service unavailable' })
      }

      const body = request.body as ChatRequest

      request.log.debug({ hasSessionId: Boolean(body.sessionId), messageLength: body.message.length }, 'chat request')

      try {
        const raw = await proxyToAws(chatbotUrl, body)

        if (!isChatResponse(raw)) {
          request.log.error({ raw }, 'Unexpected shape from AWS chatbot')
          return await reply.code(502).send({ error: 'Chat service unavailable' })
        }

        request.log.debug({ sessionId: raw.sessionId, flagForHuman: raw.flagForHuman }, 'chat response from AWS chatbot')
        return await reply.send({
          reply: raw.response,
          sessionId: raw.sessionId,
          flagForHuman: raw.flagForHuman,
        })
      } catch (err: unknown) {
        request.log.error({ err }, 'AWS chatbot error')
        return await reply.code(502).send({ error: 'Chat service unavailable' })
      }
    },
  )
}
