import { locationForPath } from '../../../shared/locations.js';
import { categoryForPath } from '../../../shared/categories.js';
import { truckIdFromPath, truckPath } from '../../../shared/seo.js';

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
  'admin',
  'thankYou',
  'location',
  'category'
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
  return truckPath(truck);
}

export const routePaths = { home: '/', trucks: '/trucks', partExchange: '/part-exchange', faq: '/faq', privacy: '/privacy', about: '/about', contact: '/contact', blog: '/blog', admin: '/admin', thankYou: '/thank-you' };

export function getRoute() {
  const route = window.location.pathname.replace(/^\/+|\/+$/g, '');

  // Listings live at /used-trucks/<slug>-<id>. Old /truck/<id> links are redirected by the server.
  if (route.startsWith('used-trucks/')) {
    const truckId = truckIdFromPath(`/${route}`)?.id || null;
    return { name: 'truckDetail', truckId, hash: `${route}${window.location.search}` };
  }

  if (route.startsWith('used-trucks-for-sale/')) {
    const location = locationForPath(`/${route}`);
    return { name: location ? 'location' : 'notFound', locationSlug: location?.slug || null, truckId: null, blogSlug: null, hash: `${route}${window.location.search}` };
  }

  if (route.startsWith('trucks/')) {
    const category = categoryForPath(`/${route}`);
    return { name: category ? 'category' : 'notFound', categorySlug: category?.slug || null, truckId: null, blogSlug: null, hash: `${route}${window.location.search}` };
  }

  if (route.startsWith('blog/')) {
    const encodedSlug = route.slice('blog/'.length);
    let blogSlug = encodedSlug;
    try { blogSlug = decodeURIComponent(encodedSlug); } catch { /* Use the encoded value for the API 404. */ }
    return { name: 'blogPost', blogSlug, truckId: null, hash: `${route}${window.location.search}` };
  }

  const routeName = route === 'part-exchange' ? 'partExchange' : route === 'thank-you' ? 'thankYou' : route || 'home';
  const knownRoute = routeNames.includes(routeName) && !['truckDetail', 'blogPost', 'notFound', 'location', 'category'].includes(routeName) && route !== 'partExchange' && route !== 'thankYou';
  return { name: knownRoute ? routeName : 'notFound', truckId: null, blogSlug: null, hash: `${route}${window.location.search}` };
}

const NAVIGATE_EVENT = 'midland:navigate';

// In-app navigation from code (e.g. after a form is sent), using the same transition as link clicks.
export function navigate(path) {
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: path }));
}

export function onNavigate(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(NAVIGATE_EVENT, listener);
  return () => window.removeEventListener(NAVIGATE_EVENT, listener);
}
