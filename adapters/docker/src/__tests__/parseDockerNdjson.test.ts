import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseDockerNdjson } from '../parseDockerNdjson.js';

const FIXTURE = path.join(import.meta.dirname, '../../fixtures/docker-ps-sample.ndjson');

describe('parseDockerNdjson()', () => {
  it('parses 4 containers from fixture', () => {
    const raw = fs.readFileSync(FIXTURE, 'utf8');
    const containers = parseDockerNdjson(raw);
    expect(containers).toHaveLength(4);
  });

  it('each container has ID, Names, State, Labels fields', () => {
    const raw = fs.readFileSync(FIXTURE, 'utf8');
    const containers = parseDockerNdjson(raw);
    for (const c of containers) {
      expect(c).toHaveProperty('ID');
      expect(c).toHaveProperty('Names');
      expect(c).toHaveProperty('State');
      expect(c).toHaveProperty('Labels');
    }
  });

  it('skips empty lines gracefully', () => {
    const result = parseDockerNdjson('{"ID":"a1","Names":"n","State":"running","Labels":"","Status":"Up","Image":"img","Ports":""}\n\n');
    expect(result).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    expect(parseDockerNdjson('')).toEqual([]);
    expect(parseDockerNdjson('   \n  ')).toEqual([]);
  });

  it('throws on malformed JSON line', () => {
    expect(() => parseDockerNdjson('not-valid-json')).toThrow();
  });
});
