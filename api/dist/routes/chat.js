import { proxyToAws } from '../lib/aws.js';
const bodySchema = {
    type: 'object',
    required: ['message'],
    properties: {
        message: { type: 'string', minLength: 1, maxLength: 2000 },
        sessionId: { type: 'string' },
    },
    additionalProperties: false,
};
export const chatRoutes = async (app) => {
    app.post('/chat', { schema: { body: bodySchema } }, async (request, reply) => {
        const body = request.body;
        try {
            const response = await proxyToAws(process.env['AWS_CHATBOT_URL'], body);
            return reply.send(response);
        }
        catch (err) {
            request.log.error(err, 'AWS chatbot error');
            return reply.code(502).send({ error: 'Chat service unavailable' });
        }
    });
};
//# sourceMappingURL=chat.js.map