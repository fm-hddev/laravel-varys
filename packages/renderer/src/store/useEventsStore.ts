import type { Broadcast } from '@varys/core';
import { create } from 'zustand';

const MAX_BROADCASTS = 1000;

interface EventsState {
  broadcasts: Broadcast[];
  paused: boolean;
  addBroadcast: (b: Broadcast) => void;
  setBroadcasts: (bs: Broadcast[]) => void;
  setPaused: (paused: boolean) => void;
}

export const useEventsStore = create<EventsState>((set) => ({
  broadcasts: [],
  paused: false,
  addBroadcast: (b) =>
    set((state) => ({
      broadcasts: [b, ...state.broadcasts].slice(0, MAX_BROADCASTS),
    })),
  setBroadcasts: (bs) => set({ broadcasts: bs }),
  setPaused: (paused) => set({ paused }),
}));
