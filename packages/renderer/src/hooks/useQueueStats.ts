import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export function useRetryFailedJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => window.varys.invoke('queues:retryJob', { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues:failed'] }),
  });
}

export function useForgetFailedJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => window.varys.invoke('queues:forgetJob', { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues:failed'] }),
  });
}

export function usePurgeAllFailedJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => window.varys.invoke('queues:purgeAll'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['queues:failed'] }),
  });
}
