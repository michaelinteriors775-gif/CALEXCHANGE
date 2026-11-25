import { beforeEach, describe, expect, it } from 'vitest';
import { convertLegacyTape, migrateStorage } from '../src/lib/migrate';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, String(v)); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
  keys() { return [...this.map.keys()]; }
}
const store = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = store;

const DEMO_V1 = [{ e: '(1250+380)*1.08', r: 1760.4 }, { e: '2^10', r: 1024 }];
const DEMO_V2 = [{ a: 250, f: 'USD', t: 'EUR', r: 227.48 }, { e: '(1250+380)*1.08', r: 1760.4 }];

describe('convertLegacyTape', () => {
  it('drops the demonstration entries the original page seeded', () => {
    expect(convertLegacyTape(DEMO_V1)).toEqual([]);
    expect(convertLegacyTape(DEMO_V2)).toEqual([]);
  });

  it('keeps genuine calculations made on top of the demo entries, in order', () => {
    const tape = [{ e: '45*3', r: 135 }, { a: 10, f: 'USD', t: 'NGN', r: 13801.44 }, ...DEMO_V2];
    const out = convertLegacyTape(tape);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ type: 'calc', expr: '45*3', result: 135 });
    expect(out[1]).toMatchObject({ type: 'fx', amount: 10, from: 'USD', to: 'NGN', result: 13801.44 });
    expect(out[0].at).toBeGreaterThan(out[1].at);
  });

  it('keeps a genuine entry that happens to match a demo value when it is not at the seeded end', () => {
    const tape = [{ e: '2^10', r: 1024 }, { e: '7*6', r: 42 }];
    expect(convertLegacyTape(tape).map((e) => (e.type === 'calc' ? e.expr : ''))).toEqual(['2^10', '7*6']);
  });

  it('ignores malformed data', () => {
    expect(convertLegacyTape('nope')).toEqual([]);
    expect(convertLegacyTape([null, 5, { e: 'x', r: 'y' }])).toEqual([]);
  });
});

describe('migrateStorage', () => {
  beforeEach(() => store.clear());

  it('leaves a brand-new visitor with no saved data at all', () => {
    migrateStorage();
    expect(store.keys()).toEqual([]);
  });

  it('removes a demo-only legacy tape without creating history', () => {
    store.setItem('calc-tape', JSON.stringify(DEMO_V2));
    store.setItem('calc-rates', JSON.stringify({ EUR: 0.9 }));
    migrateStorage();
    expect(store.getItem('calc-tape')).toBeNull();
    expect(store.getItem('calc-rates')).toBeNull();
    expect(store.getItem('calexchange:history')).toBeNull();
  });

  it('moves genuine legacy history and the chosen pair into the current app', () => {
    store.setItem('calc-tape', JSON.stringify([{ e: '12*12', r: 144 }, ...DEMO_V1]));
    store.setItem('calc-from', JSON.stringify('GBP'));
    store.setItem('calc-to', JSON.stringify('GHS'));
    migrateStorage();
    const history = JSON.parse(store.getItem('calexchange:history')!);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ type: 'calc', expr: '12*12', result: 144 });
    expect(JSON.parse(store.getItem('calexchange:pair')!)).toEqual({ from: 'GBP', to: 'GHS' });
    expect(store.keys().filter((k) => k.startsWith('calc-'))).toEqual([]);
  });

  it('renames CalConverter data and keeps existing CALEXCHANGE history', () => {
    const existing = [{ type: 'calc', id: 'a', expr: '1+1', result: 2, at: 1 }];
    store.setItem('calexchange:history', JSON.stringify(existing));
    store.setItem('calconverter:history', JSON.stringify([{ type: 'calc', id: 'b', expr: '9', result: 9, at: 0 }]));
    migrateStorage();
    expect(JSON.parse(store.getItem('calexchange:history')!)).toEqual(existing);
    expect(store.getItem('calconverter:history')).toBeNull();
  });
});
