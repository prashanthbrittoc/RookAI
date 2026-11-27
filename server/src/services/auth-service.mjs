import { hashPassword, verifyPassword } from '../auth/password.mjs';
import { DuplicateEmailError } from '../db/user-store.mjs';
import { HttpError } from '../utils/http-error.mjs';

const publicUser = (u) => ({ id: u.id, email: u.email, plan: u.plan });

export function createAuthService({ users, hash = hashPassword, verify = verifyPassword }) {
  // Compared against when the email doesn't exist, so "no such user" takes about as long as "wrong password"
  let dummyHash;

  async function signup({ email, password }) {
    const passwordHash = await hash(password);
    try {
      return publicUser(await users.create({ email, passwordHash }));
    } catch (e) {
      if (e instanceof DuplicateEmailError) throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
      throw e;
    }
  }

  async function login({ email, password }) {
    const user = await users.findByEmail(email);
    dummyHash ??= await hash('not-a-real-password');
    const ok = await verify(password, user?.passwordHash ?? dummyHash);
    if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    return publicUser(user);
  }

  return { signup, login };
}