import * as http from 'node:http';
import { AddressInfo } from 'node:net';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';

import { ReverbRedisAdapter } from '../ReverbRedisAdapter.js';

// ---------------------------------------------------------------------------
// Helpers — minimal Reverb/Pusher WebSocket server fixture
// ---------------------------------------------------------------------------

interface ServerFixture {
  httpServer: http.Server;
  wss: WebSocketServer;
  port: number;
  /** Broadcast a Pusher-style event to all connected clients */
  broadcast(channel: string, event: string, data: unknown): void;
}

async function startFixture(): Promise<ServerFixture> {
  const httpServer = http.createServer((_req, res) => {
    // Always respond with an empty channels list for simplicity
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ channels: {} }));
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    // Send connection_established immediately
    const socketId = '123.456';
    ws.send(
      JSON.stringify({
        event: 'pusher:connection_established',
        data: JSON.stringify({ socket_id: socketId, activity_timeout: 120 }),
      }),
    );

    // Echo subscribe confirmations
    ws.on('message', (raw) => {
      try {
        const text = Buffer.isBuffer(raw) ? raw.toString('utf-8') : String(raw);
        const msg = JSON.parse(text) as { event: string; data: { channel: string } };
        if (msg.event === 'pusher:subscribe') {
          ws.send(
            JSON.stringify({
              event: 'pusher_internal:subscription_succeeded',
              channel: msg.data.channel,
              data: '{}',
            }),
          );
        }
      } catch {
        // ignore
      }
    });
  });

  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const port = (httpServer.address() as AddressInfo).port;

  return {
    httpServer,
    wss,
    port,
    broadcast(channel, event, data) {
      const msg = JSON.stringify({ event, channel, data: JSON.stringify(data) });
      for (const client of wss.clients) {
        client.send(msg);
      }
    },
  };
}

async function stopFixture(fixture: ServerFixture): Promise<void> {
  await new Promise<void>((resolve) => fixture.wss.close(() => resolve()));
  await new Promise<void>((resolve) => fixture.httpServer.close(() => resolve()));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReverbRedisAdapter (WebSocket)', () => {
  let fixture: ServerFixture;

  beforeEach(async () => {
    fixture = await startFixture();
  });

  afterEach(async () => {
    await stopFixture(fixture);
  });

  it('probe() returns available:true when HTTP API is reachable', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: fixture.port,
      appId: 'test-app',
      appKey: 'test-key',
      appSecret: 'test-secret',
    });
    const result = await adapter.probe();
    expect(result.available).toBe(true);
  });

  it('probe() returns available:false when server is unreachable', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: 1,
      appId: 'test-app',
      appKey: 'test-key',
      appSecret: 'test-secret',
    });
    const result = await adapter.probe();
    expect(result.available).toBe(false);
    if (!result.available) expect(result.reason).toBeTruthy();
  });

  it('streamBroadcasts() receives broadcast events', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: fixture.port,
      appId: 'test-app',
      appKey: 'test-key',
      appSecret: 'test-secret',
    });

    const received: import('@varys/core').Broadcast[] = [];
    const unsubscribe = await adapter.streamBroadcasts((broadcast) => {
      received.push(broadcast);
    });

    // Wait for connection to be established
    await new Promise((r) => setTimeout(r, 100));

    fixture.broadcast('orders', 'App\\Events\\OrderShipped', { orderId: 1 });
    fixture.broadcast('payments', 'App\\Events\\PaymentProcessed', { amount: 99 });

    await new Promise((r) => setTimeout(r, 200));

    void unsubscribe();

    expect(received).toHaveLength(2);
    expect(received[0]?.event).toBe('App\\Events\\OrderShipped');
    expect(received[0]?.channel).toBe('orders');
    expect(received[0]?.payload).toEqual({ orderId: 1 });
    expect(received[0]?.id).toBeTruthy();
    expect(received[0]?.receivedAt).toBeInstanceOf(Date);
    expect(received[1]?.event).toBe('App\\Events\\PaymentProcessed');
  }, 15_000);

  it('streamBroadcasts() ignores pusher: internal events', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: fixture.port,
      appId: 'test-app',
      appKey: 'test-key',
      appSecret: 'test-secret',
    });

    const received: import('@varys/core').Broadcast[] = [];
    const unsubscribe = await adapter.streamBroadcasts((broadcast) => {
      received.push(broadcast);
    });

    await new Promise((r) => setTimeout(r, 100));

    // Send an internal pusher event — should be ignored
    for (const client of fixture.wss.clients) {
      client.send(JSON.stringify({ event: 'pusher:pong', data: '{}' }));
    }

    // Send a real event
    fixture.broadcast('ch', 'real-event', { x: 1 });

    await new Promise((r) => setTimeout(r, 200));

    void unsubscribe();

    expect(received).toHaveLength(1);
    expect(received[0]?.event).toBe('real-event');
  }, 15_000);

  it('unsubscribe() closes the WebSocket connection', async () => {
    const adapter = new ReverbRedisAdapter({
      host: '127.0.0.1',
      port: fixture.port,
      appId: 'test-app',
      appKey: 'test-key',
      appSecret: 'test-secret',
    });

    const unsubscribe = await adapter.streamBroadcasts(() => undefined);
    await new Promise((r) => setTimeout(r, 100));

    expect(fixture.wss.clients.size).toBe(1);

    void unsubscribe();

    await new Promise((r) => setTimeout(r, 200));

    expect(fixture.wss.clients.size).toBe(0);
  }, 15_000);
});
