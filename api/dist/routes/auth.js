import { db, schema, eq } from '@portfolio/db';
import { compare } from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
const loginBody = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
    },
    additionalProperties: false,
};
const cookieOpts = (maxAge) => ({
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
});
export const authRoutes = async (app) => {
    app.post('/login', { schema: { body: loginBody } }, async (request, reply) => {
        const { email, password } = request.body;
        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
        if (!user)
            return reply.code(401).send({ error: 'Invalid credentials' });
        const valid = await compare(password, user.passwordHash);
        if (!valid)
            return reply.code(401).send({ error: 'Invalid credentials' });
        return reply
            .setCookie('portfolio_access', signAccessToken({ id: user.id, role: 'owner' }), cookieOpts(60 * 15))
            .setCookie('portfolio_refresh', signRefreshToken({ id: user.id }), cookieOpts(60 * 60 * 24 * 7))
            .send({ ok: true });
    });
    app.post('/logout', async (_request, reply) => {
        return reply
            .clearCookie('portfolio_access', { path: '/' })
            .clearCookie('portfolio_refresh', { path: '/' })
            .send({ ok: true });
    });
    app.post('/refresh', async (request, reply) => {
        const token = request.cookies['portfolio_refresh'];
        if (!token)
            return reply.code(401).send({ error: 'No refresh token' });
        try {
            const payload = verifyRefreshToken(token);
            const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payload.id));
            if (!user)
                return reply.code(401).send({ error: 'User not found' });
            return reply
                .setCookie('portfolio_access', signAccessToken({ id: user.id, role: 'owner' }), cookieOpts(60 * 15))
                .send({ ok: true });
        }
        catch {
            return reply.code(401).send({ error: 'Invalid refresh token' });
        }
    });
    app.get('/me', async (request, reply) => {
        if (!request.user)
            return reply.code(401).send({ error: 'Unauthenticated' });
        return reply.send({ id: request.user.id, role: request.user.role });
    });
};
//# sourceMappingURL=auth.js.map