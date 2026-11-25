import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AFRICAN, MAJOR, describe, searchCurrencies, type Catalogue, type Currency } from '../lib/currencies';
import { CheckIcon, ChevronDown, CloseIcon, SearchIcon } from './Icons';

interface CurrencyPickerProps {
  label: string;
  value: string;
  catalogue: Catalogue | null;
  recent: string[];
  onChange: (code: string) => void;
}

type Row =
  | { kind: 'heading'; label: string; key: string }
  | { kind: 'option'; currency: Currency; disabled: boolean; key: string };

function buildRows(catalogue: Catalogue, recent: string[], query: string): Row[] {
  const rows: Row[] = [];
  const add = (label: string, list: Currency[], disabled = false) => {
    if (!list.length) return;
    rows.push({ kind: 'heading', label, key: `h-${label}` });
    for (const c of list) rows.push({ kind: 'option', currency: c, disabled, key: `${label}-${c.code}` });
  };
  const { supported, unavailable, bySupported } = catalogue;

  if (query.trim()) {
    add('Results', searchCurrencies(supported, query));
    add('Not available from the rate provider', searchCurrencies(unavailable, query), true);
    return rows;
  }
  const pick = (codes: string[]) => codes.filter((c) => bySupported.has(c)).map(describe);
  const recentList = pick(recent).slice(0, 6);
  const grouped = new Set([...AFRICAN, ...MAJOR]);
  add('Recently used', recentList);
  add('African currencies', pick(AFRICAN));
  add('Major currencies', pick(MAJOR));
  add('All other currencies', supported.filter((c) => !grouped.has(c.code)));
  add('Not available from the rate provider', unavailable, true);
  return rows;
}

export function CurrencyPicker({ label, value, catalogue, recent, onChange }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();
  const justOpened = useRef(false);
  const current = describe(value);

  const rows = useMemo(() => (catalogue ? buildRows(catalogue, recent, query) : []), [catalogue, recent, query]);
  const options = useMemo(
    () => rows.filter((r): r is Extract<Row, { kind: 'option' }> => r.kind === 'option' && !r.disabled),
    [rows],
  );

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Start on the current currency when the list is unfiltered.
    const idx = options.findIndex((o) => o.currency.code === value);
    setActive(idx >= 0 ? idx : 0);
    justOpened.current = true;
    input.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]); // runs only when the sheet opens or closes

  useEffect(() => {
    if (!open) return;
    const opt = options[active];
    if (!opt) return;
    // On open, wait until the current currency is active, then centre it once.
    if (justOpened.current && opt.currency.code !== value && options.some((o) => o.currency.code === value)) return;
    list.current?.querySelector(`[data-key="${CSS.escape(opt.key)}"]`)?.scrollIntoView({ block: justOpened.current ? 'center' : 'nearest' });
    justOpened.current = false;
  }, [active, open, options, value]);

  // Return focus to the trigger only if it had focus (keyboard use); after a mouse or
  // touch pick, leave focus free so Enter on the keyboard means "=".
  const restoreFocus = useRef(false);
  const openSheet = () => {
    restoreFocus.current = document.activeElement === trigger.current;
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setQuery('');
    if (restoreFocus.current) requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  };
  const choose = (code: string) => {
    onChange(code);
    close();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Home' && e.ctrlKey) {
      setActive(0);
    } else if (e.key === 'End' && e.ctrlKey) {
      setActive(options.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.currency.code);
    }
  };

  const activeKey = options[active]?.key;
  const resultCount = rows.filter((r) => r.kind === 'option' && !r.disabled).length;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="cur-field"
        onClick={openSheet}
        disabled={!catalogue}
        aria-haspopup="dialog"
        aria-label={`${label}: ${current.code}, ${current.name}. Change currency`}
      >
        <span className="cur-field-label">{label}</span>
        <span className="cur-field-code">{current.code}</span>
        <span className="cur-field-name">{current.name}</span>
        <ChevronDown className="cur-field-chevron" width={18} height={18} />
      </button>

      {open && catalogue && (
        <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`} onKeyDown={onKeyDown}>
            <div className="sheet-head">
              <h2 id={`${uid}-title`}>{label === 'From' ? 'Convert from' : 'Convert to'}</h2>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="sheet-search">
              <SearchIcon className="sheet-search-icon" />
              <input
                ref={input}
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, currency or country"
                aria-label="Search currencies"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${uid}-list`}
                aria-activedescendant={activeKey ? `${uid}-${activeKey}` : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
              />
            </div>
            <p className="sr-only" aria-live="polite">
              {query ? `${resultCount} ${resultCount === 1 ? 'currency' : 'currencies'} found` : ''}
            </p>
            <ul className="sheet-list" id={`${uid}-list`} role="listbox" aria-label={`${label} currency`} ref={list}>
              {rows.map((row) =>
                row.kind === 'heading' ? (
                  <li key={row.key} className="sheet-group" role="presentation">
                    {row.label}
                  </li>
                ) : (
                  <li
                    key={row.key}
                    id={`${uid}-${row.key}`}
                    data-key={row.key}
                    role="option"
                    aria-selected={row.key === activeKey}
                    aria-disabled={row.disabled || undefined}
                    className={`sheet-option${row.key === activeKey ? ' is-active' : ''}${row.disabled ? ' is-disabled' : ''}${
                      row.currency.code === value ? ' is-current' : ''
                    }`}
                    onClick={() => !row.disabled && choose(row.currency.code)}
                    onMouseMove={() => {
                      if (row.disabled) return;
                      const i = options.findIndex((o) => o.key === row.key);
                      if (i >= 0 && i !== active) setActive(i);
                    }}
                  >
                    <span className="opt-code">{row.currency.code}</span>
                    <span className="opt-text">
                      <span className="opt-name">{row.currency.name}</span>
                      {row.currency.regions && <span className="opt-regions">{row.currency.regions}</span>}
                    </span>
                    {row.currency.code === value && !row.disabled && <CheckIcon className="opt-check" aria-label="Selected" />}
                    {row.disabled && <span className="opt-note">No rate</span>}
                  </li>
                ),
              )}
              {query && resultCount === 0 && (
                <li className="sheet-empty" role="presentation">
                  No currency matches “{query}”. Try a code like NGN or a country like Ghana.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
