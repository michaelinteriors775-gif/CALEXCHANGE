import { memo } from 'react';
import type { Key } from '../lib/expression';

export type PadKey = Key | '=';

interface KeyDef {
  key: PadKey;
  label: string;
  aria?: string;
  kind?: 'fn' | 'op' | 'eq';
}

const KEYS: KeyDef[] = [
  { key: 'AC', label: 'AC', aria: 'Clear', kind: 'fn' },
  { key: 'BS', label: '⌫', aria: 'Backspace', kind: 'fn' },
  { key: '%', label: '%', aria: 'Percent', kind: 'fn' },
  { key: '/', label: '÷', aria: 'Divide', kind: 'op' },
  { key: '(', label: '(', aria: 'Open bracket', kind: 'fn' },
  { key: ')', label: ')', aria: 'Close bracket', kind: 'fn' },
  { key: '^', label: 'xʸ', aria: 'Power', kind: 'fn' },
  { key: '*', label: '×', aria: 'Multiply', kind: 'op' },
  { key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' },
  { key: '-', label: '−', aria: 'Subtract', kind: 'op' },
  { key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' },
  { key: '+', label: '+', aria: 'Add', kind: 'op' },
  { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' },
  { key: '=', label: '=', aria: 'Equals', kind: 'eq' },
  { key: 'NEG', label: '±', aria: 'Toggle sign' },
  { key: '0', label: '0' },
  { key: '.', label: '.', aria: 'Decimal point' },
];

interface KeypadProps {
  onKey: (key: PadKey) => void;
  /** Key to show as pressed (keyboard feedback). */
  flash?: PadKey | null;
}

export const Keypad = memo(function Keypad({ onKey, flash }: KeypadProps) {
  return (
    <div className="keypad" role="group" aria-label="Keypad">
      {KEYS.map((k) => (
        <button
          key={k.key}
          type="button"
          className={`key${k.kind ? ` key-${k.kind}` : ''}${flash === k.key ? ' is-down' : ''}`}
          aria-label={k.aria}
          // Keep focus where it was, so Enter on the keyboard means "=" rather than re-pressing this key.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKey(k.key)}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
});
