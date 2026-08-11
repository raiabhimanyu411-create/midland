export function TruckStructuredData({ trucks }) {
  if (!trucks.length) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: trucks.map((truck, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Vehicle',
        name: truck.title,
        brand: truck.make,
        vehicleModelDate: truck.year,
        image: truck.image,
        url: `${window.location.origin}/truck/${truck.id}`,
        mileageFromOdometer: truck.mileageValue
          ? {
              '@type': 'QuantitativeValue',
              value: truck.mileageValue,
              unitCode: 'SMI'
            }
          : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'GBP',
          price: truck.priceValue,
          availability:
            truck.status === 'Reserved' ? 'https://schema.org/Reserved' : 'https://schema.org/InStock'
        }
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
