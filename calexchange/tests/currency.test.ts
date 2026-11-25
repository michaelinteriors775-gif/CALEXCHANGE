import { describe, expect, it, vi } from 'vitest';
import fixture from './fixtures/open-er-api-usd.json';
import { AFRICAN, MAJOR, buildCatalogue, searchCurrencies } from '../src/lib/currencies';
import { formatAmount, formatNumber, formatRate } from '../src/lib/format';
import { convert } from '../src/lib/rates';
import { ProviderError, getLatestRates, ratesResponse } from '../server/exchangeRates';

const rates = fixture.rates as Record<string, number>;
const catalogue = buildCatalogue(Object.keys(rates));

const REQUIRED_AFRICAN = [
  'NGN', 'GHS', 'ZAR', 'KES', 'UGX', 'TZS', 'EGP', 'MAD', 'RWF', 'XAF', 'XOF', 'ETB', 'ZMW', 'BWP', 'MWK', 'AOA', 'MZN',
  'NAD', 'MUR', 'SCR', 'GMD', 'SLE', 'LRD', 'SDG', 'SSP', 'DZD', 'TND', 'CDF', 'BIF', 'SOS', 'ERN', 'LSL', 'SZL', 'CVE',
  'MRU', 'STN', 'KMF', 'DJF',
];
const REQUIRED_INTERNATIONAL = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'INR', 'KRW', 'CHF', 'SGD', 'HKD', 'AED', 'SAR', 'TRY', 'BRL',
  'MXN', 'RUB', 'PKR', 'BDT', 'PHP', 'IDR', 'THB', 'MYR', 'VND', 'QAR', 'KWD', 'BHD', 'OMR', 'ILS',
];

describe('currency catalogue', () => {
  it('offers every required African and international currency', () => {
    for (const code of [...REQUIRED_AFRICAN, ...REQUIRED_INTERNATIONAL]) {
      expect(catalogue.bySupported.has(code), code).toBe(true);
    }
    expect(AFRICAN).toEqual(expect.arrayContaining(REQUIRED_AFRICAN));
    expect(MAJOR).toEqual(expect.arrayContaining(REQUIRED_INTERNATIONAL));
  });

  it('includes the full provider catalogue, minus non-ISO and withdrawn codes', () => {
    expect(catalogue.supported.length).toBeGreaterThanOrEqual(150);
    for (const code of ['CNH', 'GGP', 'IMP', 'JEP', 'FOK', 'KID', 'TVD', 'SLL', 'HRK', 'ZWL']) {
      expect(catalogue.bySupported.has(code), code).toBe(false);
    }
  });

  it('gives every supported currency a real name', () => {
    for (const c of catalogue.supported) expect(c.name, c.code).not.toBe(c.code);
  });

  it('lists known currencies without a rate as unavailable', () => {
    expect(catalogue.unavailable.map((c) => c.code)).toContain('KPW');
  });
});

describe('currency search', () => {
  const codes = (q: string) => searchCurrencies(catalogue.supported, q).map((c) => c.code);
  it('matches codes first', () => {
    expect(codes('ngn')[0]).toBe('NGN');
    expect(codes('GH')[0]).toBe('GHS');
  });
  it('matches currency names', () => {
    expect(codes('naira')).toEqual(['NGN']);
    expect(codes('cedi')).toContain('GHS');
    expect(codes('rand')).toContain('ZAR');
  });
  it('matches countries and regions, ignoring accents', () => {
    expect(codes('Nigeria')).toContain('NGN');
    expect(codes('Senegal')).toContain('XOF');
    expect(codes('Cameroon')).toContain('XAF');
    expect(codes('sao tome')).toContain('STN');
    expect(codes('cote d')).toContain('XOF');
  });
  it('returns nothing for nonsense', () => {
    expect(codes('zzzz')).toEqual([]);
  });
});

