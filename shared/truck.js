export function truckDisplayTitle(truck = {}) {
  const title = String(truck.title || '').trim();
  if (title) return title;
  return [truck.year, truck.make, truck.type].map((value) => String(value || '').trim()).filter(Boolean).join(' ')
    || 'Truck details coming soon';
}

export function truckDisplayPrice(truck = {}) {
  // Older listings were saved as "GBP 54,950"; UK buyers expect "£54,950".
  const price = String(truck.price || '').trim().replace(/^GBP\s*/i, '£');
  if (!price) return 'Price on request';
  if (!truck.vatStatus || price.includes('VAT')) return price;
  return `${price} ${truck.vatStatus}`;
}

const forSale = (truck) => !['sold', 'archived', 'draft'].includes(String(truck.status || 'available').toLowerCase());

// Up to `limit` trucks still for sale that are most like this one: same body type first,
// then same make, then the closest year. Used on listing pages, especially sold ones.
export function similarTrucks(truck, trucks, limit = 3) {
  const type = String(truck?.type || '').toLowerCase();
  const make = String(truck?.make || '').toLowerCase();
  const year = Number.parseInt(truck?.year, 10) || 0;
  const score = (item) => (String(item.type || '').toLowerCase() === type ? 2 : 0) + (String(item.make || '').toLowerCase() === make ? 1 : 0);
  return (Array.isArray(trucks) ? trucks : [])
    .filter((item) => item && item.id !== truck?.id && forSale(item))
    .map((item) => ({ item, score: score(item), gap: Math.abs((Number.parseInt(item.year, 10) || 0) - year) }))
    .sort((a, b) => b.score - a.score || a.gap - b.gap)
    .slice(0, limit)
    .map(({ item }) => item);
}
