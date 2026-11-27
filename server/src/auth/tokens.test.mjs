import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from './tokens.mjs';

const secret = 'x'.repeat(40);

test('round trip returns the user id', () => {
  expect(verifyToken(signToken('u1', { secret }), { secret }).sub).toBe('u1');
});
test('a token signed with another secret is rejected', () => {
  expect(() => verifyToken(signToken('u1', { secret: 'y'.repeat(40) }), { secret })).toThrow();
});
test('a tampered token is rejected', () => {
  const t = signToken('u1', { secret });
  expect(() => verifyToken(t.slice(0, -2) + 'xx', { secret })).toThrow();
});
test('an expired token is rejected', () => {
  expect(() => verifyToken(signToken('u1', { secret, expiresIn: -10 }), { secret })).toThrow(/expired/);
});
test('an unsigned "alg: none" token is rejected', () => {
  const none = jwt.sign({ sub: 'u1' }, '', { algorithm: 'none' });
  expect(() => verifyToken(none, { secret })).toThrow();
});