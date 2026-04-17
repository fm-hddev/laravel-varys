import fs from 'node:fs';
import path from 'node:path';

import { app } from 'electron';

import { ConfigSchema } from './ConfigSchema';
import type { Config } from './ConfigSchema';

const CONFIG_FILE = 'config.json';
const CONFIG_TMP = 'config.json.tmp';

export class ConfigStore {
  private config: Config;
  private readonly configPath: string;
  private readonly tmpPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, CONFIG_FILE);
    this.tmpPath = path.join(userDataPath, CONFIG_TMP);
    this.config = this.load();
  }

  private load(): Config {
    try {
      const raw = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const result = ConfigSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      // Invalid config — reset to defaults
      console.warn('[ConfigStore] Invalid config, resetting to defaults');
      const defaults = ConfigSchema.parse({});
      this.writeSync(defaults);
      return defaults;
    } catch (err) {
      // File absent or unreadable — create with defaults
      const defaults = ConfigSchema.parse({});
      this.writeSync(defaults);
      return defaults;
    }
  }

  private writeSync(config: Config): void {
    try {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(this.tmpPath, JSON.stringify(config, null, 2), 'utf8');
      fs.renameSync(this.tmpPath, this.configPath);
    } catch (err) {
      console.error('[ConfigStore] Failed to write config', err);
    }
  }

  save(): void {
    this.writeSync(this.config);
  }

  get(): Config {
    return this.config;
  }

  setActivePath(projectPath: string | null): void {
    this.config.activePath = projectPath;
    if (projectPath !== null) {
      this.addKnownPath(projectPath);
    }
    this.save();
  }

  getActivePath(): string | null {
    return this.config.activePath;
  }

  addKnownPath(projectPath: string): void {
    const existing = this.config.knownPaths.find((k) => k.projectPath === projectPath);
    const now = new Date().toISOString();
    if (existing) {
      existing.lastUsedAt = now;
    } else {
      const label = path.basename(projectPath);
      this.config.knownPaths.push({ label, projectPath, lastUsedAt: now });
    }
    this.save();
  }

  removeKnownPath(projectPath: string): void {
    this.config.knownPaths = this.config.knownPaths.filter(
      (k) => k.projectPath !== projectPath,
    );
    if (this.config.activePath === projectPath) {
      this.config.activePath = null;
    }
    this.save();
  }

  updateAdapterEnabled(adapterId: string, enabled: boolean): void {
    const current = this.config.adapters[adapterId];
    this.config.adapters[adapterId] = { ...current, enabled };
    this.save();
  }
}
