# CALEXCHANGE

CALEXCHANGE is a calculator and currency converter in one app. The calculator follows standard order of operations and handles brackets, powers and percentages. The converter covers more than 150 ISO 4217 currencies, including 42 African currencies, using real exchange rates from ExchangeRate-API.

## Features

**Calculator**
- Addition, subtraction, multiplication, division, decimals, brackets, powers (`^`), percentages and the ± key.
- Standard order of operations: brackets, powers, × ÷, then + −. For example, `2 + 3 × 4 = 14`.
- Desk-calculator percentages: `200 + 10% = 220`, `200 − 10% = 180`, `50 × 10% = 5`.
- A live preview while you type, auto-closing brackets and implicit multiplication (`2(3)` = 6).
- Clear messages for division by zero, invalid expressions and overflow.
- A safe recursive-descent parser. `eval()` is never used.

**Currency converter**
- Converts between any two supported currencies. The keypad types the amount, so `1250 × 3` converts directly.
- Searchable currency picker that matches codes (NGN), names (naira) and countries or regions (Nigeria, Senegal, Cameroon). Searches ignore accents, so "sao tome" finds the dobra.
- Grouped lists: recently used, African currencies, major currencies, and everything else A–Z.
- Swap button, recently used pairs, both rate directions, copy-to-clipboard and proper currency decimals (JPY 0, KWD 3).
- Shows the rate provider, the time of the last update, and a Live, Cached or Outdated status, plus a manual Refresh button.

**History and help**
- A collapsible Calculation History, closed by default. While closed it shows a count badge and the latest entry. Tap an entry to reuse it; Clear History asks for confirmation.
- A collapsible Help & keyboard shortcuts section and a Compare currencies section.

**Keyboard:** `0–9 . + - * / ^ % ( )`, `Enter` or `=` to calculate, `Backspace` to delete, `Esc` to clear. Shortcuts are ignored while you type in a search field or when a browser shortcut (Ctrl/⌘) is held.

## Brand

