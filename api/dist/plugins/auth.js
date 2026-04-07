import fp from 'fastify-plugin';
import { verifyAccessToken } from '../lib/jwt.js';
const authPlugin = fp(async (app) => {
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (request, reply) => {
        const token = request.cookies['portfolio_access'];
        if (!token)
            return;
        try {
            request.user = verifyAccessToken(token);
        }
        catch {
            reply
                .clearCookie('portfolio_access')
                .clearCookie('portfolio_refresh');
        }
    });
});
export { authPlugin };
export function requireOwner(request, reply, done) {
    if (!request.user || request.user.role !== 'owner') {
        reply.code(403).send({ error: 'Forbidden' });
        return;
    }
    done();
}
//# sourceMappingURL=auth.js.map