import { useState, useEffect, useMemo, useCallback } from 'react';
import type { UrlAnalyse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [urlAnalyse, setUrlAnalyse] = useState<UrlAnalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [urlAnalyseData] = await Promise.all([
        LivingAppsService.getUrlAnalyse(),
      ]);
      setUrlAnalyse(urlAnalyseData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { urlAnalyse, setUrlAnalyse, loading, error, fetchAll };
}