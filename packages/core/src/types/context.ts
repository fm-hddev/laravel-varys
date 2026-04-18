export interface ProjectContext {
  projectPath: string;
  env: Record<string, string>;
  composeProjectName?: string;
  dbConnection?: 'mysql' | 'pgsql' | 'sqlite';
  reverbScalingEnabled: boolean;
  redisHost: string;
  redisPort: number;
}

/** Connection overrides stored in Varys config (not in the project's .env). */
export interface ProjectOverrides {
  dbHost?: string;
  dbPort?: number;
  redisHost?: string;
  redisPort?: number;
  reverbHost?: string;
  reverbPort?: number;
  appUrl?: string;
}
