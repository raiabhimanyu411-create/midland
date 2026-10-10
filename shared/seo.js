// SEO metadata shared by the server (initial HTML, sitemap) and the client (route changes),
// so crawlers and browsers always see the same title, description, canonical URL and JSON-LD.

export const SITE_NAME = 'MidLand Trucks';
export const businessLocations = [
  { address: '14 Fleet Way, Birmingham, B12 0JR', phone: '0121 496 0000' },
  { address: 'Unit 6, Aire Valley Trading Estate, Leeds, LS10 1AB', phone: '0113 496 0000' }
];

export const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80';

export const staticPages = {
  home: {
    path: '/',
    title: 'MidLand Trucks | Used HGV, Tractor Units & Trailers for Sale UK',
    description: 'Buy inspected used trucks, tractor units, rigids and trailers from MidLand Trucks. Clear VAT and MOT status, UK finance guidance and nationwide delivery.',
    changefreq: 'daily',
    priority: '1.0'
  },
  trucks: {
    path: '/trucks',
    title: 'Used Trucks for Sale | Tractor Units, Rigids & Tippers | MidLand Trucks',
    description: 'Browse used trucks for sale with filters for make, body type and price. VAT, MOT and Euro rating shown on every MidLand Trucks listing.',
    changefreq: 'daily',
    priority: '0.9'
  },
  finance: {
    path: '/finance',
    title: 'Used Truck Finance | Hire Purchase & Lease | MidLand Trucks',
    description: 'Compare hire purchase, lease purchase and seasonal payment options for your next used truck, with an instant monthly estimate.',
    changefreq: 'monthly',
    priority: '0.7'
  },
  partExchange: {
    path: '/part-exchange',
    title: 'Part Exchange Your Truck | MidLand Trucks',
    description: 'Part exchange your current commercial vehicle against your next truck. Send registration, mileage and notes for a trade valuation.',
    changefreq: 'monthly',
    priority: '0.6'
  },
  delivery: {
    path: '/delivery',
    title: 'UK & Worldwide Truck Delivery and Export | MidLand Trucks',
    description: 'UK and worldwide truck delivery, export and collection support from MidLand Trucks, with quotes available before you reserve.',
    changefreq: 'monthly',
    priority: '0.6'
  },
  faq: {
    path: '/faq',
    title: 'Used Truck Buying FAQ | MidLand Trucks',
    description: 'Answers to common questions about buying, financing, part exchanging and arranging delivery for a used truck.',
    changefreq: 'monthly',
    priority: '0.5'
  },
  about: {
    path: '/about',
    title: 'About MidLand Trucks | Used Commercial Vehicle Specialists',
    description: 'MidLand Trucks is a UK used commercial vehicle sales partner focused on clear, transparent adverts and practical buyer support.',
    changefreq: 'yearly',
    priority: '0.5'
  },
  contact: {
    path: '/contact',
    title: 'Contact MidLand Trucks | Birmingham & Leeds Sales',
    description: 'Get in touch with MidLand Trucks for stock enquiries, finance guidance or delivery quotes. Sales teams in Birmingham and Leeds.',
    changefreq: 'yearly',
    priority: '0.6'
  },
  blog: {
    path: '/blog',
    title: 'Truck Buying Guides & News | MidLand Trucks',
    description: 'News, buying guides and practical advice for buying, financing and running used trucks from the MidLand Trucks team.',
    changefreq: 'weekly',
    priority: '0.6'
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | MidLand Trucks',
    description: 'How MidLand Trucks collects, uses and protects your personal data.',
    changefreq: 'yearly',
    priority: '0.2'
  }
};

export const notFoundPage = {
  title: 'Page Not Found | MidLand Trucks',
  description: 'The page you were looking for could not be found. Browse our current used truck stock instead.',
  robots: 'noindex, follow'
};

export const adminPage = {
  title: 'Admin | MidLand Trucks',
  description: 'MidLand Trucks administration.',
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
  return `/truck/${truck.id}`;
}

export function truckSeo(truck) {
  const price = truck.price ? ` – ${truck.price}` : '';
  const facts = [truck.year, truck.mileage, truck.gearbox, truck.badge, truck.location].filter(Boolean).join(', ');
  return {
    title: truncate(`${truck.title}${price} | ${SITE_NAME}`, 70),
    description: truncate(`${truck.title} for sale${facts ? `: ${facts}` : ''}. ${truck.description || ''}`, 160),
    path: truckPath(truck),
    image: truck.image || DEFAULT_IMAGE,
    type: 'product'
  };
}

const availabilityByStatus = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  sold: 'https://schema.org/SoldOut'
};

export function truckJsonLd(truck, siteUrl) {
  const url = absoluteUrl(siteUrl, truckPath(truck));
  const status = String(truck.status || 'available').toLowerCase();
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Vehicle'],
    name: truck.title,
    url,
    description: truncate(truck.description || truck.title, 500),
    brand: truck.make ? { '@type': 'Brand', name: truck.make } : undefined,
    image: truck.image ? [absoluteUrl(siteUrl, truck.image)] : undefined,
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
      name: truck.title
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
    logo: absoluteUrl(siteUrl, '/favicon.svg'),
    image: DEFAULT_IMAGE,
    telephone: locations[0]?.phone,
    email: 'sales@midlandtrucks.co.uk',
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
