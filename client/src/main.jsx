import React, { lazy, Suspense, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n/index.js';
import { ChatAssistant } from './components/ChatAssistant.jsx';
import { CookieConsent } from './components/CookieConsent.jsx';
import { CinematicEffects } from './components/CinematicEffects.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { BlogPostPage } from './pages/BlogPostPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { DeliveryPage } from './pages/DeliveryPage.jsx';
import { FaqPage } from './pages/FaqPage.jsx';
import { FinancePage } from './pages/FinancePage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { PartExchangePage } from './pages/PartExchangePage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { TruckDetailPage } from './pages/TruckDetailPage.jsx';
import { TrucksPage } from './pages/TrucksPage.jsx';
import { getRoute, getRouteDescription, getRouteTitle } from './utils/routes.js';
import './styles.css';

const AdminPage = lazy(() => import('./pages/AdminPage.jsx').then((module) => ({ default: module.AdminPage })));

function App() {
  const { t } = useTranslation();
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
    document.title = `${getRouteTitle(t, route.name) || 'Home'} | MidLand Trucks`;

    const description = getRouteDescription(t, route.name) || getRouteDescription(t, 'home');
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [route.name, t]);

  return (
    <>
      <main className="site-shell">
        <Header route={route} />
        <div className="page-stage" key={`${route.name}-${route.hash}`}>
          {route.name === 'home' && <HomePage />}
          {route.name === 'trucks' && <TrucksPage routeHash={route.hash} />}
          {route.name === 'truckDetail' && <TruckDetailPage truckId={route.truckId} />}
          {route.name === 'blogPost' && <BlogPostPage slug={route.blogSlug} />}
          {route.name === 'finance' && <FinancePage />}
          {route.name === 'partExchange' && <PartExchangePage />}
          {route.name === 'delivery' && <DeliveryPage />}
          {route.name === 'faq' && <FaqPage />}
          {route.name === 'privacy' && <PrivacyPage />}
          {route.name === 'about' && <AboutPage />}
          {route.name === 'contact' && <ContactPage />}
          {route.name === 'admin' && <Suspense fallback={<section className="section"><p>Loading administration…</p></section>}><AdminPage /></Suspense>}
        </div>
        <Footer />
      </main>
      <CinematicEffects routeKey={`${route.name}-${route.hash}`} />
      <ChatAssistant />
      <CookieConsent />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
