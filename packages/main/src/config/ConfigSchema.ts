import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  activePath: z.string().nullable().default(null),
  knownPaths: z
    .array(
      z.object({
        label: z.string(),
        projectPath: z.string(),
        lastUsedAt: z.string(),
      }),
    )
    .default([]),
  ui: z
    .object({
      eventsBufferSize: z.number().default(1000),
    })
    .default({}),
  adapters: z.record(z.string(), z.object({ enabled: z.boolean().default(true) })).default({}),
  projectOverrides: z
    .record(
      z.string(),
      z.object({
        dbHost: z.string().optional(),
        dbPort: z.number().optional(),
        redisHost: z.string().optional(),
        redisPort: z.number().optional(),
        reverbHost: z.string().optional(),
        reverbPort: z.number().optional(),
        appUrl: z.string().optional(),
      }),
    )
    .default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
