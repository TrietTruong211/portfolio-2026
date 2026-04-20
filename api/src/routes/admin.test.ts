import { buildServer } from '../server.js'
import type { FastifyInstance } from 'fastify'
import { signAccessToken } from '../lib/jwt.js'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildServer()
})

afterAll(async () => {
  await app.close()
})

function cookieFor(role: 'admin' | 'user'): string {
  const token = signAccessToken({ id: `test-${role}-id`, role })
  return `portfolio_access=${token}`
}

describe('GET /api/admin/contact-submissions', () => {
  describe('authorisation', () => {
    it('returns 403 without any auth cookie', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions',
      })
      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: 'Forbidden' })
    })

    it('returns 403 for a user-role token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions',
        headers: { cookie: cookieFor('user') },
      })
      expect(res.statusCode).toBe(403)
      expect(res.json()).toMatchObject({ error: 'Forbidden' })
    })

    it('returns 200 for an admin-role token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(200)
    })
  })

  describe('response envelope', () => {
    it('returns data array, total, limit and offset', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions',
        headers: { cookie: cookieFor('admin') },
      })
      const body = res.json()
      expect(Array.isArray(body.data)).toBe(true)
      expect(typeof body.total).toBe('number')
      expect(body.limit).toBe(20)
      expect(body.offset).toBe(0)
    })

    it('each submission item has the expected fields', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions',
        headers: { cookie: cookieFor('admin') },
      })
      const { data } = res.json() as { data: unknown[] }
      for (const item of data) {
        expect(item).toMatchObject({
          id:        expect.any(String),
          name:      expect.any(String),
          email:     expect.any(String),
          message:   expect.any(String),
          createdAt: expect.any(String),
        })
      }
    })
  })

  describe('pagination query params', () => {
    it('respects custom limit and offset', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions?limit=5&offset=10',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.limit).toBe(5)
      expect(body.offset).toBe(10)
    })

    it('returns at most limit items', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions?limit=1',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.length).toBeLessThanOrEqual(1)
    })
  })

  describe('schema validation', () => {
    it('rejects limit above 100', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions?limit=101',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejects negative offset', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions?offset=-1',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(400)
    })

    it('rejects non-integer limit', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/contact-submissions?limit=abc',
        headers: { cookie: cookieFor('admin') },
      })
      expect(res.statusCode).toBe(400)
    })
  })
})
