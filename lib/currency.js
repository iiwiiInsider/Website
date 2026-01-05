export const CURRENCIES = [
  { code: 'ZAR', label: 'South African Rand (R)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZ$)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CNY', label: 'Chinese Yuan (¥)' },
  { code: 'INR', label: 'Indian Rupee (₹)' }
]

// Approximate conversion rates from ZAR for display only.
// Source of truth is the stored ZAR price.
export const ZAR_TO = {
  ZAR: 1,
  USD: 0.055,
  EUR: 0.05,
  GBP: 0.043,
  AUD: 0.083,
  CAD: 0.074,
  NZD: 0.09,
  CHF: 0.05,
  JPY: 8.1,
  CNY: 0.39,
  INR: 4.6
}

export function normalizeCurrencyCode(code){
  const normalized = String(code || 'ZAR').trim().toUpperCase()
  return Object.prototype.hasOwnProperty.call(ZAR_TO, normalized) ? normalized : 'ZAR'
}

export function convertFromZar(zarAmount, currencyCode){
  const code = normalizeCurrencyCode(currencyCode)
  const rate = ZAR_TO[code] || 1
  const n = Number(zarAmount)
  if(!Number.isFinite(n)) return 0
  return n * rate
}

export function convertToZar(amount, currencyCode){
  const code = normalizeCurrencyCode(currencyCode)
  const rate = ZAR_TO[code] || 1
  const n = Number(amount)
  if(!Number.isFinite(n)) return 0
  if(rate === 0) return 0
  // If 1 ZAR = rate * CODE, then 1 CODE = 1/rate ZAR
  return n / rate
}

export function formatFromZar(zarAmount, currencyCode){
  const code = normalizeCurrencyCode(currencyCode)
  const value = convertFromZar(zarAmount, code)
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: code, maximumFractionDigits: code === 'JPY' ? 0 : 2 }).format(value)
}

// Keeps currency aligned with the timezone selector used in the Market UI.
// This is a convenience mapping for UX; it does not attempt to be exhaustive.
export function currencyForTimeZone(timeZoneId){
  const tz = String(timeZoneId || '').trim()
  const map = {
    'Africa/Johannesburg': 'ZAR',
    'America/New_York': 'USD',
    'America/Toronto': 'CAD',
    'Europe/Berlin': 'EUR',
    'Asia/Tokyo': 'JPY',
    'Australia/Sydney': 'AUD',
    'Pacific/Auckland': 'NZD',
    // AED is not currently supported in this demo, so we default UAE to USD.
    'Asia/Dubai': 'USD'
  }
  return normalizeCurrencyCode(map[tz] || 'ZAR')
}
