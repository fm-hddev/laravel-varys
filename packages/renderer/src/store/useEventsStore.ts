import type { Broadcast } from '@varys/core';
import { create } from 'zustand';

const MAX_BUFFER = 1000;
const MAX_DISPLAY = 500;

interface EventsState {
  broadcasts: Broadcast[];
  pending: Broadcast[]; // buffered while paused
  paused: boolean;
  addBroadcasts: (bs: Broadcast[]) => void;
  setPaused: (paused: boolean) => void;
  flushPending: () => void;
  clearAll: () => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  broadcasts: [],
  pending: [],
  paused: false,
  addBroadcasts: (bs) =>
    set((state) => {
      if (state.paused) {
        const existingIds = new Set(state.pending.map((b) => b.id));
        const fresh = bs.filter((b) => !existingIds.has(b.id));
        return { pending: [...fresh, ...state.pending].slice(0, MAX_BUFFER) };
      }
      const existingIds = new Set(state.broadcasts.map((b) => b.id));
      const fresh = bs.filter((b) => !existingIds.has(b.id));
      if (fresh.length === 0) return state;
      const merged = [...fresh, ...state.broadcasts].slice(0, MAX_DISPLAY);
      merged.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      return { broadcasts: merged };
    }),
  setPaused: (paused) => set({ paused }),
  flushPending: () =>
    set((state) => {
      const merged = [...state.pending, ...state.broadcasts].slice(0, MAX_DISPLAY);
      merged.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      return { broadcasts: merged, pending: [] };
    }),
  clearAll: () => set({ broadcasts: [], pending: [] }),
}));
