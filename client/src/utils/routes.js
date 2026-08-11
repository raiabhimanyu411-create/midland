export const routeNames = [
  'home',
  'trucks',
  'truckDetail',
  'blogPost',
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
  const translated = t(key);
  return translated === key && name === 'blogPost' ? 'News' : translated;
}

export function getRouteDescription(t, name) {
  const key = `routeDescriptions.${name}`;
  const translated = t(key);
  return translated === key && name === 'blogPost' ? 'News and buying guides from MidLand Trucks.' : translated;
}

export const primaryRoutes = ['home', 'trucks', 'finance', 'partExchange', 'delivery', 'about', 'contact'];

export const routePaths = { home: '/', trucks: '/trucks', finance: '/finance', partExchange: '/part-exchange', delivery: '/delivery', faq: '/faq', privacy: '/privacy', about: '/about', contact: '/contact', admin: '/admin' };

export function getRoute() {
  const route = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (route.startsWith('truck/')) {
    const truckId = Number(route.split('/')[1]);
    return { name: 'truckDetail', truckId: Number.isNaN(truckId) ? 1 : truckId, hash: `${route}${window.location.search}` };
  }

  if (route.startsWith('blog/')) {
    const encodedSlug = route.slice('blog/'.length);
    let blogSlug = encodedSlug;
    try { blogSlug = decodeURIComponent(encodedSlug); } catch { /* Use the encoded value for the API 404. */ }
    return { name: 'blogPost', blogSlug, truckId: null, hash: `${route}${window.location.search}` };
  }

  const routeName = route === 'part-exchange' ? 'partExchange' : route || 'home';
  return { name: routeNames.includes(routeName) ? routeName : 'home', truckId: null, blogSlug: null, hash: `${route}${window.location.search}` };
}
