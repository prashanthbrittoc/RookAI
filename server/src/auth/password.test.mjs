import { hashPassword, verifyPassword } from './password.mjs';

test('hashes are salted and verifiable', async () => {
  const a = await hashPassword('correct horse', 4); // cost 4 keeps tests fast
  const b = await hashPassword('correct horse', 4);
  expect(a).not.toBe('correct horse');
  expect(a).not.toBe(b);                       // random salt
  expect(await verifyPassword('correct horse', a)).toBe(true);
  expect(await verifyPassword('wrong', a)).toBe(false);
});