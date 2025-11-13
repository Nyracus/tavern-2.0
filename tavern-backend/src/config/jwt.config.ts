import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

export interface JwtUserPayload extends JwtPayload {
  sub: string;                        // user id
  role: 'ADVENTURER' | 'NPC' | 'GUILD_MASTER';
}

export const signJwt = (payload: JwtUserPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);

export const verifyJwt = (token: string): JwtUserPayload =>
  jwt.verify(token, JWT_SECRET) as JwtUserPayload;
