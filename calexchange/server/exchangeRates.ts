/**
 * Server-side exchange-rate fetching. Runs only in the Vercel function (and the
 * local dev server), so the optional API key never reaches the browser.
 *
 * Provider: ExchangeRate-API (https://www.exchangerate-api.com)
 *  - Without a key: the open-access endpoint (attribution required, daily updates).
 *  - With EXCHANGERATE_API_KEY: the authenticated v6 endpoint.
 */

export interface RatesPayload {
  provider: string;
  providerUrl: string;
  base: string;
  /** Units of each currency per 1 unit of `base`. */
  rates: Record<string, number>;
  /** When the provider last updated its rates (ms since epoch). */
  updatedAt: number;
  /** When the provider expects its next update (ms since epoch), if known. */
  nextUpdateAt: number | null;
  /** When this server fetched the rates (ms since epoch). */
  fetchedAt: number;
  /** Which endpoint served the data. */
  source: 'open-access' | 'api-key';
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

const BASE = 'USD';
const TIMEOUT_MS = 10_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface ProviderResponse {
  result?: string;
  'error-type'?: string;
  base_code?: string;
  time_last_update_unix?: number;
  time_next_update_unix?: number;
  rates?: Record<string, unknown>;
  conversion_rates?: Record<string, unknown>;
}

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-key': 'The exchange-rate API key is invalid. Check EXCHANGERATE_API_KEY.',
  'inactive-account': 'The exchange-rate API account is inactive.',
  'quota-reached': 'The exchange-rate API quota has been reached for this period.',
  'unsupported-code': 'The provider does not support the requested base currency.',
  'malformed-request': 'The exchange-rate request was malformed.',
};

export async function getLatestRates(
  apiKey: string | undefined = process.env.EXCHANGERATE_API_KEY,
  fetchImpl: FetchLike = fetch,
): Promise<RatesPayload> {
  const key = apiKey?.trim();
  const url = key
    ? `https://v6.exchangerate-api.com/v6/${encodeURIComponent(key)}/latest/${BASE}`
    : `https://open.er-api.com/v6/latest/${BASE}`;

  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    throw new ProviderError(timedOut ? 'The exchange-rate provider timed out.' : 'Could not reach the exchange-rate provider.', 504);
  }

  if (res.status === 429) {
    throw new ProviderError('The exchange-rate provider is rate limiting requests. Try again in a few minutes.', 503);
  }

  let body: ProviderResponse;
  try {
    body = (await res.json()) as ProviderResponse;
  } catch {
    throw new ProviderError(`The exchange-rate provider returned an unreadable response (HTTP ${res.status}).`);
  }

  if (body.result !== 'success') {
    const type = body['error-type'] ?? '';
    throw new ProviderError(ERROR_MESSAGES[type] ?? `The exchange-rate provider returned an error${type ? ` (${type})` : ''}.`);
  }

  const raw = body.conversion_rates ?? body.rates;
  if (!raw || typeof raw !== 'object') throw new ProviderError('The exchange-rate provider returned no rates.');

  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    if (/^[A-Z]{3}$/.test(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value;
  }
  if (!rates[BASE] || Object.keys(rates).length < 2) throw new ProviderError('The exchange-rate provider returned incomplete rates.');

  const updated = Number(body.time_last_update_unix);
  const next = Number(body.time_next_update_unix);

  return {
    provider: 'ExchangeRate-API',
    providerUrl: 'https://www.exchangerate-api.com',
    base: body.base_code ?? BASE,
    rates,
    updatedAt: Number.isFinite(updated) && updated > 0 ? updated * 1000 : Date.now(),
    nextUpdateAt: Number.isFinite(next) && next > 0 ? next * 1000 : null,
    fetchedAt: Date.now(),
    source: key ? 'api-key' : 'open-access',
  };
}

/** Builds the HTTP response for GET /api/rates. Shared by Vercel and the Vite dev server. */
export async function ratesResponse(): Promise<Response> {
  try {
    const payload = await getLatestRates();
    return Response.json(payload, {
      headers: {
        // Cache at Vercel's edge for an hour so the provider is called rarely,
        // and serve a slightly stale copy while revalidating.
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    const error = err instanceof ProviderError ? err : new ProviderError('Unexpected error while loading exchange rates.', 500);
    return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  }
}
