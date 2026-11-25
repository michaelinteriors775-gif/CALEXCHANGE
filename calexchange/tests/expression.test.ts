import { describe, expect, it } from 'vitest';
import { CalcError, applyKey, clean, emptyEntry, evaluate, keyFromKeyboard, preview, tidy, type EntryState, type Key } from '../src/lib/expression';

const typeKeys = (keys: string, start: EntryState = emptyEntry) =>
  [...keys].reduce((s, k) => applyKey(s, k as Key), start);

describe('evaluate', () => {
  it.each([
    ['1+2', 3],
    ['10-4-3', 3],
    ['2+3*4', 14],
    ['(2+3)*4', 20],
    ['20/4/5', 1],
    ['2^3^2', 512],
    ['-2^2', -4],
    ['(-2)^2', 4],
    ['2^-1', 0.5],
    ['3*-2', -6],
    ['--5', 5],
    ['1.5*4', 6],
    ['.5+.25', 0.75],
    ['50%', 0.5],
    ['200+10%', 220],
    ['200-10%', 180],
    ['50*10%', 5],
    ['200/50%', 400],
    ['(100+100)*10%', 20],
    ['2*(3+(4-1))', 12],
    ['1e3+1', 1001],
  ])('%s = %d', (expr, expected) => {
    expect(clean(evaluate(expr))).toBe(expected);
  });

  it('rounds floating-point noise', () => {
    expect(clean(evaluate('0.1+0.2'))).toBe(0.3);
    expect(clean(evaluate('1/3*3'))).toBe(1);
  });

  it('rejects division by zero', () => {
    expect(() => evaluate('5/0')).toThrow('Can’t divide by zero');
    expect(() => evaluate('5/(2-2)')).toThrow(CalcError);
  });

  it.each(['', '2+', '*3', '(2+3', '2+3)', '2..3', '()', 'abc', '2 + alert(1)'])('rejects invalid input %j', (expr) => {
    expect(() => evaluate(expr)).toThrow(CalcError);
  });

  it('reports non-real and overflowing results', () => {
    expect(() => evaluate('(-8)^0.5')).toThrow('Result isn’t a real number');
    expect(() => evaluate('10^400')).toThrow('Result is too large');
  });
});

describe('large numbers', () => {
  it('keeps 15 significant digits', () => {
    expect(clean(evaluate('987654321.123456*1000'))).toBe(987654321123.456);
    expect(clean(evaluate('2^50'))).toBe(1125899906842624);
    expect(clean(evaluate('99999999999999+1'))).toBe(100000000000000);
  });
});

describe('tidy and preview', () => {
  it('drops trailing operators and closes brackets', () => {
    expect(tidy('(2+3*(4-1')).toBe('(2+3*(4-1))');
    expect(tidy('5+')).toBe('5');
    expect(preview('(2+3')).toBe(5);
    expect(preview('7/0')).toBeNull();
  });
});

describe('applyKey (keypad editing)', () => {
  it('builds expressions', () => {
    expect(typeKeys('12+3.5').expr).toBe('12+3.5');
  });
  it('replaces a repeated operator', () => {
    expect(typeKeys('5+*').expr).toBe('5*');
  });
  it('allows a leading minus but nothing else', () => {
    expect(typeKeys('-5').expr).toBe('-5');
    expect(typeKeys('*5').expr).toBe('5');
  });
  it('keeps one decimal point per number', () => {
    expect(typeKeys('1.2.3').expr).toBe('1.23');
    expect(typeKeys('.5').expr).toBe('0.5');
  });
  it('avoids leading zeros', () => {
    expect(typeKeys('007').expr).toBe('7');
    expect(typeKeys('100').expr).toBe('100');
  });
  it('inserts implicit multiplication', () => {
    expect(typeKeys('2(3)').expr).toBe('2*(3)');
    expect(typeKeys('(2)3').expr).toBe('(2)*3');
  });
  it('only closes brackets that are open', () => {
    expect(typeKeys('2)').expr).toBe('2');
  });
  it('toggles the sign of the current number', () => {
    let s = typeKeys('5+3');
    s = applyKey(s, 'NEG');
    expect(s.expr).toBe('5+(-3)');
    s = applyKey(s, 'NEG');
    expect(s.expr).toBe('5+3');
  });
  it('backspace and clear', () => {
    expect(applyKey(typeKeys('123'), 'BS').expr).toBe('12');
    expect(applyKey(typeKeys('123'), 'AC')).toEqual(emptyEntry);
  });
  it('continues from a result with an operator, starts fresh with a digit', () => {
    const done: EntryState = { expr: '2+3', result: 5, error: null };
    expect(applyKey(done, '*').expr).toBe('5*');
    expect(applyKey(done, '7').expr).toBe('7');
    expect(applyKey({ expr: '1-4', result: -3, error: null }, '+').expr).toBe('(-3)+');
  });
});

describe('keyboard mapping', () => {
  it.each([
    ['Enter', '='],
    ['=', '='],
    ['Backspace', 'BS'],
    ['Escape', 'AC'],
    ['*', '*'],
    ['x', '*'],
    ['/', '/'],
    ['%', '%'],
    ['(', '('],
    ['7', '7'],
    ['a', null],
    ['Tab', null],
  ])('%s → %s', (key, expected) => {
    expect(keyFromKeyboard(key)).toBe(expected);
  });
});
