import type { KnownPath } from '@varys/core';
import { create } from 'zustand';

interface ProjectState {
  activePath: string | null;
  knownPaths: KnownPath[];
  sessionId: string | null;
  setActivePath: (path: string | null) => void;
  setKnownPaths: (paths: KnownPath[]) => void;
  setSessionId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  activePath: null,
  knownPaths: [],
  sessionId: null,
  setActivePath: (path) => set({ activePath: path }),
  setKnownPaths: (paths) => set({ knownPaths: paths }),
  setSessionId: (id) => set({ sessionId: id }),
}));
