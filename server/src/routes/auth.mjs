import { Router } from 'express';
import { asyncHandler } from '../utils/http-error.mjs';
import { signupSchema, loginSchema } from '../validation/auth.mjs';
import { signToken } from '../auth/tokens.mjs';
import { COOKIE_NAME, cookieOptions } from '../auth/cookie.mjs';

export function createAuthRouter({ auth }) {
  const r = Router();

  r.post('/signup', asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);   // throws ZodError -> 400
    const user = await auth.signup(input);
    res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions());
    res.status(201).json({ user });
  }));

  r.post('/login', asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await auth.login(input);
    res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions());
    res.json({ user });
  }));

  return r;
}