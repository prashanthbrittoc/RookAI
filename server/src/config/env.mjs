import 'dotenv/config';

export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. See .env.example`);
  }
}