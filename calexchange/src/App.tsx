import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Collapsible } from './components/Collapsible';
import { CompareList } from './components/CompareList';
import { CurrencyPanel } from './components/CurrencyPanel';
import { Display } from './components/Display';
import { HelpGuide } from './components/HelpGuide';
import { HistoryList } from './components/HistoryList';
import { GlobeIcon, HistoryIcon, KeyboardIcon, Logo } from './components/Icons';
import { Keypad, type PadKey } from './components/Keypad';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useRates } from './hooks/useRates';
import { buildCatalogue } from './lib/currencies';
import {
  CalcError, applyKey, clean, emptyEntry, evaluate, keyFromKeyboard, numberAsExpression, preview, tidy,
  type EntryState,
} from './lib/expression';
import { formatAmount, formatExpression, formatNumber } from './lib/format';
import {
  HISTORY_LIMIT, isHistory, isPair, isPairList, newId, type HistoryEntry, type Pair,
} from './lib/history';
import { convert } from './lib/rates';

type Mode = 'calculator' | 'currency';

const DEFAULT_PAIR: Pair = { from: 'USD', to: 'NGN' };
const COMPARE_DEFAULTS = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR', 'KES', 'EGP', 'XOF', 'CAD', 'CNY', 'JPY', 'AED', 'INR'];
const modeFromHash = (): Mode => (window.location.hash === '#currency' ? 'currency' : 'calculator');

