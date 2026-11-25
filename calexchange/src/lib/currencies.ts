/**
 * ISO 4217 currency metadata: names plus the countries or regions that use each
 * currency, so users can search by code, name or country. The list of currencies
 * actually offered comes from the rate provider at runtime; any provider code not
 * listed here still appears, named via Intl.DisplayNames.
 */

export interface Currency {
  code: string;
  name: string;
  regions: string;
  africa: boolean;
}

// CODE|Name|Countries or regions
const TABLE = `
AED|UAE dirham|United Arab Emirates
AFN|Afghan afghani|Afghanistan
ALL|Albanian lek|Albania
AMD|Armenian dram|Armenia
ANG|Netherlands Antillean guilder|Sint Maarten
AOA|Angolan kwanza|Angola
ARS|Argentine peso|Argentina
AUD|Australian dollar|Australia, Kiribati, Nauru, Tuvalu
AWG|Aruban florin|Aruba
AZN|Azerbaijani manat|Azerbaijan
BAM|Bosnia-Herzegovina convertible mark|Bosnia and Herzegovina
BBD|Barbadian dollar|Barbados
BDT|Bangladeshi taka|Bangladesh
BGN|Bulgarian lev|Bulgaria
BHD|Bahraini dinar|Bahrain
BIF|Burundian franc|Burundi
BMD|Bermudian dollar|Bermuda
BND|Brunei dollar|Brunei
BOB|Bolivian boliviano|Bolivia
BRL|Brazilian real|Brazil
BSD|Bahamian dollar|Bahamas
BTN|Bhutanese ngultrum|Bhutan
BWP|Botswana pula|Botswana
BYN|Belarusian ruble|Belarus
BZD|Belize dollar|Belize
CAD|Canadian dollar|Canada
CDF|Congolese franc|Democratic Republic of the Congo, DR Congo, DRC
CHF|Swiss franc|Switzerland, Liechtenstein
CLF|Chilean unit of account (UF)|Chile
CLP|Chilean peso|Chile
CNY|Chinese yuan|China
COP|Colombian peso|Colombia
CRC|Costa Rican colón|Costa Rica
CUP|Cuban peso|Cuba
CVE|Cape Verdean escudo|Cape Verde, Cabo Verde
CZK|Czech koruna|Czech Republic, Czechia
DJF|Djiboutian franc|Djibouti
DKK|Danish krone|Denmark, Faroe Islands, Greenland
DOP|Dominican peso|Dominican Republic
DZD|Algerian dinar|Algeria
EGP|Egyptian pound|Egypt
ERN|Eritrean nakfa|Eritrea
ETB|Ethiopian birr|Ethiopia
EUR|Euro|Eurozone, Austria, Belgium, Bulgaria, Croatia, Cyprus, Estonia, Finland, France, Germany, Greece, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Portugal, Slovakia, Slovenia, Spain, Montenegro, Kosovo
FJD|Fijian dollar|Fiji
FKP|Falkland Islands pound|Falkland Islands
GBP|British pound|United Kingdom, UK, Great Britain, England, Scotland, Wales, Northern Ireland, Guernsey, Jersey, Isle of Man
GEL|Georgian lari|Georgia
GHS|Ghanaian cedi|Ghana
GIP|Gibraltar pound|Gibraltar
GMD|Gambian dalasi|The Gambia
GNF|Guinean franc|Guinea
GTQ|Guatemalan quetzal|Guatemala
GYD|Guyanese dollar|Guyana
HKD|Hong Kong dollar|Hong Kong
HNL|Honduran lempira|Honduras
HTG|Haitian gourde|Haiti
HUF|Hungarian forint|Hungary
IDR|Indonesian rupiah|Indonesia
ILS|Israeli new shekel|Israel, Palestine
INR|Indian rupee|India
IQD|Iraqi dinar|Iraq
IRR|Iranian rial|Iran
ISK|Icelandic króna|Iceland
JMD|Jamaican dollar|Jamaica
JOD|Jordanian dinar|Jordan
JPY|Japanese yen|Japan
KES|Kenyan shilling|Kenya
KGS|Kyrgyzstani som|Kyrgyzstan
KHR|Cambodian riel|Cambodia
KMF|Comorian franc|Comoros
KPW|North Korean won|North Korea
KRW|South Korean won|South Korea, Korea
KWD|Kuwaiti dinar|Kuwait
KYD|Cayman Islands dollar|Cayman Islands
KZT|Kazakhstani tenge|Kazakhstan
LAK|Lao kip|Laos
LBP|Lebanese pound|Lebanon
LKR|Sri Lankan rupee|Sri Lanka
LRD|Liberian dollar|Liberia
LSL|Lesotho loti|Lesotho
LYD|Libyan dinar|Libya
MAD|Moroccan dirham|Morocco, Western Sahara
MDL|Moldovan leu|Moldova
MGA|Malagasy ariary|Madagascar
MKD|Macedonian denar|North Macedonia
MMK|Myanmar kyat|Myanmar, Burma
MNT|Mongolian tögrög|Mongolia
MOP|Macanese pataca|Macau, Macao
MRU|Mauritanian ouguiya|Mauritania
MUR|Mauritian rupee|Mauritius
MVR|Maldivian rufiyaa|Maldives
MWK|Malawian kwacha|Malawi
MXN|Mexican peso|Mexico
MYR|Malaysian ringgit|Malaysia
MZN|Mozambican metical|Mozambique
NAD|Namibian dollar|Namibia
NGN|Nigerian naira|Nigeria
NIO|Nicaraguan córdoba|Nicaragua
NOK|Norwegian krone|Norway, Svalbard
NPR|Nepalese rupee|Nepal
NZD|New Zealand dollar|New Zealand, Cook Islands, Niue, Pitcairn Islands, Tokelau
OMR|Omani rial|Oman
PAB|Panamanian balboa|Panama
PEN|Peruvian sol|Peru
PGK|Papua New Guinean kina|Papua New Guinea
PHP|Philippine peso|Philippines
PKR|Pakistani rupee|Pakistan
PLN|Polish złoty|Poland
PYG|Paraguayan guaraní|Paraguay
QAR|Qatari riyal|Qatar
RON|Romanian leu|Romania
RSD|Serbian dinar|Serbia
RUB|Russian ruble|Russia
RWF|Rwandan franc|Rwanda
SAR|Saudi riyal|Saudi Arabia
SBD|Solomon Islands dollar|Solomon Islands
SCR|Seychellois rupee|Seychelles
SDG|Sudanese pound|Sudan
SEK|Swedish krona|Sweden
SGD|Singapore dollar|Singapore
SHP|Saint Helena pound|Saint Helena, Ascension, Tristan da Cunha
SLE|Sierra Leonean leone|Sierra Leone
SOS|Somali shilling|Somalia
SRD|Surinamese dollar|Suriname
SSP|South Sudanese pound|South Sudan
STN|São Tomé and Príncipe dobra|São Tomé and Príncipe
SYP|Syrian pound|Syria
SZL|Eswatini lilangeni|Eswatini, Swaziland
THB|Thai baht|Thailand
TJS|Tajikistani somoni|Tajikistan
TMT|Turkmenistani manat|Turkmenistan
TND|Tunisian dinar|Tunisia
TOP|Tongan paʻanga|Tonga
TRY|Turkish lira|Turkey, Türkiye
TTD|Trinidad and Tobago dollar|Trinidad and Tobago
TWD|New Taiwan dollar|Taiwan
TZS|Tanzanian shilling|Tanzania
UAH|Ukrainian hryvnia|Ukraine
UGX|Ugandan shilling|Uganda
USD|US dollar|United States, USA, Ecuador, El Salvador, Panama, Timor-Leste, Puerto Rico, Zimbabwe
UYU|Uruguayan peso|Uruguay
UZS|Uzbekistani som|Uzbekistan
VES|Venezuelan bolívar|Venezuela
VND|Vietnamese đồng|Vietnam
VUV|Vanuatu vatu|Vanuatu
WST|Samoan tālā|Samoa
XAF|Central African CFA franc|Central Africa, CEMAC, Cameroon, Central African Republic, Chad, Republic of the Congo, Equatorial Guinea, Gabon
XCD|East Caribbean dollar|Eastern Caribbean, Antigua and Barbuda, Dominica, Grenada, Saint Kitts and Nevis, Saint Lucia, Saint Vincent and the Grenadines, Anguilla, Montserrat
XCG|Caribbean guilder|Curaçao, Sint Maarten
XDR|Special drawing rights|International Monetary Fund (IMF)
XOF|West African CFA franc|West Africa, UEMOA, Benin, Burkina Faso, Côte d’Ivoire, Ivory Coast, Guinea-Bissau, Mali, Niger, Senegal, Togo
XPF|CFP franc|French Polynesia, New Caledonia, Wallis and Futuna
YER|Yemeni rial|Yemen
ZAR|South African rand|South Africa, Lesotho, Namibia, Eswatini
ZMW|Zambian kwacha|Zambia
ZWG|Zimbabwe gold|Zimbabwe
`;

