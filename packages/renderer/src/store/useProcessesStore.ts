import type { Process } from '@varys/core';
import { create } from 'zustand';

interface ProcessesState {
  processes: Process[];
  setProcesses: (processes: Process[]) => void;
}

export const useProcessesStore = create<ProcessesState>((set) => ({
  processes: [],
  setProcesses: (processes) => set({ processes }),
}));
