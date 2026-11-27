import jwt from 'jsonwebtoken';

export function signToken(userId, { secret = process.env.JWT_SECRET, expiresIn = '7d' } = {}) {
  return jwt.sign({ sub: String(userId) }, secret, { algorithm: 'HS256', expiresIn });
}

export function verifyToken(token, { secret = process.env.JWT_SECRET } = {}) {
  return jwt.verify(token, secret, { algorithms: ['HS256'] }); // pin the algorithm; throws if invalid or expired
}