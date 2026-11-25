import { ratesResponse } from '../server/exchangeRates';

/** GET /api/rates: latest USD-based exchange rates, cached at Vercel's edge. */
export function GET(): Promise<Response> {
  return ratesResponse();
}
