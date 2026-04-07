import jwt from 'jsonwebtoken'

export type JwtPayload = {
  id: string
  role: 'owner'
}

type RefreshPayload = {
  id: string
}

const ACCESS_TTL = '15m'
const REFRESH_TTL = '7d'

function getSecret(key: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} environment variable is required`)
  return value
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret('JWT_SECRET'), { expiresIn: ACCESS_TTL })
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_TTL })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret('JWT_SECRET')) as JwtPayload
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as RefreshPayload
}