export default function App() {
  const [mode, setModeState] = useState<Mode>(modeFromHash);
  const [calc, setCalc] = useState<EntryState>(emptyEntry);
  // Both modes open with a clean display: no preset or sample values.
  const [amount, setAmount] = useState<EntryState>(emptyEntry);
  const [pair, setPair] = useLocalStorage<Pair>('calexchange:pair', DEFAULT_PAIR, isPair);
  const [recentPairs, setRecentPairs] = useLocalStorage<Pair[]>('calexchange:recent-pairs', [], isPairList);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calexchange:history', [], isHistory);
  const [openPanel, setOpenPanel] = useState<'history' | 'compare' | 'help' | null>(null);
  const [flash, setFlash] = useState<PadKey | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const flashTimer = useRef<number>(undefined);
  const lastPreview = useRef(0);

  const rates = useRates();
  const catalogue = useMemo(() => (rates.data ? buildCatalogue(Object.keys(rates.data.rates)) : null), [rates.data]);

  /* ---------- mode & URL hash ---------- */
  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    if (window.location.hash !== `#${next}`) replaceHash(`#${next}`);
  }, []);
  useEffect(() => {
    const onHash = () => setModeState(modeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (openPanel === 'compare' && mode !== 'currency') setOpenPanel(null);
  }, [mode, openPanel]);

  /* ---------- currency pair ---------- */
  const rememberPair = useCallback(
    (p: Pair) => setRecentPairs((list) => [p, ...list.filter((x) => !(x.from === p.from && x.to === p.to))].slice(0, 8)),
    [setRecentPairs],
  );
  const choosePair = useCallback(
    (p: Pair) => {
      setNotice(null);
      setPair(p);
      rememberPair(p);
    },
    [rememberPair, setPair],
  );
  const setFrom = (code: string) => choosePair({ from: code, to: code === pair.to ? pair.from : pair.to });
  const setTo = (code: string) => choosePair({ from: code === pair.from ? pair.to : pair.from, to: code });
  const swap = () => choosePair({ from: pair.to, to: pair.from });

  // If a saved currency isn't offered by the provider, fall back and say so.
  useEffect(() => {
    if (!catalogue) return;
    const missing = [pair.from, pair.to].filter((c) => !catalogue.bySupported.has(c));
    if (!missing.length) return;
    const fallback = (code: string, avoid: string) =>
      catalogue.bySupported.has(code) ? code : ['USD', 'EUR', 'NGN'].find((c) => c !== avoid && catalogue.bySupported.has(c)) ?? catalogue.supported[0].code;
    const from = fallback(pair.from, pair.to);
    const to = fallback(pair.to, from);
    setPair({ from, to });
    setNotice(`${missing.join(' and ')} ${missing.length > 1 ? 'aren’t' : 'isn’t'} available from the rate provider right now, so the pair was changed.`);
  }, [catalogue, pair, setPair]);

  const recentCodes = useMemo(() => [...new Set(recentPairs.flatMap((p) => [p.from, p.to]))], [recentPairs]);

  /* ---------- keypad ---------- */
  const addHistory = useCallback(
    (entry: HistoryEntry) => setHistory((list) => [entry, ...list].slice(0, HISTORY_LIMIT)),
    [setHistory],
  );

  const press = useCallback(
    (key: PadKey) => {
      const target = mode === 'calculator' ? calc : amount;
      const setTarget = mode === 'calculator' ? setCalc : setAmount;
      if (key !== '=') {
        setTarget(applyKey(target, key));
        return;
      }
      const expr = tidy(target.expr);
      if (!expr) return;
      try {
        const value = evaluate(expr);
        setTarget({ expr, result: value, error: null });
        if (mode === 'calculator') {
          addHistory({ type: 'calc', id: newId(), expr, result: value, at: Date.now() });
        } else if (rates.data) {
          const converted = convert(value, pair.from, pair.to, rates.data.rates);
          if (converted !== null) {
            addHistory({
              type: 'fx', id: newId(), amount: value, from: pair.from, to: pair.to, result: converted,
              rate: converted / (value || 1), at: Date.now(),
            });
            rememberPair(pair);
          }
        }
      } catch (err) {
        setTarget({ ...target, result: null, error: err instanceof CalcError ? err.message : 'Can’t calculate that' });
      }
    },
    [mode, calc, amount, addHistory, rates.data, pair, rememberPair],
  );

  // Physical keyboard support, without hijacking typing in fields or browser shortcuts.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[role="dialog"]')) return; // a picker is open
      // Enter/Space on a focused control should activate that control, not press "=".
      if ((e.key === 'Enter' || e.key === ' ') && el?.closest('button, a, summary, [role="button"]')) return;
      const key = keyFromKeyboard(e.key);
      if (!key) return;
      e.preventDefault();
      press(key);
      setFlash(key);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 110);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [press]);

  // Mouse clicks shouldn't leave focus on a button (as Safari already does), so a later
  // Enter calculates instead of re-clicking it. Keyboard focus (Tab) is unaffected.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('button') && !el.closest('[role="dialog"]')) e.preventDefault();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  /* ---------- history ---------- */
  const reuse = (entry: HistoryEntry) => {
    if (entry.type === 'calc') {
      setCalc({ expr: entry.expr, result: null, error: null });
      setMode('calculator');
    } else {
      setAmount({ expr: numberAsExpression(entry.amount), result: null, error: null });
      if (catalogue?.bySupported.has(entry.from) && catalogue.bySupported.has(entry.to)) choosePair({ from: entry.from, to: entry.to });
      setMode('currency');
    }
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  /* ---------- what the screen shows ---------- */
  const calcView = (() => {
    const pv = calc.result ?? preview(calc.expr);
    if (pv !== null) lastPreview.current = pv;
    const value = calc.expr ? (pv ?? lastPreview.current) : 0;
    return {
      line: calc.result !== null ? `${formatExpression(calc.expr)} =` : formatExpression(calc.expr),
      main: formatNumber(value),
      pending: calc.result === null && calc.expr !== '',
      copy: String(clean(value)),
    };
  })();

  const amountValue = amount.result ?? preview(amount.expr) ?? 0;
  const converted = rates.data ? convert(amountValue, pair.from, pair.to, rates.data.rates) : null;
  const fxView = {
    // Show the typed sum only when it is a calculation, not a plain amount.
    line: `${/[-+*/^%(]/.test(amount.expr.replace(/^-/, '')) ? `${formatExpression(amount.expr)} =  ` : ''}${formatAmount(amountValue, pair.from)} ${pair.from}`,
    main: converted !== null ? formatAmount(converted, pair.to) : rates.status === 'error' ? 'Rates unavailable' : '—',
    unit: converted !== null ? pair.to : undefined,
    copy: converted !== null ? `${formatAmount(converted, pair.to)} ${pair.to}` : undefined,
  };

  const compareCodes = useMemo(
    () => [...new Set([...recentCodes, ...COMPARE_DEFAULTS])].filter((c) => c !== pair.from && catalogue?.bySupported.has(c)).slice(0, 10),
    [recentCodes, pair.from, catalogue],
  );

  const latest = history[0];
  const latestSummary = latest
    ? latest.type === 'calc'
      ? `${formatExpression(latest.expr)} = ${formatNumber(latest.result)}`
      : `${formatAmount(latest.amount, latest.from)} ${latest.from} → ${formatAmount(latest.result, latest.to)} ${latest.to}`
    : 'Nothing yet';
  const toggle = (p: 'history' | 'compare' | 'help') => setOpenPanel((cur) => (cur === p ? null : p));

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#calculator" onClick={() => setMode('calculator')} aria-label="CALEXCHANGE home">
          <Logo className="brand-logo" size={36} />
          <span className="brand-name">CALEXCHANGE</span>
        </a>
        <span className="topbar-note">Calculator &amp; currency converter</span>
      </header>

      <main className="main">
        <h1 className="sr-only">CALEXCHANGE</h1>
        <section className="device" aria-label={mode === 'calculator' ? 'Calculator' : 'Currency converter'}>
          <div className="tabs" role="tablist" aria-label="Mode">
            {(['calculator', 'currency'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                id={`tab-${m}`}
                aria-selected={mode === m}
                className="tab"
                onClick={() => setMode(m)}
              >
                {m === 'calculator' ? 'Calculator' : 'Currency'}
              </button>
            ))}
          </div>

          {mode === 'calculator' ? (
            <Display label="Calculator display" line={calcView.line} main={calcView.main} pending={calcView.pending} error={calc.error} copyText={calcView.copy} />
          ) : (
            <>
              <Display
                label="Conversion display"
                line={fxView.line}
                main={fxView.main}
                unit={fxView.unit}
                pending={amount.result === null && amount.expr !== ''}
                error={amount.error}
                copyText={fxView.copy}
              />
              <CurrencyPanel
                pair={pair}
                catalogue={catalogue}
                rates={rates}
                recentCodes={recentCodes}
                recentPairs={recentPairs}
                notice={notice}
                onFrom={setFrom}
                onTo={setTo}
                onSwap={swap}
                onPair={choosePair}
              />
            </>
          )}

          <Keypad onKey={press} flash={flash} />
        </section>

        <div className="drawers">
          <Collapsible
            title="Calculation History"
            icon={<HistoryIcon />}
            badge={history.length > 0 && <span className="count" aria-label={`${history.length} entries`}>{history.length}</span>}
            summary={latestSummary}
            open={openPanel === 'history'}
            onToggle={() => toggle('history')}
          >
            <HistoryList entries={history} onReuse={reuse} onClear={() => setHistory([])} />
          </Collapsible>

          {mode === 'currency' && rates.data && (
            <Collapsible
              title="Compare currencies"
              icon={<GlobeIcon />}
              summary={`${formatAmount(amountValue, pair.from)} ${pair.from} in ${compareCodes.length} other currencies`}
              open={openPanel === 'compare'}
              onToggle={() => toggle('compare')}
            >
              <CompareList amount={amountValue} from={pair.from} to={pair.to} codes={compareCodes} rates={rates.data.rates} onPick={setTo} />
            </Collapsible>
          )}

          <Collapsible
            title="Help & keyboard shortcuts"
            icon={<KeyboardIcon />}
            summary="Shortcuts, percent rules and currency tips"
            open={openPanel === 'help'}
            onToggle={() => toggle('help')}
          >
            <HelpGuide />
          </Collapsible>
        </div>
      </main>

      <footer className="footer">
        <p>
          Exchange rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a>,
          refreshed automatically. Mid-market reference rates for information only; your bank or transfer service may use different rates.
        </p>
        <p className="muted">
          {catalogue ? `${catalogue.supported.length} currencies available, including ${catalogue.supported.filter((c) => c.africa).length} African currencies.` : ' '}
        </p>
      </footer>
    </div>
  );
}

function replaceHash(hash: string) {
  try {
    window.history.replaceState(null, '', hash);
  } catch {
    window.location.hash = hash;
  }
}
