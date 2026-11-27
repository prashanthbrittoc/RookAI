import bcrypt from 'bcrypt';

const COST = Number(process.env.BCRYPT_COST || 12);
export const hashPassword = (pw, cost = COST) => bcrypt.hash(pw, cost);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);