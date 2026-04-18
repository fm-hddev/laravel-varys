/**
 * Browser mock for window.varys (injected by Electron preload in production).
 * Used only in dev mode outside Electron.
 */

const FAKE_PATH = '/Users/frederic.m/PhpstormProjects/main-api';

const handlers: Record<string, (...args: unknown[]) => Promise<unknown>> = {
  'project:openDialog': () => Promise.resolve(FAKE_PATH),
  'project:setActivePath': () => Promise.resolve(undefined),
  'project:getActivePath': () => Promise.resolve(FAKE_PATH),
  'project:listKnownPaths': () =>
    Promise.resolve([
      { label: 'my-laravel-app', projectPath: FAKE_PATH, lastUsedAt: new Date() },
    ]),
  'project:removeKnownPath': () => Promise.resolve(undefined),
  'project:updateAdapterConfig': () => Promise.resolve(undefined),
  'project:health': () =>
    Promise.resolve({
      probedAt: new Date(),
      adapters: [
        { id: 'dotenv', name: '.env', result: { available: true } },
        { id: 'docker', name: 'Docker', result: { available: true } },
        { id: 'artisan', name: 'Artisan', result: { available: false, reason: 'php not found' } },
        { id: 'vite-process', name: 'Vite', result: { available: true } },
        { id: 'log-file', name: 'Log file', result: { available: true } },
        { id: 'laravel-queue', name: 'Queue', result: { available: false, reason: 'No worker running' } },
      ],
    }),
  'processes:list': () =>
    Promise.resolve([
      { id: 'p1', name: 'nginx', type: 'docker', status: 'up', uptime: 3600, adapterSource: 'docker' },
      { id: 'p2', name: 'php-fpm', type: 'docker', status: 'up', uptime: 3600, adapterSource: 'docker' },
      { id: 'p3', name: 'queue:work', type: 'artisan', status: 'down', adapterSource: 'artisan' },
      { id: 'p4', name: 'vite', type: 'vite', status: 'up', uptime: 120, adapterSource: 'vite-process' },
    ]),
  'events:broadcast': () =>
    Promise.resolve([
      {
        id: 'b1',
        channel: 'App.Models.User.1',
        event: 'App\\Events\\OrderShipped',
        payload: { orderId: 42 },
        receivedAt: new Date(),
      },
    ]),
  'events:resetStream': () => Promise.resolve(undefined),
  'queues:stats': () =>
    Promise.resolve({
      driver: 'database',
      queues: [
        { name: 'default', pending: 3, processing: 1, failed: 0 },
        { name: 'emails', pending: 0, processing: 0, failed: 2 },
      ],
    }),
  'queues:failed': () =>
    Promise.resolve([
      {
        id: 1,
        queue: 'emails',
        payload: { job: 'SendWelcomeEmail' },
        exception: 'Swift_TransportException: Connection refused',
        failedAt: new Date(Date.now() - 60000),
      },
      {
        id: 2,
        queue: 'emails',
        payload: { job: 'SendPasswordReset' },
        exception: 'Swift_TransportException: Connection refused',
        failedAt: new Date(Date.now() - 120000),
      },
    ]),
  'logs:listFiles': () => Promise.resolve(['laravel.log', 'worker.log']),
  'stream:subscribe': () => Promise.resolve(undefined),
  'stream:unsubscribe': () => Promise.resolve(undefined),
  'project:getOverrides': () =>
    Promise.resolve({
      overrides: {},
      envDefaults: {
        dbHost: '127.0.0.1',
        dbPort: 3306,
        redisHost: '127.0.0.1',
        redisPort: 6379,
        reverbHost: '127.0.0.1',
        reverbPort: 8080,
        appUrl: 'http://localhost',
      },
    }),
  'project:setOverrides': () => Promise.resolve(undefined),
};

export function installBrowserMock() {
  if (typeof window.varys !== 'undefined') return;

  window.varys = {
    invoke: (channel, ...args) => {
      const handler = handlers[channel];
      if (!handler) return Promise.reject(new Error(`[mock] No handler for channel: ${channel}`));
      return handler(...args) as never;
    },
    on: (_channel, _listener) => {
      // No-op: push events not simulated in browser mode
      return () => {};
    },
  };

  console.info('[varys mock] window.varys installed for browser dev mode');
}
