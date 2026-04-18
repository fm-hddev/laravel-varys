import { describe, expect, it } from 'vitest';

import { normalizePayload } from '../normalizePayload.js';

describe('normalizePayload', () => {
  it('extracts event, channel and data from a standard Reverb payload', () => {
    const raw = JSON.stringify({
      event: 'App\\Events\\OrderShipped',
      channel: 'orders',
      data: { orderId: 42 },
    });

    const result = normalizePayload(raw);

    expect(result.event).toBe('App\\Events\\OrderShipped');
    expect(result.channel).toBe('orders');
    expect(result.data).toEqual({ orderId: 42 });
  });

  it('handles data as a JSON string (double-encoded)', () => {
    const raw = JSON.stringify({
      event: 'test.event',
      channel: 'private-user.1',
      data: JSON.stringify({ key: 'value' }),
    });

    const result = normalizePayload(raw);

    expect(result.data).toEqual({ key: 'value' });
  });

  it('handles data as a plain string', () => {
    const raw = JSON.stringify({
      event: 'ping',
      channel: 'presence-room',
      data: 'hello',
    });

    const result = normalizePayload(raw);

    expect(result.data).toBe('hello');
  });

  it('preserves optional socket_id field', () => {
    const raw = JSON.stringify({
      event: 'test',
      channel: 'test-channel',
      data: null,
      socket_id: 'abc.123',
    });

    const result = normalizePayload(raw);

    expect(result.socketId).toBe('abc.123');
  });

  it('throws on invalid JSON', () => {
    expect(() => normalizePayload('not-json')).toThrow();
  });

  it('throws when event field is missing', () => {
    const raw = JSON.stringify({ channel: 'ch', data: {} });
    expect(() => normalizePayload(raw)).toThrow(/event/);
  });

  it('throws when channel field is missing', () => {
    const raw = JSON.stringify({ event: 'ev', data: {} });
    expect(() => normalizePayload(raw)).toThrow(/channel/);
  });
});
