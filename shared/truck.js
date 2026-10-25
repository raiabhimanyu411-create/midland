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