The CALEXCHANGE logo is a calculator whose display is a banknote. The note's seal is an equals sign, combining money and calculation in one symbol. It uses money green (#2fcf7f) with the app's graphite (#1f2124), key grey (#5c6167) and equals-key orange (#ff6a13).

| File | Use |
|---|---|
| `public/brand/logo.svg` | Master logo (transparent background), for any branding use |
| `public/favicon.svg` | Browser tab icon, a simplified version drawn for 16–32 px |
| `public/favicon.ico` | Fallback tab icon (16, 32, 48 px) for older browsers |
| `public/apple-touch-icon.png` | iPhone/iPad home-screen icon (180 px) |
| `public/icon-192.png`, `public/icon-512.png` | Android / installed-app icons (transparent) |
| `public/icon-maskable-512.png` | Android adaptive icon with safe-zone padding |
| `public/site.webmanifest` | App name, colours and icons for "Add to Home Screen" |

In the app, the logo is the `Logo` component in `src/components/Icons.tsx` (inline SVG, same artwork). It appears at 36 px beside the name in the header, and at 32 px on phones.

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript, with no UI libraries.
- One Vercel Function (`api/rates.ts`) that fetches rates on the server.
- [Vitest](https://vitest.dev) unit tests.

Runtime dependencies: `react` and `react-dom` only.

## Project structure

```
calexchange/
├── api/
│   └── rates.ts              # Vercel Function: GET /api/rates
├── server/
│   └── exchangeRates.ts      # Provider fetch, validation, error handling, caching headers
├── public/
│   ├── brand/logo.svg        # Master logo
│   ├── favicon.svg, favicon.ico, apple-touch-icon.png
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png
│   └── site.webmanifest
├── src/
│   ├── App.tsx               # App state: modes, keypad, history, pair, keyboard
│   ├── main.tsx
│   ├── styles.css
│   ├── components/
│   │   ├── Collapsible.tsx   # Accordion section used for the bottom menu
│   │   ├── CompareList.tsx
│   │   ├── CurrencyPanel.tsx # Pickers, swap, rate line, status, recent pairs
│   │   ├── CurrencyPicker.tsx# Searchable sheet/dialog
│   │   ├── Display.tsx       # Green display with copy button
│   │   ├── HelpGuide.tsx
│   │   ├── HistoryList.tsx
│   │   ├── Icons.tsx
│   │   └── Keypad.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useRates.ts       # Load, cache, auto-refresh, status
│   └── lib/
│       ├── currencies.ts     # ISO 4217 names, countries, African/major groups, search
│       ├── expression.ts     # Safe parser and keypad editing rules
│       ├── format.ts
│       ├── history.ts
│       └── rates.ts          # Client fetch, localStorage cache, conversion
├── tests/                    # Vitest unit tests + real provider fixture
├── index.html
├── vercel.json
├── vite.config.ts            # Also serves /api/rates during local dev
├── .env.example
└── package.json
```

## Exchange rates

### Provider

CALEXCHANGE uses **[ExchangeRate-API](https://www.exchangerate-api.com)**, chosen because:

- It covers all 38 African currencies on the project list, including SLE, SSP, STN, MRU, ERN and SOS, plus every international currency on the list. Its catalogue has about 160 codes.
- It has a free open-access endpoint that needs no key, and a free keyed plan.
- It returns the time of its last update and its next scheduled update, which the app displays.

The provider notes that for a few volatile currencies (on this app's list, the South Sudanese pound, SSP) it uses central-bank rates, which can differ a lot from street rates. North Korean won (KPW) is not offered. The app lists it as unavailable rather than showing a fake rate.

### How the rates flow

1. The browser calls `/api/rates`, which is this project's own server function.
2. The function fetches USD-based rates from ExchangeRate-API, validates them and returns a clean payload.
3. Vercel's edge caches the response for one hour (`CDN-Cache-Control: s-maxage=3600, stale-while-revalidate=86400`), so the provider is called rarely and the free limits are respected.
4. The browser saves the last good response in `localStorage`. If a later request fails, the app keeps working with the saved rates and labels them **Cached**, with the reason.
5. Rates whose provider timestamp is more than 48 hours old are labelled **Outdated**.
6. While the app is open, it checks for new rates every hour, when the tab becomes visible again, and when the device comes back online.

No exchange rates are hard-coded. If rates have never loaded, the converter says "Rates unavailable" and offers Retry instead of showing a number.

### API key (optional)

The app works with **no configuration**, using the open-access endpoint. That endpoint updates daily and requires attribution, which is shown in the app footer and status line.

To use your own free key instead:

1. Sign up at <https://www.exchangerate-api.com> and copy your key.
2. **Locally:** copy `.env.example` to `.env.local` and set `EXCHANGERATE_API_KEY=your_key`.
3. **On Vercel:** go to Project → Settings → Environment Variables and add `EXCHANGERATE_API_KEY` for Production (and Preview if you like), then redeploy.

The key is read only by `server/exchangeRates.ts`, which runs on the server. It is not prefixed with `VITE_`, so Vite never bundles it into browser code. Error messages never include it, and `.gitignore` keeps `.env*` files out of Git.

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173 (includes /api/rates)
```

Other scripts:

```bash
npm test           # unit tests (parser, conversions, catalogue, server function)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally, including /api/rates
```

`vite.config.ts` serves `/api/rates` during `dev` and `preview` using the same code as the Vercel Function, so you don't need the Vercel CLI to develop. `vercel dev` also works if you prefer it.

## Deploy to Vercel

**From GitHub (recommended)**

1. Push this folder to a new GitHub repository:
   ```bash
   git init && git add . && git commit -m "CALEXCHANGE"
   git branch -M main
   git remote add origin https://github.com/<you>/calexchange.git
   git push -u origin main
   ```
2. In Vercel, click **Add New → Project** and import the repository.
3. Vercel detects **Vite** from `vercel.json`. Leave the build command (`npm run build`) and output directory (`dist`) as they are.
4. Optional: add `EXCHANGERATE_API_KEY` under Environment Variables.
5. Click **Deploy**. Once it finishes, open `/api/rates` on your deployment to confirm it returns JSON.

**From the command line**

```bash
npm i -g vercel
vercel            # preview deployment
vercel --prod     # production deployment
```

## Testing

- `npm test` runs 76 unit tests. They cover order of operations, brackets, powers, percentages, division by zero, invalid input, keypad editing rules and keyboard mapping. They also cover the currency catalogue (every required African and international code), search by code, name and country, and conversions for NGN/USD, GHS/USD, ZAR/NGN, NGN/GBP, EUR/NGN, KES/USD, USD/JPY and GBP/CAD, checked against a real provider response saved in `tests/fixtures`. The server function is tested for keyless and keyed modes, invalid key, quota, rate limiting, network failure, bad JSON and malformed rates.
- The production build was also checked in a real browser at 360 px, 390 px, 820 px, 1280 px and 1440 px wide. That covered keyboard shortcuts, history open/close/reuse/clear, picker search and swap, copy, the API-failure, cached and outdated states, and unsupported saved currencies, with no horizontal scrolling at any width.

## Notes

- Rates are mid-market reference rates for information. Banks and transfer services usually add a margin.
- History, the chosen pair, recent pairs and the last good rates are stored in your browser only.
- `#calculator` and `#currency` in the URL open a specific mode.
