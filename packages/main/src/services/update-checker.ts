import type { UpdateInfo } from '@varys/core';
import { net } from 'electron';

const GITHUB_REPO = 'fm-hddev/laravel-varys';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo> {
  return new Promise((resolve) => {
    const request = net.request({ method: 'GET', url: API_URL });

    request.setHeader('User-Agent', `Varys/${currentVersion}`);
    request.setHeader('Accept', 'application/vnd.github+json');

    let body = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      response.on('end', () => {
        try {
          const json = JSON.parse(body) as { tag_name: string; html_url: string };
          const latestVersion = json.tag_name.replace(/^v/, '');
          const available = isNewer(latestVersion, currentVersion);
          resolve({ available, latestVersion, currentVersion, releaseUrl: json.html_url });
        } catch {
          resolve({ available: false, latestVersion: '', currentVersion, releaseUrl: '' });
        }
      });
    });

    request.on('error', () => {
      resolve({ available: false, latestVersion: '', currentVersion, releaseUrl: '' });
    });

    request.end();
  });
}

function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  const [lMaj, lMin, lPatch] = parse(latest);
  const [cMaj, cMin, cPatch] = parse(current);

  if (lMaj !== cMaj) return (lMaj ?? 0) > (cMaj ?? 0);
  if (lMin !== cMin) return (lMin ?? 0) > (cMin ?? 0);
  return (lPatch ?? 0) > (cPatch ?? 0);
}