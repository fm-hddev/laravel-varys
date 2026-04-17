export interface ProjectContext {
  projectPath: string;
  env: Record<string, string>;
  composeProjectName?: string;
  dbConnection?: 'mysql' | 'pgsql' | 'sqlite';
  reverbScalingEnabled: boolean;
  redisHost: string;
  redisPort: number;
}
