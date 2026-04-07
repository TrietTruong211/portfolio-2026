import type { FastifyPluginAsync } from 'fastify'
import multipart from '@fastify/multipart'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { requireOwner } from '../plugins/auth.js'
import { proxyToAws } from '../lib/aws.js'
import type { DocumentQueryRequest } from '../types/index.js'

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const queryBodySchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 4000 },
    documentKey: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const documentRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: MAX_FILE_SIZE } })

  const s3 = new S3Client({ region: process.env['AWS_REGION'] ?? 'ap-southeast-2' })

  app.post('/documents/upload', { preHandler: requireOwner }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file provided' })

    if (!ALLOWED_TYPES.has(data.mimetype)) {
      return reply.code(400).send({ error: 'File type not supported' })
    }

    const key = `documents/${randomUUID()}-${data.filename}`
    const buffer = await data.toBuffer()

    try {
      await s3.send(new PutObjectCommand({
        Bucket: process.env['AWS_S3_BUCKET']!,
        Key: key,
        Body: buffer,
        ContentType: data.mimetype,
        ServerSideEncryption: 'AES256',
      }))

      return reply.send({ ok: true, key })
    } catch (err) {
      request.log.error(err, 'S3 upload error')
      return reply.code(502).send({ error: 'Upload failed' })
    }
  })

  app.post('/documents/query', { preHandler: requireOwner, schema: { body: queryBodySchema } }, async (request, reply) => {
    const body = request.body as DocumentQueryRequest

    try {
      const response = await proxyToAws(process.env['AWS_DOC_QUERY_URL']!, body)
      return reply.send(response)
    } catch (err) {
      request.log.error(err, 'AWS doc-query error')
      return reply.code(502).send({ error: 'Query service unavailable' })
    }
  })
}
