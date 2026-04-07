import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
declare const authPlugin: FastifyPluginAsync;
export { authPlugin };
export declare function requireOwner(request: FastifyRequest, reply: FastifyReply, done: () => void): void;
//# sourceMappingURL=auth.d.ts.map