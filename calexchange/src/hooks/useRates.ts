import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OUTDATED_AFTER_MS,
  REFRESH_EVERY_MS,
  fetchRates,
  readCachedRates,
  writeCachedRates,
  type RatesData,
} from '../lib/rates';

export type RatesStatus =
  | 'loading' // first load, nothing to show yet
  | 'live' // fetched successfully during this visit
  | 'cached' // showing saved rates (still loading, or the latest refresh failed)
  | 'error'; // no rates at all

export interface RatesState {
  data: RatesData | null;
  status: RatesStatus;
  /** True while a request is in flight (also during background refreshes). */
  refreshing: boolean;
  error: string | null;
  /** Provider data is older than OUTDATED_AFTER_MS. */
  outdated: boolean;
  refresh: () => void;
}

export function useRates(): RatesState {
  const [data, setData] = useState<RatesData | null>(() => readCachedRates());
  const [status, setStatus] = useState<RatesStatus>(() => (readCachedRates() ? 'cached' : 'loading'));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef<AbortController | null>(null);
  const lastSuccess = useRef(0);

  const load = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setRefreshing(true);
    try {
      const fresh = await fetchRates(controller.signal);
      writeCachedRates(fresh);
      lastSuccess.current = Date.now();
      setData(fresh);
      setStatus('live');
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return; // superseded by a newer request
      setError(err instanceof Error ? err.message : 'Couldn’t load exchange rates.');
      setStatus((prev) => (prev === 'live' || readCachedRates() ? 'cached' : 'error'));
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setRefreshing(false);
      }
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    void load();
    const due = () => Date.now() - lastSuccess.current >= REFRESH_EVERY_MS;
    const tick = window.setInterval(() => {
      setNow(Date.now());
      if (due() && document.visibilityState === 'visible') void load();
    }, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && due()) void load();
    };
    const onOnline = () => void load();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      inFlight.current?.abort();
    };
  }, [load]);

  const outdated = !!data && now - data.updatedAt > OUTDATED_AFTER_MS;
  return { data, status, refreshing, error, outdated, refresh: () => void load() };
}
