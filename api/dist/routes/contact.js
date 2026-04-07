import { db, schema } from '@portfolio/db';
const bodySchema = {
    type: 'object',
    required: ['name', 'email', 'message'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        message: { type: 'string', minLength: 1, maxLength: 2000 },
    },
    additionalProperties: false,
};
export const contactRoutes = async (app) => {
    app.post('/contact', { schema: { body: bodySchema } }, async (request, reply) => {
        const { name, email, message } = request.body;
        try {
            await db.insert(schema.contactSubmissions).values({ name, email, message });
            return reply.code(201).send({ ok: true });
        }
        catch (err) {
            request.log.error(err, 'Failed to save contact submission');
            return reply.code(500).send({ error: 'Failed to send message' });
        }
    });
};
//# sourceMappingURL=contact.js.map