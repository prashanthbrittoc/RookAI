import Anthropic from '@anthropic-ai/sdk';

export class BadOutputError extends Error {
  constructor(message, usage) {
    super(message);
    this.name = 'BadOutputError';
    this.usage = usage; // tokens spent on the failed attempts still cost money
  }
}

export function classifyError(e) {
  if (e instanceof BadOutputError) return { kind: 'bad-output', retryable: false };
  if (e instanceof Anthropic.APIConnectionError) return { kind: 'network', retryable: true };
  const s = e?.status;
  if (s === 401 || s === 403) return { kind: 'auth', retryable: false };
  if (s === 429) return { kind: 'rate-limit', retryable: true };
  if (s >= 500) return { kind: 'server', retryable: true };
  if (s >= 400) return { kind: 'bad-request', retryable: false };
  return { kind: 'unknown', retryable: false };
}