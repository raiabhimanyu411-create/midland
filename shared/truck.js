export function truckDisplayTitle(truck = {}) {
  const title = String(truck.title || '').trim();
  if (title) return title;
  return [truck.year, truck.make, truck.type].map((value) => String(value || '').trim()).filter(Boolean).join(' ')
    || 'Truck details coming soon';
}

export function truckDisplayPrice(truck = {}) {
  const price = String(truck.price || '').trim();
  if (!price) return 'Price on request';
  if (!truck.vatStatus || price.includes('VAT')) return price;
  return `${price} ${truck.vatStatus}`;
}
