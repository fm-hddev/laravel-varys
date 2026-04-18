import { v4 as uuidv4 } from 'uuid';

let sessionId: string = uuidv4();

export function currentSessionId(): string {
  return sessionId;
}

export function newSession(): string {
  sessionId = uuidv4();
  return sessionId;
}
