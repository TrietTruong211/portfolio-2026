# Skill: AWS Integration

## Context
The portfolio integrates with three pre-built AWS services: a chatbot endpoint, a document-query endpoint, and S3 for document storage. The Railway API proxies all AWS calls — the frontend never talks to AWS directly.

---

## Services overview

| Service | Endpoint env var | Auth | Who calls it |
|---------|-----------------|------|-------------|
| Chatbot | `AWS_CHATBOT_URL` | `x-api-key` header | Railway API (public route) |
| Doc-query | `AWS_DOC_QUERY_URL` | `x-api-key` header | Railway API (owner-only route) |
| S3 upload | `AWS_S3_BUCKET` + AWS SDK | IAM role / access keys | Railway API (owner-only route) |

---

## Chatbot proxy (public)

```ts
// apps/api/src/routes/chat.ts
import type { FastifyPluginAsync } from 'fastify'
import { proxyToAws } from '../lib/aws'

const bodySchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string', minLength: 1, maxLength: 2000 },
    sessionId: { type: 'string' },
  },
  additionalProperties: false,
} as const

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post('/chat', { schema: { body: bodySchema } }, async (request, reply) => {
    const body = request.body as { message: string; sessionId?: string }

    try {
      const response = await proxyToAws(process.env.AWS_CHATBOT_URL!, body)
      reply.send(response)
    } catch (err) {
      request.log.error(err, 'AWS chatbot error')
      reply.code(502).send({ error: 'Chat service unavailable' })
    }
  })
}
```

---

## Document upload (owner only)

The flow: owner submits file → Railway receives multipart → uploads to S3 → returns the S3 key → your existing AWS flow is triggered (Lambda, Step Functions, etc.).

```ts
// apps/api/src/routes/documents.ts
import type { FastifyPluginAsync } from 'fastify'
import multipart from '@fastify/multipart'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { requireOwner } from '../plugins/auth'
import { proxyToAws } from '../lib/aws'

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-southeast-2' })

export const documentRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } })  // 25MB

  app.post('/documents/upload', { preHandler: requireOwner }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file provided' })

    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'File type not supported' })
    }

    const key = `documents/${randomUUID()}-${data.filename}`
    const buffer = await data.toBuffer()

    try {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: data.mimetype,
        ServerSideEncryption: 'AES256',
      }))

      // The existing AWS flow picks up from S3 automatically (S3 event trigger)
      // or trigger it explicitly here if needed:
      // await proxyToAws(process.env.AWS_TRIGGER_URL!, { key, mimetype: data.mimetype })

      reply.send({ ok: true, key })
    } catch (err) {
      request.log.error(err, 'S3 upload error')
      reply.code(502).send({ error: 'Upload failed' })
    }
  })

  app.post('/documents/query', { preHandler: requireOwner }, async (request, reply) => {
    const body = request.body as { message: string; documentKey?: string }

    try {
      const response = await proxyToAws(process.env.AWS_DOC_QUERY_URL!, body)
      reply.send(response)
    } catch (err) {
      request.log.error(err, 'AWS doc-query error')
      reply.code(502).send({ error: 'Query service unavailable' })
    }
  })
}
```

---

## AWS proxy helper

```ts
// apps/api/src/lib/aws.ts
const TIMEOUT_MS = 10_000

export async function proxyToAws(url: string, body: unknown): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AWS_API_KEY!,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`AWS responded ${res.status}: ${await res.text()}`)
    }

    return res.json()
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('AWS request timed out')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
```

---

## S3 IAM policy (Railway service role)

The Railway service needs these S3 permissions (no more):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/documents/*"
    }
  ]
}
```

Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Railway env vars (or use an IAM role if Railway supports OIDC).

---

## Frontend upload component

```tsx
// apps/web/src/components/admin/DocumentUpload.tsx
'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

export function DocumentUpload() {
  const [state, setState] = useState<UploadState>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setState('uploading')
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents/upload`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setState('success')
      setMessage(`${file.name} uploaded — analysis running`)
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div
      data-testid="document-upload"
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        state === 'success' ? 'border-green-500 bg-green-500/5' :
        state === 'error'   ? 'border-destructive bg-destructive/5' :
        'border-border hover:border-primary'
      )}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" accept=".pdf,.txt,.doc,.docx"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {state === 'idle' && <><Upload className="mx-auto mb-2 text-muted-foreground" size={24} /><p className="text-sm text-muted-foreground">Drop a document or click to browse</p></>}
      {state === 'uploading' && <><FileText className="mx-auto mb-2 animate-pulse" size={24} /><p className="text-sm">Uploading…</p></>}
      {state === 'success' && <><CheckCircle className="mx-auto mb-2 text-green-500" size={24} /><p className="text-sm text-green-600">{message}</p></>}
      {state === 'error' && <><AlertCircle className="mx-auto mb-2 text-destructive" size={24} /><p className="text-sm text-destructive">{message}</p></>}
    </div>
  )
}
```

---

## Environment variables (Railway)

```
AWS_API_KEY=           # shared key for chatbot + doc-query APIs
AWS_CHATBOT_URL=       # full URL of your chatbot Lambda/API Gateway endpoint
AWS_DOC_QUERY_URL=     # full URL of your doc-query endpoint
AWS_S3_BUCKET=         # bucket name (no s3:// prefix)
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=     # for S3 PutObject
AWS_SECRET_ACCESS_KEY= # for S3 PutObject
```
