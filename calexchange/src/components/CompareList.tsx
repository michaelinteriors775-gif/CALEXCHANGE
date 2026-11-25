import { describe } from '../lib/currencies';
import { formatAmount } from '../lib/format';
import { convert } from '../lib/rates';

interface CompareListProps {
  amount: number;
  from: string;
  to: string;
  codes: string[];
  rates: Record<string, number>;
  onPick: (code: string) => void;
}

/** The current amount in a handful of other currencies; picking one sets it as the target. */
export function CompareList({ amount, from, to, codes, rates, onPick }: CompareListProps) {
  return (
    <ul className="compare">
      {codes.map((code) => {
        const value = convert(amount, from, code, rates);
        if (value === null) return null;
        return (
          <li key={code}>
            <button type="button" className={`compare-row${code === to ? ' is-current' : ''}`} onClick={() => onPick(code)}>
              <span className="compare-code">{code}</span>
              <span className="compare-name">{describe(code).name}</span>
              <span className="compare-amt">{formatAmount(value, code)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
