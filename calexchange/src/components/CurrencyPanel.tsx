import type { Catalogue } from '../lib/currencies';
import { formatDateTime, formatRate } from '../lib/format';
import type { Pair } from '../lib/history';
import type { RatesState } from '../hooks/useRates';
import { CurrencyPicker } from './CurrencyPicker';
import { RefreshIcon, SwapIcon } from './Icons';

interface CurrencyPanelProps {
  pair: Pair;
  catalogue: Catalogue | null;
  rates: RatesState;
  recentCodes: string[];
  recentPairs: Pair[];
  notice: string | null;
  onFrom: (code: string) => void;
  onTo: (code: string) => void;
  onSwap: () => void;
  onPair: (pair: Pair) => void;
}

export function CurrencyPanel({
  pair, catalogue, rates, recentCodes, recentPairs, notice, onFrom, onTo, onSwap, onPair,
}: CurrencyPanelProps) {
  const { data } = rates;
  const fromRate = data?.rates[pair.from];
  const toRate = data?.rates[pair.to];
  const forward = fromRate && toRate ? toRate / fromRate : null;
  const otherPairs = recentPairs.filter((p) => !(p.from === pair.from && p.to === pair.to)).slice(0, 4);

  return (
    <div className="fx">
      <div className="fx-pair">
        <CurrencyPicker label="From" value={pair.from} catalogue={catalogue} recent={recentCodes} onChange={onFrom} />
        <button type="button" className="fx-swap" onClick={onSwap} aria-label="Swap currencies" disabled={!catalogue}>
          <SwapIcon />
        </button>
        <CurrencyPicker label="To" value={pair.to} catalogue={catalogue} recent={recentCodes} onChange={onTo} />
      </div>

      {forward !== null && (
        <p className="fx-rate">
          <span>1 {pair.from} = <b>{formatRate(forward)}</b> {pair.to}</span>
          <span className="fx-rate-inverse">1 {pair.to} = {formatRate(1 / forward)} {pair.from}</span>
        </p>
      )}

      {notice && <p className="fx-notice" role="status">{notice}</p>}

      <RateStatus rates={rates} />

      {otherPairs.length > 0 && (
        <div className="fx-recent" aria-label="Recently used pairs">
          <span className="fx-recent-label">Recent</span>
          <div className="fx-recent-list">
            {otherPairs.map((p) => (
              <button key={`${p.from}-${p.to}`} type="button" className="chip" onClick={() => onPair(p)}>
                {p.from} → {p.to}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RateStatus({ rates }: { rates: RatesState }) {
  const { data, status, refreshing, error, outdated, refresh } = rates;

  if (!data) {
    return (
      <div className={`fx-status ${status === 'error' ? 'is-error' : ''}`} role="status">
        {status === 'error' ? (
          <>
            <span className="fx-status-text">
              <b>Exchange rates unavailable.</b> {error} Conversions will appear once rates load.
            </span>
            <button type="button" className="fx-status-btn" onClick={refresh} disabled={refreshing}>
              <RefreshIcon width={16} height={16} className={refreshing ? 'spin' : ''} /> Retry
            </button>
          </>
        ) : (
          <span className="fx-status-text">
            <span className="spinner" aria-hidden /> Loading live exchange rates…
          </span>
        )}
      </div>
    );
  }

  const badge = outdated ? 'Outdated' : status === 'live' ? 'Live' : 'Cached';
  const tone = outdated ? 'is-warn' : status === 'live' ? 'is-live' : 'is-cached';
  return (
    <div className={`fx-status ${tone}`} role="status">
      <span className="fx-status-text">
        <span className="badge">{badge}</span>{' '}
        Rates updated {formatDateTime(data.updatedAt)} by{' '}
        <a href={data.providerUrl} target="_blank" rel="noreferrer">
          {data.provider}
        </a>
        .
        {status === 'cached' && !refreshing && error && <span className="fx-status-detail"> Showing saved rates: {error}</span>}
        {status === 'cached' && refreshing && <span className="fx-status-detail"> Showing saved rates while checking for new ones…</span>}
        {outdated && <span className="fx-status-detail"> These rates are more than two days old.</span>}
      </span>
      <button type="button" className="fx-status-btn" onClick={refresh} disabled={refreshing} aria-label="Refresh exchange rates">
        <RefreshIcon width={16} height={16} className={refreshing ? 'spin' : ''} />
        <span>{refreshing ? 'Checking' : 'Refresh'}</span>
      </button>
    </div>
  );
}
