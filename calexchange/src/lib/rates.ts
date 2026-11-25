/** Client-side access to /api/rates, with a localStorage copy of the last good response. */

export interface RatesData {
  provider: string;
  providerUrl: string;
  base: string;
  rates: Record<string, number>;
  updatedAt: number;
  nextUpdateAt: number | null;
  fetchedAt: number;
  source: 'open-access' | 'api-key';
}

export const RATES_ENDPOINT = '/api/rates';
const CACHE_KEY = 'calexchange:rates';
const TIMEOUT_MS = 15_000;
/** Rates older than this (by the provider's own timestamp) are labelled outdated. */
export const OUTDATED_AFTER_MS = 48 * 60 * 60 * 1000;
/** How often the app asks the server for fresh rates while open. */
export const REFRESH_EVERY_MS = 60 * 60 * 1000;

export function isRatesData(value: unknown): value is RatesData {
  const v = value as RatesData;
  return (
    !!v &&
    typeof v === 'object' &&
    typeof v.provider === 'string' &&
    typeof v.base === 'string' &&
    typeof v.updatedAt === 'number' &&
    !!v.rates &&
    typeof v.rates === 'object' &&
    typeof v.rates[v.base] === 'number'
  );
}

export async function fetchRates(signal?: AbortSignal): Promise<RatesData> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal && 'any' in AbortSignal ? AbortSignal.any([signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await fetch(RATES_ENDPOINT, { signal: combined, headers: { accept: 'application/json' } });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') throw new Error('The rate server took too long to respond.');
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new Error(navigator.onLine === false ? 'You appear to be offline.' : 'Couldn’t reach the rate server.');
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(`The rate server sent an unreadable response (HTTP ${res.status}).`);
  }
  if (!res.ok) {
    const message = (body as { error?: string })?.error;
    throw new Error(message || `The rate server returned an error (HTTP ${res.status}).`);
  }
  if (!isRatesData(body)) throw new Error('The rate server returned incomplete data.');
  return body;
}

export function readCachedRates(): RatesData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isRatesData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedRates(data: RatesData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable: the app still works without the cache */
  }
}

/** Converts using USD-based (or any common-base) rates. Null if either code has no rate. */
export function convert(amount: number, from: string, to: string, rates: Record<string, number>): number | null {
  const f = rates[from];
  const t = rates[to];
  if (!f || !t) return null;
  return (amount / f) * t;
}
