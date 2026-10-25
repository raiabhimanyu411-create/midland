export const routeNames = [
  'home',
  'trucks',
  'truckDetail',
  'blogPost',
  'blog',
  'notFound',
  'partExchange',
  'faq',
  'privacy',
  'about',
  'contact',
  'admin'
];

export function getRouteTitle(t, name) {
  const key = `nav.${name}`;
  const fallbacks = { blogPost: 'News', blog: 'News', notFound: 'Page Not Found' };
  return t(key, { defaultValue: fallbacks[name] || name });
}

export function getRouteDescription(t, name) {
  const key = `routeDescriptions.${name}`;
  const fallbacks = { blogPost: 'News And Buying Guides From Midland Commercials.', blog: 'News And Buying Guides From Midland Commercials.' };
  return t(key, { defaultValue: fallbacks[name] || '' });
}

export const primaryRoutes = ['home', 'trucks', 'partExchange', 'about', 'contact'];

export function truckUrl(truck) {
  return `/truck/${truck.id}${truck.slug ? `-${encodeURIComponent(truck.slug)}` : ''}`;
}

export const routePaths = { home: '/', trucks: '/trucks', partExchange: '/part-exchange', faq: '/faq', privacy: '/privacy', about: '/about', contact: '/contact', blog: '/blog', admin: '/admin' };

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
