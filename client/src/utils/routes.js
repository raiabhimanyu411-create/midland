export const routeNames = [
  'home',
  'trucks',
  'truckDetail',
  'blogPost',
  'blog',
  'notFound',
  'finance',
  'partExchange',
  'delivery',
  'faq',
  'privacy',
  'about',
  'contact',
  'admin'
];

export function getRouteTitle(t, name) {
  const key = `nav.${name}`;
  const fallbacks = { blogPost: 'News', blog: 'News', notFound: 'Page not found' };
  return t(key, { defaultValue: fallbacks[name] || name });
}

export function getRouteDescription(t, name) {
  const key = `routeDescriptions.${name}`;
  const fallbacks = { blogPost: 'News and buying guides from MidLand Trucks.', blog: 'News and buying guides from MidLand Trucks.' };
  return t(key, { defaultValue: fallbacks[name] || '' });
}

export const primaryRoutes = ['home', 'trucks', 'finance', 'partExchange', 'delivery', 'about', 'contact'];

export function truckUrl(truck) {
  return `/truck/${truck.id}${truck.slug ? `-${encodeURIComponent(truck.slug)}` : ''}`;
}

export const routePaths = { home: '/', trucks: '/trucks', finance: '/finance', partExchange: '/part-exchange', delivery: '/delivery', faq: '/faq', privacy: '/privacy', about: '/about', contact: '/contact', blog: '/blog', admin: '/admin' };

export function getRoute() {
  const route = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (route.startsWith('truck/')) {
    const identifier = route.split('/')[1];
    const truckId = Number(identifier.match(/^\d+/)?.[0]);
    return { name: 'truckDetail', truckId: Number.isInteger(truckId) && truckId > 0 ? truckId : null, hash: `${route}${window.location.search}` };
  }

  if (route.startsWith('blog/')) {
    const encodedSlug = route.slice('blog/'.length);
    let blogSlug = encodedSlug;
    try { blogSlug = decodeURIComponent(encodedSlug); } catch { /* Use the encoded value for the API 404. */ }
    return { name: 'blogPost', blogSlug, truckId: null, hash: `${route}${window.location.search}` };
  }

  const routeName = route === 'part-exchange' ? 'partExchange' : route || 'home';
  const knownRoute = routeNames.includes(routeName) && !['truckDetail', 'blogPost', 'notFound'].includes(routeName) && route !== 'partExchange';
  return { name: knownRoute ? routeName : 'notFound', truckId: null, blogSlug: null, hash: `${route}${window.location.search}` };
}
