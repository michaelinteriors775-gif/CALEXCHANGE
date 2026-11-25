import { newId, type HistoryEntry } from './history';

/**
 * One-time clean-up of data saved by earlier versions of this app on the same
 * site, run before the app renders.
 *
 * 1. CalConverter (v2) stored data under "calconverter:*": moved to "calexchange:*".
 * 2. The original single-file calculator stored its tape under "calc-tape" and,
 *    on first visit, seeded it with demonstration entries. Those demo entries
 *    are discarded; every genuine calculation is carried over to the history.
 */

const V2_KEYS = ['history', 'pair', 'recent-pairs', 'rates'];
const LEGACY_KEYS = ['calc-tape', 'calc-from', 'calc-to', 'calc-rates'];

interface LegacyEntry {
  e?: unknown;
  r?: unknown;
  a?: unknown;
  f?: unknown;
  t?: unknown;
}

/** The demonstration entries the original page added to an empty tape. */
const isDemoEntry = (x: LegacyEntry) =>
  (x.e === '(1250+380)*1.08' && x.r === 1760.4) ||
  (x.e === '2^10' && x.r === 1024) ||
  (x.e === undefined && x.a === 250 && x.f === 'USD' && x.t === 'EUR');

/**
 * Converts the legacy tape to history entries. Demo entries were always added
 * first, so they sit at the oldest end of the tape; only that trailing run is
 * removed, so a genuine calculation that happens to match is kept.
 */
export function convertLegacyTape(tape: unknown, now = Date.now()): HistoryEntry[] {
  if (!Array.isArray(tape)) return [];
  const entries = tape.filter((x): x is LegacyEntry => !!x && typeof x === 'object');
  while (entries.length && isDemoEntry(entries[entries.length - 1])) entries.pop();

  const out: HistoryEntry[] = [];
  entries.forEach((x, i) => {
    const at = now - i; // keep the original order
    if (typeof x.e === 'string' && typeof x.r === 'number' && Number.isFinite(x.r)) {
      out.push({ type: 'calc', id: newId(), expr: x.e, result: x.r, at });
    } else if (
      typeof x.a === 'number' && typeof x.r === 'number' && typeof x.f === 'string' && typeof x.t === 'string' &&
      Number.isFinite(x.a) && Number.isFinite(x.r)
    ) {
      out.push({ type: 'fx', id: newId(), amount: x.a, from: x.f, to: x.t, result: x.r, rate: x.a ? x.r / x.a : 0, at });
    }
  });
  return out;
}

export function migrateStorage(): void {
  try {
    for (const key of V2_KEYS) {
      const oldKey = `calconverter:${key}`;
      const newKey = `calexchange:${key}`;
      const old = localStorage.getItem(oldKey);
      if (old !== null) {
        if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, old);
        localStorage.removeItem(oldKey);
      }
    }

    const tapeRaw = localStorage.getItem('calc-tape');
    if (tapeRaw !== null) {
      let genuine: HistoryEntry[] = [];
      try {
        genuine = convertLegacyTape(JSON.parse(tapeRaw));
      } catch {
        genuine = [];
      }
      if (genuine.length) {
        let current: HistoryEntry[] = [];
        try {
          current = JSON.parse(localStorage.getItem('calexchange:history') ?? '[]');
        } catch {
          current = [];
        }
        localStorage.setItem('calexchange:history', JSON.stringify([...(Array.isArray(current) ? current : []), ...genuine].slice(0, 100)));
      }
    }

    const from = localStorage.getItem('calc-from');
    const to = localStorage.getItem('calc-to');
    if (from && to && localStorage.getItem('calexchange:pair') === null) {
      try {
        const pair = { from: JSON.parse(from), to: JSON.parse(to) };
        if (typeof pair.from === 'string' && typeof pair.to === 'string') localStorage.setItem('calexchange:pair', JSON.stringify(pair));
      } catch {
        /* ignore malformed legacy values */
      }
    }

    // "calc-rates" held hand-edited rates from the old page; live rates replace them.
    for (const key of LEGACY_KEYS) localStorage.removeItem(key);
  } catch {
    /* storage unavailable: nothing to migrate */
  }
}
