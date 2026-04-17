import { useQuery } from '@tanstack/react-query';

export function useQueueStats() {
  return useQuery({
    queryKey: ['queues:stats'],
    queryFn: () => window.varys.invoke('queues:stats'),
    refetchInterval: 2000,
  });
}

export function useFailedJobs() {
  return useQuery({
    queryKey: ['queues:failed'],
    queryFn: () => window.varys.invoke('queues:failed'),
    refetchInterval: 2000,
  });
}
