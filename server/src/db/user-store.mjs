import { User } from './models/User.mjs';

export class DuplicateEmailError extends Error {}

const plain = (u) => (u ? { id: String(u._id), email: u.email, plan: u.plan, passwordHash: u.passwordHash } : null);

export const mongoUserStore = {
  async findByEmail(email) {
    return plain(await User.findOne({ email }).select('+passwordHash').lean());
  },
  async create({ email, passwordHash }) {
    try {
      return plain(await User.create({ email, passwordHash }));
    } catch (e) {
      if (e.code === 11000) throw new DuplicateEmailError(); // the unique index is the real guard
      throw e;
    }
  },
};