describe('conversion with real provider data (24 Nov 2026)', () => {
  const c = (amount: number, from: string, to: string) => convert(amount, from, to, rates)!;
  it('USD ↔ NGN', () => {
    expect(c(1, 'USD', 'NGN')).toBeCloseTo(1380.144451, 6);
    expect(c(1380.144451, 'NGN', 'USD')).toBeCloseTo(1, 9);
    expect(formatAmount(c(100, 'USD', 'NGN'), 'NGN')).toBe('138,014.45');
  });
  it('GHS ↔ USD', () => {
    expect(c(1, 'USD', 'GHS')).toBeCloseTo(11.82818, 6);
    expect(c(100, 'GHS', 'USD')).toBeCloseTo(100 / 11.82818, 9);
  });
  it('ZAR → NGN via the common base', () => {
    expect(c(1, 'ZAR', 'NGN')).toBeCloseTo(1380.144451 / 17.428652, 9);
  });
  it('other pairs: NGN→GBP, EUR→NGN, KES→USD, USD→JPY, GBP→CAD', () => {
    expect(c(10000, 'NGN', 'GBP')).toBeCloseTo((10000 / 1380.144451) * 0.766672, 9);
    expect(c(1, 'EUR', 'NGN')).toBeCloseTo(1380.144451 / 0.915641, 6);
    expect(c(1000, 'KES', 'USD')).toBeCloseTo(1000 / 130.093683, 9);
    expect(formatAmount(c(100, 'USD', 'JPY'), 'JPY')).toBe('15,906');
    expect(c(1, 'GBP', 'CAD')).toBeCloseTo(1.435985 / 0.766672, 9);
  });
  it('round-trips without drift', () => {
    expect(c(c(250, 'XOF', 'MAD'), 'MAD', 'XOF')).toBeCloseTo(250, 9);
  });
  it('returns null for a currency with no rate', () => {
    expect(convert(1, 'USD', 'KPW', rates)).toBeNull();
  });
  it('formats very large amounts without losing digits', () => {
    expect(formatAmount(c(1e9, 'USD', 'IRR'), 'IRR')).toBe('1,784,324,551,707,000');
    expect(formatAmount(c(1e9, 'USD', 'NGN'), 'NGN')).toBe('1,380,144,451,000.00');
    expect(formatAmount(c(2 ** 40, 'KES', 'JPY'), 'JPY')).toBe('1,344,340,444,870');
    expect(formatNumber(999999999 * 999999999)).toBe('9.99999998e+17');
    expect(formatNumber(123456789 * 987654321)).toBe('1.21932631112635e+17');
    expect(formatNumber(2 ** 50)).toBe('1,125,899,906,842,624');
    expect(formatNumber(2 ** 100)).toBe('1.26765060022823e+30');
    expect(formatNumber(987654321123.456)).toBe('987,654,321,123.456');
  });
  it('formats currency decimals and small rates sensibly', () => {
    expect(formatAmount(1.5, 'KWD')).toBe('1.500');
    expect(formatAmount(1234.5, 'USD')).toBe('1,234.50');
    expect(formatRate(1 / 1380.144451)).toBe('0.000724562');
    expect(formatRate(1380.144451)).toBe('1,380.14');
  });
});

describe('server: getLatestRates', () => {
  const ok = (body: unknown, status = 200) =>
    vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

  it('uses the open-access endpoint without a key and normalises the payload', async () => {
    const fetchMock = ok(fixture);
    const data = await getLatestRates('', fetchMock);
    expect(fetchMock).toHaveBeenCalledWith('https://open.er-api.com/v6/latest/USD', expect.anything());
    expect(data.source).toBe('open-access');
    expect(data.base).toBe('USD');
    expect(data.rates.NGN).toBe(1380.144451);
    expect(data.updatedAt).toBe(1795478551 * 1000);
    expect(data.nextUpdateAt).toBe(1795566781 * 1000);
  });

  it('uses the keyed v6 endpoint when a key is set, without leaking it in errors', async () => {
    const keyed = { ...fixture, rates: undefined, conversion_rates: fixture.rates };
    const fetchMock = ok(keyed);
    const data = await getLatestRates('secret-key', fetchMock);
    expect(fetchMock.mock.calls[0][0]).toBe('https://v6.exchangerate-api.com/v6/secret-key/latest/USD');
    expect(data.source).toBe('api-key');
    expect(data.rates.GHS).toBe(11.82818);

    const err = await getLatestRates('secret-key', ok({ result: 'error', 'error-type': 'invalid-key' })).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.message).not.toContain('secret-key');
    expect(err.message).toMatch(/invalid/);
  });

  it('reports quota, rate limiting, network failures and bad data', async () => {
    await expect(getLatestRates('k', ok({ result: 'error', 'error-type': 'quota-reached' }))).rejects.toThrow(/quota/);
    await expect(getLatestRates('', ok({}, 429))).rejects.toThrow(/rate limiting/);
    await expect(getLatestRates('', vi.fn(async () => { throw new TypeError('fetch failed'); }))).rejects.toThrow(/Could not reach/);
    await expect(getLatestRates('', vi.fn(async () => new Response('<html>oops</html>', { status: 500 })))).rejects.toThrow(/unreadable/);
    await expect(getLatestRates('', ok({ result: 'success', rates: { EUR: 1 } }))).rejects.toThrow(/incomplete/);
  });

  it('ignores malformed rate values', async () => {
    const data = await getLatestRates('', ok({ ...fixture, rates: { USD: 1, NGN: 1380, BAD: -1, XYZ: 'nope', lower: 2 } }));
    expect(Object.keys(data.rates).sort()).toEqual(['NGN', 'USD']);
  });
});

describe('server: /api/rates response', () => {
  it('returns JSON with edge caching on success and no-store on failure', async () => {
    const realFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(fixture))) as typeof fetch;
      const good = await ratesResponse();
      expect(good.status).toBe(200);
      expect(good.headers.get('CDN-Cache-Control')).toContain('s-maxage=3600');
      expect((await good.json()).rates.ZAR).toBe(17.428652);

      globalThis.fetch = vi.fn(async () => { throw new TypeError('offline'); }) as typeof fetch;
      const bad = await ratesResponse();
      expect(bad.status).toBe(504);
      expect(bad.headers.get('Cache-Control')).toBe('no-store');
      expect((await bad.json()).error).toMatch(/Could not reach/);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