/** African currencies, in the order they are listed in the picker. */
export const AFRICAN = [
  'NGN', 'GHS', 'ZAR', 'KES', 'UGX', 'TZS', 'EGP', 'MAD', 'RWF', 'XAF', 'XOF', 'ETB', 'ZMW', 'BWP',
  'MWK', 'AOA', 'MZN', 'NAD', 'MUR', 'SCR', 'GMD', 'SLE', 'LRD', 'SDG', 'SSP', 'DZD', 'TND', 'CDF',
  'BIF', 'SOS', 'ERN', 'LSL', 'SZL', 'CVE', 'MRU', 'STN', 'KMF', 'DJF', 'GNF', 'LYD', 'MGA', 'ZWG',
];

/** Major international currencies, listed after the African group. */
export const MAJOR = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'JPY', 'CNY', 'INR', 'KRW', 'CHF', 'SGD', 'HKD', 'AED',
  'SAR', 'TRY', 'BRL', 'MXN', 'RUB', 'PKR', 'BDT', 'PHP', 'IDR', 'THB', 'MYR', 'VND', 'QAR', 'KWD',
  'BHD', 'OMR', 'ILS',
];

/**
 * Codes the provider returns that are not ISO 4217 currencies (local issues and
 * offshore quotes) or that ISO has withdrawn and replaced. Hidden from users.
 */
