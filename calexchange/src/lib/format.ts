import { clean } from './expression';

const MINUS = '−';
const typographic = (s: string) => s.replace(/-/g, MINUS);

/** Scientific notation with up to 15 significant digits: 9.99999998e+17. */
const scientific = (n: number) => typographic(n.toExponential(14).replace(/\.?0+e/, 'e'));

/**
 * Plain number for the calculator display. Exact whole numbers (up to 2^53) are
 * shown in full, e.g. 1,125,899,906,842,624, and decimals to 10 places; larger or
 * tinier values use scientific notation with 15 significant digits.
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return 'Error';
  const r = clean(n);
  const a = Math.abs(r);
  if (a !== 0 && ((a >= 1e16 && !Number.isSafeInteger(r)) || a < 1e-9)) return scientific(r);
  return typographic(r.toLocaleString('en-US', { maximumFractionDigits: 10 }));
}

const moneyFormats = new Map<string, Intl.NumberFormat>();
function moneyFormat(code: string): Intl.NumberFormat {
  let f = moneyFormats.get(code);
  if (!f) {
    try {
      f = new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'code' });
    } catch {
      f = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    moneyFormats.set(code, f);
  }
  return f;
}

/** Decimal places the currency normally uses (JPY 0, KWD 3, most 2). */
export function currencyDigits(code: string): number {
  return moneyFormat(code).resolvedOptions().maximumFractionDigits ?? 2;
}

/**
 * Amount with grouping and the currency's usual decimals, without the code:
 * "1,380.14". Tiny non-zero amounts keep enough significant digits to be useful.
 */
export function formatAmount(n: number, code: string): string {
  if (!Number.isFinite(n)) return '—';
  const digits = currencyDigits(code);
  const a = Math.abs(n);
  if (a !== 0 && a < Math.pow(10, -digits)) {
    return typographic(n.toLocaleString('en-US', { maximumSignificantDigits: 4 }));
  }
  if (a >= 1e21) return scientific(n);
  // From a quadrillion up, cents are beyond a JavaScript number's precision: show whole units.
  if (a >= 1e15) return typographic(Math.round(n).toLocaleString('en-US', { maximumFractionDigits: 0 }));
  return typographic(n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }));
}

/** Exchange rate with 6 significant digits: 0.000724562 → "0.000724562", 1380.144 → "1,380.14". */
export function formatRate(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return Number(n.toPrecision(6)).toLocaleString('en-US', { maximumSignificantDigits: 6 });
}

/** Expression for display: × ÷ − operators and thousands separators in numbers. */
export function formatExpression(expr: string): string {
  return expr
    .replace(/\d+(?:\.\d*)?|\.\d+/g, (num) => {
      const [int, dec] = num.split('.');
      const grouped = int ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
      return dec !== undefined ? `${int ? grouped : ''}.${dec}` : grouped;
    })
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, MINUS);
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
export const formatDateTime = (ms: number) => dateTime.format(new Date(ms));

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
/** Short timestamp for history rows: "3:41 PM" today, otherwise "Nov 24". */
export function formatWhen(ms: number): string {
  const d = new Date(ms);
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d);
}
