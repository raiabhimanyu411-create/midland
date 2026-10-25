// SEO metadata shared by the server (initial HTML, sitemap) and the client (route changes),
// so crawlers and browsers always see the same title, description, canonical URL and JSON-LD.
import { truckDisplayTitle } from './truck.js';

export const SITE_NAME = 'Midland Commercials';
export const SITE_EMAIL = 'sales@midlandcommercials.com';
export const businessLocations = [
  { address: 'Little Wigston, Swadlincote, DE12 7BJ', phone: '0121 663 1118' }
];

export const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80';

export const staticPages = {
  home: {
    path: '/',
    title: 'Midland Commercials | Used Trucks, Tractor Units & Trailers For Sale UK',
    description: 'Quality used trucks, tractor units, rigids and trailers for sale from Midland Commercials in Swadlincote. Clear VAT and MOT details and part exchange welcome.',
    changefreq: 'daily',
    priority: '1.0'
  },
  trucks: {
    path: '/trucks',
    title: 'Used Trucks For Sale | Tractor Units, Rigids & Tippers | Midland Commercials',
    description: 'Browse used trucks for sale with filters for make, body type and price. VAT, MOT and Euro rating shown on every Midland Commercials listing.',
    changefreq: 'daily',
    priority: '0.9'
  },
  partExchange: {
    path: '/part-exchange',
    title: 'Part Exchange Your Truck | Midland Commercials',
    description: 'Part exchange your current truck, van or trailer against your next vehicle. Send the registration, mileage and photos for a valuation.',
    changefreq: 'monthly',
    priority: '0.6'
  },
  faq: {
    path: '/faq',
    title: 'Used Truck Buying FAQ | Midland Commercials',
    description: 'Answers to common questions about buying, viewing and part exchanging a used truck.',
    changefreq: 'monthly',
    priority: '0.5'
  },
  about: {
    path: '/about',
    title: 'About Midland Commercials | Used Commercial Vehicle Specialists',
    description: 'Midland Commercials is a used commercial vehicle dealer in Swadlincote supplying inspected trucks, tractor units, rigids and trailers to UK operators.',
    changefreq: 'yearly',
    priority: '0.5'
  },
  contact: {
    path: '/contact',
    title: 'Contact Midland Commercials | Swadlincote Truck Sales',
    description: 'Contact Midland Commercials about stock, viewings or part exchange. Call 0121 663 1118 or email sales@midlandcommercials.com.',
    changefreq: 'yearly',
    priority: '0.6'
  },
  blog: {
    path: '/blog',
    title: 'Truck Buying Guides & News | Midland Commercials',
    description: 'News, buying guides and practical advice for buying and running used trucks from the Midland Commercials team.',
    changefreq: 'weekly',
    priority: '0.6'
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | Midland Commercials',
    description: 'How Midland Commercials collects, uses and protects your personal data.',
    changefreq: 'yearly',
    priority: '0.2'
  }
};

export const notFoundPage = {
  title: 'Page Not Found | Midland Commercials',
  description: 'The page you were looking for could not be found. Browse our current used truck stock instead.',
  robots: 'noindex, follow'
};

export const adminPage = {
  title: 'Admin | Midland Commercials',
  description: 'Midland Commercials administration.',
  robots: 'noindex, nofollow'
};

export function pageForPath(pathname) {
  return Object.entries(staticPages).find(([, page]) => page.path === pathname)?.[0] || null;
}

export function absoluteUrl(siteUrl, path) {
  if (!path) return siteUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${String(siteUrl || '').replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncate(text, maxLength) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), maxLength * 0.6)).trim()}…`;
}

export function truckPath(truck) {
  const slug = String(truck.slug || '').trim();
  return `/truck/${truck.id}${slug ? `-${encodeURIComponent(slug)}` : ''}`;
}

export function truckSeo(truck) {
  const title = truckDisplayTitle(truck);
  const price = truck.price ? ` – ${truck.price}` : '';
  const facts = [truck.year, truck.mileage, truck.gearbox, truck.badge, truck.location].filter(Boolean).join(', ');
  const images = Array.isArray(truck.images) && truck.images.length ? truck.images : [truck.image];
  return {
    title: truncate(truck.metaTitle || `${title}${price} | ${SITE_NAME}`, 70),
    description: truncate(truck.metaDescription || `${title} for sale${facts ? `: ${facts}` : ''}. ${truck.description || ''}`, 160),
    path: truckPath(truck),
    image: images.find(Boolean) || DEFAULT_IMAGE,
    type: 'product'
  };
}

const availabilityByStatus = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/SoldOut',
  'coming-soon': 'https://schema.org/PreOrder'
};

export function truckJsonLd(truck, siteUrl) {
  const title = truckDisplayTitle(truck);
  const url = absoluteUrl(siteUrl, truckPath(truck));
  const status = String(truck.status || 'available').toLowerCase();
  const images = Array.isArray(truck.images) && truck.images.length ? truck.images : [truck.image];
  const imageUrls = images.filter(Boolean).map((image) => absoluteUrl(siteUrl, image));
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Vehicle'],
    name: title,
    url,
    description: truncate(truck.description || title, 500),
    brand: truck.make ? { '@type': 'Brand', name: truck.make } : undefined,
    image: imageUrls.length ? imageUrls : undefined,
    vehicleModelDate: truck.year || undefined,
    bodyType: truck.type || undefined,
    vehicleTransmission: truck.gearbox || undefined,
    itemCondition: 'https://schema.org/UsedCondition',
    mileageFromOdometer: truck.mileageValue
      ? { '@type': 'QuantitativeValue', value: Number(truck.mileageValue), unitCode: 'SMI' }
      : undefined
  };

  if (Number(truck.priceValue) > 0) {
    data.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'GBP',
      price: Number(truck.priceValue),
      itemCondition: 'https://schema.org/UsedCondition',
      availability: availabilityByStatus[status] || availabilityByStatus.available,
      seller: { '@type': 'AutoDealer', name: SITE_NAME }
    };
  }

  return data;
}

export function truckListJsonLd(trucks, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: trucks.map((truck, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(siteUrl, truckPath(truck)),
      name: truckDisplayTitle(truck)
    }))
  };
}

export function blogPath(post) {
  return `/blog/${encodeURIComponent(post.slug)}`;
}

export function blogSeo(post) {
  return {
    title: truncate(`${post.metaTitle || post.title} | ${SITE_NAME}`, 70),
    description: truncate(post.metaDescription || post.excerpt || post.content, 160),
    path: blogPath(post),
    image: post.coverImage || DEFAULT_IMAGE,
    type: 'article'
  };
}

export function blogJsonLd(post, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: truncate(post.title, 110),
    description: truncate(post.metaDescription || post.excerpt || post.content, 300),
    image: [absoluteUrl(siteUrl, post.coverImage || DEFAULT_IMAGE)],
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(siteUrl, blogPath(post))
  };
}

export function breadcrumbJsonLd(items, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(siteUrl, item.href) } : {})
    }))
  };
}

export function organizationJsonLd(siteUrl, locations = businessLocations) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: SITE_NAME,
    url: absoluteUrl(siteUrl, '/'),
    logo: absoluteUrl(siteUrl, '/logo.svg'),
    image: DEFAULT_IMAGE,
    telephone: locations[0]?.phone,
    email: SITE_EMAIL,
    address: locations[0]?.address,
    department: locations.slice(1).map((location) => ({
      '@type': 'AutoDealer',
      name: SITE_NAME,
      telephone: location.phone,
      address: location.address
    }))
  };
}

// JSON-LD is embedded inside a <script> tag, so "<" must be escaped to prevent breaking out of it.
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
