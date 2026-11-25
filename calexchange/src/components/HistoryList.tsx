import { useEffect, useRef, useState } from 'react';
import { formatAmount, formatExpression, formatNumber, formatWhen } from '../lib/format';
import type { HistoryEntry } from '../lib/history';

interface HistoryListProps {
  entries: HistoryEntry[];
  onReuse: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryList({ entries, onReuse, onClear }: HistoryListProps) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!entries.length) {
    return <p className="empty">No calculations yet. Press = and your results will be kept here.</p>;
  }

  const clear = () => {
    if (!confirming) {
      setConfirming(true);
      timer.current = window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    window.clearTimeout(timer.current);
    setConfirming(false);
    onClear();
  };

  return (
    <>
      <ol className="history">
        {entries.map((e) => (
          <li key={e.id}>
            <button type="button" className="history-row" onClick={() => onReuse(e)}>
              {e.type === 'calc' ? (
                <>
                  <span className="history-q">{formatExpression(e.expr)} =</span>
                  <span className="history-a">{formatNumber(e.result)}</span>
                </>
              ) : (
                <>
                  <span className="history-q">
                    {formatAmount(e.amount, e.from)} {e.from} →
                  </span>
                  <span className="history-a">
                    {formatAmount(e.result, e.to)} <small>{e.to}</small>
                  </span>
                </>
              )}
              <span className="history-when">
                {e.type === 'fx' ? 'Conversion · ' : ''}
                {formatWhen(e.at)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="history-foot">
        <span className="muted">Tap an entry to reuse it.</span>
        <button type="button" className={`text-btn${confirming ? ' is-danger' : ''}`} onClick={clear}>
          {confirming ? 'Tap again to clear' : 'Clear history'}
        </button>
      </div>
    </>
  );
}
