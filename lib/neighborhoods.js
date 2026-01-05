export const ALLOWED_NEIGHBORHOODS = [
  'New York',
  'Asia',
  'Australia (Sydney)',
  'Canada (Toronto)',
  'Germany (Berlin)',
  'New Zealand (Auckland)',
  'Dubai'
]

export function normalizeNeighborhood(value){
  const s = String(value || '').trim()
  return ALLOWED_NEIGHBORHOODS.includes(s) ? s : ALLOWED_NEIGHBORHOODS[0]
}
