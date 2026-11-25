const SHORTCUTS: [string[], string][] = [
  [['0', '–', '9'], 'Digits'],
  [['.'], 'Decimal point'],
  [['+', '−', '*', '/'], 'Add, subtract, multiply, divide'],
  [['^'], 'Power, e.g. 2^10'],
  [['%'], 'Percent'],
  [['(', ')'], 'Brackets'],
  [['Enter'], 'Calculate (also =)'],
  [['Backspace'], 'Delete last character'],
  [['Esc'], 'Clear'],
];

export function HelpGuide() {
  return (
    <div className="help">
      <h3>Keyboard shortcuts</h3>
      <dl className="shortcuts">
        {SHORTCUTS.map(([keys, what]) => (
          <div key={what}>
            <dt>
              {keys.map((k) => (k === '–' ? <span key={k}> – </span> : <kbd key={k}>{k}</kbd>))}
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <p className="muted">Shortcuts work whenever you’re not typing in a search box.</p>

      <h3>Calculation tips</h3>
      <ul className="tips">
        <li>Order of operations is standard: brackets, powers, then × and ÷, then + and −. So 2 + 3 × 4 = 14.</li>
        <li>Percent works like a desk calculator: 200 + 10% = 220 and 200 − 10% = 180, while 50 × 10% = 5.</li>
        <li>Open brackets close themselves when you press =, and 2(3) is read as 2 × 3.</li>
        <li>After a result, pressing an operator carries on from it; pressing a digit starts a new calculation.</li>
        <li>± switches the sign of the number you’re typing.</li>
      </ul>

      <h3>Currency tips</h3>
      <ul className="tips">
        <li>In Currency mode the keypad types the amount, so you can convert a sum like 1,250 × 3 directly.</li>
        <li>Search by code (NGN), currency (naira) or country (Nigeria). Recent pairs appear under the rate.</li>
        <li>Press = to save a conversion to your history.</li>
        <li>Rates are mid-market reference rates. Banks and money-transfer services usually charge a margin on top.</li>
      </ul>
    </div>
  );
}