export const EXCLUDED = new Set(['CNH', 'FOK', 'GGP', 'IMP', 'JEP', 'KID', 'TVD', 'HRK', 'SLL', 'ZWL']);

const AFRICA_SET = new Set(AFRICAN);

export const METADATA: ReadonlyMap<string, Currency> = new Map(
  TABLE.trim()
    .split('\n')
    .map((line) => {
      const [code, name, regions] = line.split('|');
      return [code, { code, name, regions, africa: AFRICA_SET.has(code) }] as const;
    }),
);

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
} catch {
  displayNames = null;
}

/** Metadata for any code, falling back to the browser's own currency names. */
export function describe(code: string): Currency {
  const known = METADATA.get(code);
  if (known) return known;
  let name = code;
  try {
    name = displayNames?.of(code) ?? code;
  } catch {
    name = code;
  }
  return { code, name, regions: '', africa: AFRICA_SET.has(code) };
}

export interface Catalogue {
  /** Currencies with a rate from the provider, sorted by code. */
  supported: Currency[];
  /** Known currencies the provider has no rate for. */
  unavailable: Currency[];
  bySupported: Set<string>;
}

export function buildCatalogue(rateCodes: Iterable<string>): Catalogue {
  const codes = new Set([...rateCodes].filter((c) => /^[A-Z]{3}$/.test(c) && !EXCLUDED.has(c)));
  const supported = [...codes].map(describe).sort((a, b) => a.code.localeCompare(b.code));
  const unavailable = [...METADATA.values()].filter((c) => !codes.has(c.code));
  return { supported, unavailable, bySupported: codes };
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ranks currencies against a search query (code, name, country or region). */
export function searchCurrencies(list: Currency[], query: string): Currency[] {
  const q = fold(query.trim());
  if (!q) return list;
  const scored: { c: Currency; score: number }[] = [];
  for (const c of list) {
    const code = c.code.toLowerCase();
    const name = fold(c.name);
    const regions = fold(c.regions);
    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (name.startsWith(q) || regions.split(', ').some((r) => r.startsWith(q))) score = 2;
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(`${name} ${regions}`)) score = 3;
    else if (name.includes(q) || regions.includes(q)) score = 4;
    if (score >= 0) scored.push({ c, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.c.code.localeCompare(b.c.code)).map((s) => s.c);
}
