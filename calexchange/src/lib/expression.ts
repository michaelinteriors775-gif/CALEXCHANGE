/**
 * Safe arithmetic for CALEXCHANGE: a tokenizer and recursive-descent parser
 * (no eval), plus the pure input-editing rules the keypad and keyboard share.
 *
 * Internal expression strings use ASCII operators: + - * / ^ % ( )
 */

export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalcError';
  }
}

export const OPERATORS = '+-*/^';
const MAX_LENGTH = 160;
const TOKEN = /\d*\.?\d+(?:e[+-]?\d+)?|\d+\.|[-+*/^%()]/g;

/**
 * Evaluates an expression with standard precedence:
 *   brackets → percent (postfix) → powers (right-assoc) → unary minus → × ÷ → + −
 * Percent follows calculator convention: "200 + 10%" adds 10% of 200 (= 220),
 * while "10%" on its own, or in × and ÷, means 0.10.
 */
export function evaluate(src: string): number {
  const compact = src.replace(/\s+/g, '');
  const tokens = compact.match(TOKEN) ?? [];
  if (!compact || tokens.join('') !== compact) throw new CalcError('Invalid expression');

  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];

  const sum = (): number => {
    let value = term().value;
    while (peek() === '+' || peek() === '-') {
      const op = take();
      const right = term();
      const amount = right.percent ? value * right.value : right.value;
      value = op === '+' ? value + amount : value - amount;
    }
    return value;
  };

  const term = (): { value: number; percent: boolean } => {
    let value = unary();
    let percent = tokens[i - 1] === '%';
    while (peek() === '*' || peek() === '/') {
      const op = take();
      const right = unary();
      percent = false;
      if (op === '/') {
        if (right === 0) throw new CalcError('Can’t divide by zero');
        value /= right;
      } else value *= right;
    }
    return { value, percent };
  };

  const unary = (): number => {
    if (peek() === '-') {
      take();
      return -unary();
    }
    if (peek() === '+') {
      take();
      return unary();
    }
    return power();
  };

  const power = (): number => {
    const base = postfix();
    if (peek() === '^') {
      take();
      return Math.pow(base, unary());
    }
    return base;
  };

  const postfix = (): number => {
    let value = primary();
    while (peek() === '%') {
      take();
      value /= 100;
    }
    return value;
  };

  const primary = (): number => {
    const token = take();
    if (token === '(') {
      const value = sum();
      if (take() !== ')') throw new CalcError('Missing closing bracket');
      return value;
    }
    if (token !== undefined && /^[\d.]/.test(token)) {
      const n = Number(token);
      if (Number.isNaN(n)) throw new CalcError('Invalid number');
      return n;
    }
    throw new CalcError('Invalid expression');
  };

  const result = sum();
  if (i < tokens.length) throw new CalcError(tokens[i] === ')' ? 'Unmatched closing bracket' : 'Invalid expression');
  if (Number.isNaN(result)) throw new CalcError('Result isn’t a real number');
  if (!Number.isFinite(result)) throw new CalcError('Result is too large');
  return result;
}

