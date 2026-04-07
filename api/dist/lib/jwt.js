import jwt from 'jsonwebtoken';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
function getSecret(key) {
    const value = process.env[key];
    if (!value)
        throw new Error(`${key} environment variable is required`);
    return value;
}
export function signAccessToken(payload) {
    return jwt.sign(payload, getSecret('JWT_SECRET'), { expiresIn: ACCESS_TTL });
}
export function signRefreshToken(payload) {
    return jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_TTL });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, getSecret('JWT_SECRET'));
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'));
}
//# sourceMappingURL=jwt.js.map