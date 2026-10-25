import React, { lazy, Suspense, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n, { i18nReady } from './i18n/index.js';
import { ChatAssistant } from './components/ChatAssistant.jsx';
import { CookieConsent } from './components/CookieConsent.jsx';
import { CinematicEffects } from './components/CinematicEffects.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { adminPage, notFoundPage, organizationJsonLd, SITE_NAME, staticPages } from '../../shared/seo.js';
import { getRoute, getRouteDescription, getRouteTitle } from './utils/routes.js';
import { setPageMeta, siteUrl } from './utils/seo.js';
import './styles.css';

// Every page except the home page is split into its own chunk to keep the first load small.
const lazyPage = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const AboutPage = lazyPage(() => import('./pages/AboutPage.jsx'), 'AboutPage');
const AdminPage = lazyPage(() => import('./pages/AdminPage.jsx'), 'AdminPage');
const BlogListPage = lazyPage(() => import('./pages/BlogListPage.jsx'), 'BlogListPage');
const BlogPostPage = lazyPage(() => import('./pages/BlogPostPage.jsx'), 'BlogPostPage');
const ContactPage = lazyPage(() => import('./pages/ContactPage.jsx'), 'ContactPage');
const FaqPage = lazyPage(() => import('./pages/FaqPage.jsx'), 'FaqPage');
const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage.jsx'), 'NotFoundPage');
const PartExchangePage = lazyPage(() => import('./pages/PartExchangePage.jsx'), 'PartExchangePage');
const PrivacyPage = lazyPage(() => import('./pages/PrivacyPage.jsx'), 'PrivacyPage');
const TruckDetailPage = lazyPage(() => import('./pages/TruckDetailPage.jsx'), 'TruckDetailPage');
const TrucksPage = lazyPage(() => import('./pages/TrucksPage.jsx'), 'TrucksPage');

// Truck and blog pages set their own metadata once their data has loaded.
const pagesWithOwnMeta = new Set(['truckDetail', 'blogPost']);

function routeMeta(t, language, routeName) {
  if (routeName === 'admin') return { ...adminPage, path: null };
  if (routeName === 'notFound') return { ...notFoundPage, path: null };

  const page = staticPages[routeName] || staticPages.home;
  const isEnglish = language === 'en';
  return {
    title: isEnglish ? page.title : `${getRouteTitle(t, routeName)} | ${SITE_NAME}`,
    description: (isEnglish ? page.description : getRouteDescription(t, routeName)) || page.description,
    path: page.path,
    jsonLd: routeName === 'home'
      ? [organizationJsonLd(siteUrl()), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${siteUrl()}/` }]
      : []
  };
}

function App() {
  const { t, i18n } = useTranslation();
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    let activeTransition = null;

    const commitRoute = (url) => {
      if (url) {
        window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }

      flushSync(() => setRoute(getRoute()));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    const handleRouteChange = (url = null) => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reducedMotion) {
        commitRoute(url);
        return;
      }

      activeTransition?.skipTransition();
      document.documentElement.classList.add('has-native-route-transition');
      document.documentElement.classList.add('route-transition-active');

      try {
        const transition = document.startViewTransition(() => commitRoute(url));
        activeTransition = transition;
        const cleanUpTransition = () => {
          if (activeTransition !== transition) return;
          activeTransition = null;
          document.documentElement.classList.remove('route-transition-active');
        };
        transition.finished.then(cleanUpTransition, cleanUpTransition);
      } catch {
        document.documentElement.classList.remove('has-native-route-transition');
        document.documentElement.classList.remove('route-transition-active');
        commitRoute(url);
      }
    };

    const handleInternalNavigation = (event) => {
      const link = event.target.closest('a[href]');
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target ||
        link.hasAttribute('download')
      ) return;

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        !['http:', 'https:'].includes(url.protocol) ||
        (url.pathname === window.location.pathname && url.search === window.location.search && url.hash)
      ) return;

      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash === window.location.hash
      ) return;

      event.preventDefault();
      handleRouteChange(url);
    };

    const handlePopState = () => handleRouteChange();

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleInternalNavigation);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleInternalNavigation);
    };
  }, []);

  useEffect(() => {
    if (pagesWithOwnMeta.has(route.name)) return;
    setPageMeta(routeMeta(t, i18n.language, route.name));
  }, [route.name, t, i18n.language]);

  return (
    <>
      <main className="site-shell">
        <Header route={route} />
        <div className="page-stage" key={`${route.name}-${route.hash}`}>
          <Suspense fallback={<section className="section" aria-busy="true" />}>
            {route.name === 'home' && <HomePage />}
            {route.name === 'trucks' && <TrucksPage />}
            {route.name === 'truckDetail' && <TruckDetailPage truckId={route.truckId} />}
            {route.name === 'blogPost' && <BlogPostPage slug={route.blogSlug} />}
            {route.name === 'partExchange' && <PartExchangePage />}
            {route.name === 'faq' && <FaqPage />}
            {route.name === 'privacy' && <PrivacyPage />}
            {route.name === 'about' && <AboutPage />}
            {route.name === 'contact' && <ContactPage />}
            {route.name === 'blog' && <BlogListPage />}
            {route.name === 'notFound' && <NotFoundPage />}
            {route.name === 'admin' && <AdminPage />}
          </Suspense>
        </div>
        <Footer />
      </main>
      <CinematicEffects routeKey={`${route.name}-${route.hash}`} />
      <ChatAssistant />
      <CookieConsent />
    </>
  );
}

i18nReady.finally(() => {
  createRoot(document.getElementById('root')).render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
});
