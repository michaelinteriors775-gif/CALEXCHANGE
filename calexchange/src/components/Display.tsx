import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from './Icons';

interface DisplayProps {
  /** Small line above the result: the expression or amount being typed. */
  line: string;
  /** The large figure. */
  main: string;
  /** Optional currency code shown after the main figure. */
  unit?: string;
  /** Dim the main figure while it is only a live preview. */
  pending?: boolean;
  error?: string | null;
  /** Text placed on the clipboard by the Copy button; omit to hide it. */
  copyText?: string;
  label: string;
}

export function Display({ line, main, unit, pending, error, copyText, label }: DisplayProps) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied('ok');
    } catch {
      setCopied('fail');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied('idle'), 1500);
  };

  const size = main.length > 19 ? ' is-xlong' : main.length > 13 ? ' is-long' : '';
  return (
    <div className="screen" role="group" aria-label={label}>
      {copyText !== undefined && (
        <button type="button" className="screen-copy" onClick={copy} aria-label="Copy result">
          {copied === 'ok' ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
          <span>{copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : 'Copy'}</span>
        </button>
      )}
      <div className="screen-line" aria-label="Input">{line || ' '}</div>
      <output className={`screen-main${pending ? ' is-pending' : ''}${size}${error ? ' is-error' : ''}`} aria-live="polite">
        {error ?? (
          <>
            {main}
            {unit && <span className="screen-unit"> {unit}</span>}
          </>
        )}
      </output>
    </div>
  );
}
