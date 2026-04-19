import { describe, expect, it } from 'vitest';

import { currentSessionId, newSession } from '../adapters/SessionManager';

describe('SessionManager', () => {
  it('returns a non-empty sessionId', () => {
    expect(currentSessionId()).toBeTruthy();
  });

  it('newSession generates a different sessionId', () => {
    const prev = currentSessionId();
    const next = newSession();
    expect(next).not.toBe(prev);
  });
});
