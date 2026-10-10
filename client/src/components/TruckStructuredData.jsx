import { serializeJsonLd, truckListJsonLd } from '../../../shared/seo.js';
import { siteUrl } from '../utils/seo.js';

export function TruckStructuredData({ trucks }) {
  if (!trucks.length) return null;

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(truckListJsonLd(trucks, siteUrl())) }}
    />
  );
}
