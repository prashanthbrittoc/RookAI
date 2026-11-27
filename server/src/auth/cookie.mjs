export const COOKIE_NAME = 'rookai_token';

export function cookieOptions(nodeEnv = process.env.NODE_ENV) {
  const prod = nodeEnv === 'production';
  return {
    httpOnly: true,                    // JavaScript in the page cannot read it
    secure: prod,                      // HTTPS only in production
    sameSite: prod ? 'none' : 'lax',   // Vercel and Railway are different sites in production
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}