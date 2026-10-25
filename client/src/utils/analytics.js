// Cookie consent + tracking. Google Analytics and the Meta Pixel are only ever loaded after the
// visitor opts in to that category; with no ID configured (VITE_GA_ID / VITE_META_PIXEL_ID) they never load.
import { readStorage, writeStorage } from './storage.js';

const GA_ID = import.meta.env.VITE_GA_ID || '';
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const CONSENT_KEY = 'midland-cookie-consent';
export const OPEN_COOKIE_SETTINGS = 'midland:open-cookie-settings';

const loaded = { analytics: false, marketing: false };

// Returns { analytics, marketing } or null when the visitor has not chosen yet.
export function readConsent() {
  const raw = readStorage(CONSENT_KEY);
  if (!raw) return null;
  // Values saved by the older two-button banner.
  if (raw === 'accepted') return { analytics: true, marketing: true };
  if (raw === 'necessary-only') return { analytics: false, marketing: false };
  try {
    const parsed = JSON.parse(raw);
    return { analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing) };
  } catch {
    return null;
  }
}

export function saveConsent(choice) {
  const next = { analytics: Boolean(choice.analytics), marketing: Boolean(choice.marketing) };
  writeStorage(CONSENT_KEY, JSON.stringify({ ...next, decidedAt: new Date().toISOString() }));
  // A script that is already running cannot be unloaded, so withdrawing consent reloads the page.
  if ((loaded.analytics && !next.analytics) || (loaded.marketing && !next.marketing)) {
    window.location.reload();
    return;
  }
  applyConsent(next);
}

export function applyConsent(consent = readConsent()) {
  if (!consent) return;
  if (consent.analytics) loadGoogleAnalytics();
  if (consent.marketing) loadMetaPixel();
}

function loadGoogleAnalytics() {
  if (!GA_ID || loaded.analytics) return;
  loaded.analytics = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

function loadMetaPixel() {
  if (!META_PIXEL_ID || loaded.marketing) return;
  loaded.marketing = true;
  const fbq = function fbq() {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
    else fbq.queue.push(arguments);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

// Called on client-side route changes so single-page navigation still counts as page views.
export function trackPageView(path) {
  if (loaded.analytics && window.gtag) window.gtag('event', 'page_view', { page_path: path });
  if (loaded.marketing && window.fbq) window.fbq('track', 'PageView');
}

// Fired on the thank-you page after a form is sent (Google Ads / GA4 / Meta lead conversion).
export function trackLead(formName) {
  if (loaded.analytics && window.gtag) window.gtag('event', 'generate_lead', { form_name: formName });
  if (loaded.marketing && window.fbq) window.fbq('track', 'Lead', { content_name: formName });
}
