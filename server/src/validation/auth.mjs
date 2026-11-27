import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);

export const signupSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
});

// Login doesn't enforce the length rule, so we don't reveal the password policy to guessers
export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });