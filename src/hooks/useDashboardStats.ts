import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';

export function useDashboardStats(date?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', date],
    queryFn: () => dashboardApi.getStats(date),
  });
}
