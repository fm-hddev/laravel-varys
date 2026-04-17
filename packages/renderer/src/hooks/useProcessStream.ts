import { useQuery } from '@tanstack/react-query';

import { useIpc } from '@/hooks/useIpc';
import { useProcessesStore } from '@/store/useProcessesStore';

export function useProcessStream() {
  const ipc = useIpc();
  const setProcesses = useProcessesStore((s) => s.setProcesses);

  return useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const processes = await ipc.listProcesses();
      setProcesses(processes);
      return processes;
    },
    refetchInterval: 2000,
  });
}
