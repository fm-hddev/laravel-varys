export interface NormalizedPayload {
  event: string;
  channel: string;
  data: unknown;
  socketId?: string;
}

/**
 * Parses and normalizes a raw Redis message from the Reverb `reverb` channel.
 *
 * Reverb publishes: { event, channel, data, socket_id?, application? }
 * `data` may itself be a JSON-encoded string (double-encoded) — we unwrap it.
 */
export function normalizePayload(raw: string): NormalizedPayload {
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Reverb payload must be a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj['event'] !== 'string') {
    throw new Error('Reverb payload missing required field: event');
  }

  if (typeof obj['channel'] !== 'string') {
    throw new Error('Reverb payload missing required field: channel');
  }

  let data: unknown = obj['data'];

  // Reverb sometimes double-encodes `data` as a JSON string
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Not JSON — keep as plain string
    }
  }

  return {
    event: obj['event'],
    channel: obj['channel'],
    data,
    ...(typeof obj['socket_id'] === 'string' ? { socketId: obj['socket_id'] } : {}),
  };
}
