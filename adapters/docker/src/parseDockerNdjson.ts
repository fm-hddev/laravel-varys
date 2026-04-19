export interface DockerContainer {
  ID: string;
  Names: string;
  Image: string;
  State: string;
  Status: string;
  Labels: string;
  Ports: string;
}

/**
 * Parses `docker ps --format json` output (NDJSON — one JSON object per line).
 * Throws on malformed JSON.
 */
export function parseDockerNdjson(raw: string): DockerContainer[] {
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as DockerContainer);
}
