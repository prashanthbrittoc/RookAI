import { createAuthService } from './auth-service.mjs';
import { DuplicateEmailError } from '../db/user-store.mjs';

function setup() {
  const db = new Map();
  const calls = { hash: 0, verify: 0 };
  const users = {
    findByEmail: async (email) => db.get(email) ?? null,
    create: async ({ email, passwordHash }) => {
      if (db.has(email)) throw new DuplicateEmailError();
      const u = { id: String(db.size + 1), email, plan: 'free', passwordHash };
      db.set(email, u);
      return u;
    },
  };
  const hash = async (pw) => { calls.hash++; return `hashed:${pw}`; };
  const verify = async (pw, h) => { calls.verify++; return h === `hashed:${pw}`; };
  return { db, calls, auth: createAuthService({ users, hash, verify }) };
}

test('signup stores a hash, never the password, and returns no hash', async () => {
  const { db, auth } = setup();
  const user = await auth.signup({ email: 'a@b.com', password: 'secret123' });
  expect(db.get('a@b.com').passwordHash).toBe('hashed:secret123');
  expect(user).toEqual({ id: '1', email: 'a@b.com', plan: 'free' });
  expect(user.passwordHash).toBeUndefined();
});

test('duplicate email is a 409 EMAIL_TAKEN', async () => {
  const { auth } = setup();
  await auth.signup({ email: 'a@b.com', password: 'secret123' });
  await expect(auth.signup({ email: 'a@b.com', password: 'secret123' }))
    .rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN' });
});

test('login succeeds with the right password', async () => {
  const { auth } = setup();
  await auth.signup({ email: 'a@b.com', password: 'secret123' });
  expect(await auth.login({ email: 'a@b.com', password: 'secret123' })).toMatchObject({ email: 'a@b.com' });
});

test('wrong password and unknown email give the identical error', async () => {
  const { auth } = setup();
  await auth.signup({ email: 'a@b.com', password: 'secret123' });
  const wrong = await auth.login({ email: 'a@b.com', password: 'nope' }).catch((e) => e);
  const unknown = await auth.login({ email: 'x@y.com', password: 'nope' }).catch((e) => e);
  expect([wrong.status, wrong.code, wrong.message]).toEqual([unknown.status, unknown.code, unknown.message]);
  expect(wrong.status).toBe(401);
});

test('an unknown email still runs a password comparison', async () => {
  const { auth, calls } = setup();
  await auth.login({ email: 'x@y.com', password: 'nope' }).catch(() => {});
  expect(calls.verify).toBe(1);
});