/** Removes trailing operators and closes any open brackets, ready to evaluate. */
export function tidy(expr: string): string {
  const trimmed = expr.replace(/[-+*/^(]+$/, '');
  const open = (trimmed.match(/\(/g) ?? []).length - (trimmed.match(/\)/g) ?? []).length;
  return trimmed + ')'.repeat(Math.max(0, open));
}

/** Live preview while typing: the value so far, or null if not yet computable. */
export function preview(expr: string): number | null {
  const s = tidy(expr);
  if (!s) return null;
  try {
    return evaluate(s);
  } catch {
    return null;
  }
}

/**
 * Rounds away binary floating-point noise (0.1 + 0.2 → 0.3) while keeping the
 * 15 significant digits a JavaScript number holds reliably.
 */
export function clean(n: number): number {
  if (!Number.isFinite(n) || Number.isSafeInteger(n)) return n; // whole numbers up to 2^53 are exact
  return parseFloat(n.toPrecision(15));
}

/** A number written so the parser can read it back, bracketing negatives. */
export function numberAsExpression(n: number): string {
  const s = String(clean(n));
  return n < 0 ? `(${s})` : s;
}

export type Key =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '+' | '-' | '*' | '/' | '^' | '%' | '(' | ')'
  | 'NEG' | 'BS' | 'AC';

export interface EntryState {
  expr: string;
  /** The last "=" result, while the screen is still showing it. */
  result: number | null;
  error: string | null;
}

export const emptyEntry: EntryState = { expr: '', result: null, error: null };

const lastNumber = (expr: string) => expr.match(/[\d.]+$/)?.[0] ?? '';
const openBrackets = (expr: string) => (expr.match(/\(/g) ?? []).length - (expr.match(/\)/g) ?? []).length;

/** Applies one keypad key (everything except "=") to the entry state. */
export function applyKey(state: EntryState, key: Key): EntryState {
  if (key === 'AC') return emptyEntry;
  if (key === 'BS') {
    if (state.result !== null || state.error) return { expr: state.result !== null ? '' : state.expr, result: null, error: null };
    return { ...state, expr: state.expr.slice(0, -1) };
  }

  let expr = state.expr;
  // After "=", an operator continues from the result; anything else starts fresh.
  if (state.result !== null) {
    expr = OPERATORS.includes(key) || key === '%' || key === 'NEG' ? numberAsExpression(state.result) : '';
  }
  if (expr.length >= MAX_LENGTH && key !== 'NEG') return { expr, result: null, error: null };

  const last = expr.slice(-1);
  const closesValue = /[\d)%]/.test(last);

  if (/^\d$/.test(key)) {
    if (last === ')' || last === '%') expr += '*';
    // Avoid leading zeros like "007".
    if (lastNumber(expr) === '0') expr = expr.slice(0, -1);
    expr += key;
  } else if (key === '.') {
    if (lastNumber(expr).includes('.')) return { expr, result: null, error: null };
    if (last === ')' || last === '%') expr += '*';
    expr += /\d/.test(last) ? '.' : '0.';
  } else if (OPERATORS.includes(key)) {
    if (!expr || last === '(') {
      if (key === '-') expr += '-';
    } else if (OPERATORS.includes(last)) {
      // Replace the operator, but keep a lone leading minus.
      if (!(expr === '-' || /\(-$/.test(expr))) expr = expr.slice(0, -1) + key;
    } else if (last !== '.') expr += key;
    else expr = expr.slice(0, -1) + key;
  } else if (key === '%') {
    if (closesValue) expr += '%';
  } else if (key === '(') {
    if (closesValue || last === '.') expr += '*';
    expr += '(';
  } else if (key === ')') {
    if (openBrackets(expr) > 0 && closesValue) expr += ')';
  } else if (key === 'NEG') {
    const wrapped = expr.match(/\(-([\d.]+)\)$/);
    const n = lastNumber(expr);
    if (wrapped) expr = expr.slice(0, -wrapped[0].length) + wrapped[1];
    else if (n) expr = expr.slice(0, -n.length) + `(-${n})`;
    else if (!expr || OPERATORS.includes(last) || last === '(') expr += '(-';
  }
  return { expr, result: null, error: null };
}

/** Maps a KeyboardEvent.key to a keypad key, "=" or null. */
export function keyFromKeyboard(k: string): Key | '=' | null {
  const map: Record<string, Key | '='> = {
    Enter: '=', '=': '=', Backspace: 'BS', Escape: 'AC', Delete: 'AC',
    x: '*', X: '*', '×': '*', '÷': '/', ',': '.',
  };
  if (map[k]) return map[k];
  return /^[\d.+\-*/^%()]$/.test(k) ? (k as Key) : null;
}
