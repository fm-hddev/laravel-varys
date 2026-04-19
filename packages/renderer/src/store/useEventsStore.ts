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
        return { pending: [...bs, ...state.pending].slice(0, MAX_BUFFER) };
      }
      return { broadcasts: [...bs, ...state.broadcasts].slice(0, MAX_DISPLAY) };
    }),
  setPaused: (paused) => set({ paused }),
  flushPending: () =>
    set((state) => ({
      broadcasts: [...state.pending, ...state.broadcasts].slice(0, MAX_DISPLAY),
      pending: [],
    })),
  clearAll: () => set({ broadcasts: [], pending: [] }),
}));
