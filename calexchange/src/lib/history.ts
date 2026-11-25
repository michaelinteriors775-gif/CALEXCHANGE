export interface CalcEntry {
  type: 'calc';
  id: string;
  expr: string;
  result: number;
  at: number;
}

export interface ConversionEntry {
  type: 'fx';
  id: string;
  amount: number;
  from: string;
  to: string;
  result: number;
  rate: number;
  at: number;
}

export type HistoryEntry = CalcEntry | ConversionEntry;

export const HISTORY_LIMIT = 100;

export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function isHistory(value: unknown): value is HistoryEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (e) =>
        e &&
        typeof e === 'object' &&
        typeof e.id === 'string' &&
        typeof e.at === 'number' &&
        typeof e.result === 'number' &&
        ((e.type === 'calc' && typeof e.expr === 'string') ||
          (e.type === 'fx' && typeof e.from === 'string' && typeof e.to === 'string' && typeof e.amount === 'number')),
    )
  );
}

export interface Pair {
  from: string;
  to: string;
}

export const isPair = (v: unknown): v is Pair =>
  !!v && typeof (v as Pair).from === 'string' && typeof (v as Pair).to === 'string';

export const isPairList = (v: unknown): v is Pair[] => Array.isArray(v) && v.every(isPair);
