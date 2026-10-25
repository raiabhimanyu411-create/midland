import { useEffect, useLayoutEffect, useRef } from 'react';

const REVEAL_SELECTOR = '.page-stage section, footer > div > div';

function isRevealCandidate(node) {
  if (!(node instanceof HTMLElement)) return false;

  const className = typeof node.className === 'string' ? node.className : '';
  return !className.includes('hero_') && !className.includes('pageHero_');
}

function updateSectionDepth(node) {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 1;
  if (rect.bottom < -200 || rect.top > viewportHeight + 200) return;

  const center = rect.top + rect.height / 2;
  const distance = Math.max(-1, Math.min(1, (center - viewportHeight / 2) / (viewportHeight * 0.72)));
  const depth = 16 - Math.abs(distance) * 24;

  node.style.setProperty('--depth-y', `${distance * -7}px`);
  node.style.setProperty('--depth-z', `${depth}px`);
  node.style.setProperty('--depth-rotate-x', `${distance * -0.65}deg`);
}

export function CinematicEffects({ routeKey }) {
  const auraRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector('header');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let animationFrame = 0;
    let targetScroll = window.scrollY;
    let renderedScroll = targetScroll;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let renderedX = targetX;
    let renderedY = targetY;

    const render = () => {
      animationFrame = 0;
      renderedScroll += (targetScroll - renderedScroll) * 0.13;
      renderedX += (targetX - renderedX) * 0.11;
      renderedY += (targetY - renderedY) * 0.11;

      const scrollTop = reduceMotion ? targetScroll : renderedScroll;
      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const heroProgress = Math.min(Math.max(scrollTop / (window.innerHeight * 0.88), 0), 1);
      const pointerOffsetX = renderedX / Math.max(window.innerWidth, 1) - 0.5;
      const pointerOffsetY = renderedY / Math.max(window.innerHeight, 1) - 0.5;

      root.style.setProperty('--scroll-progress', `${Math.min(scrollTop / scrollRange, 1)}`);
      root.style.setProperty('--cinematic-parallax', `${Math.min(scrollTop * 0.075, 72)}px`);
      root.style.setProperty('--depth-near', `${scrollTop * -0.13}px`);
      root.style.setProperty('--depth-far', `${scrollTop * -0.045}px`);
      root.style.setProperty('--hero-media-y', `${heroProgress * 42}px`);
      root.style.setProperty('--hero-content-lift', `${heroProgress * -22}px`);
      root.style.setProperty('--hero-card-lift', `${heroProgress * -12}px`);
      root.style.setProperty('--hero-overlay-opacity', `${heroProgress * 0.22}`);
      root.style.setProperty('--pointer-x', `${renderedX}px`);
      root.style.setProperty('--pointer-y', `${renderedY}px`);
      root.style.setProperty('--pointer-shift-x', `${pointerOffsetX * 10}px`);
      root.style.setProperty('--pointer-shift-y', `${pointerOffsetY * 6}px`);
      root.style.setProperty('--depth-pointer-rotate', `${pointerOffsetX * 0.32}deg`);
      header?.classList.toggle('is-scrolled', scrollTop > 18);
      if (!reduceMotion) document.querySelectorAll('.cinematic-depth').forEach(updateSectionDepth);

      const scrollSettled = Math.abs(targetScroll - renderedScroll) < 0.15;
      const pointerSettled = Math.abs(targetX - renderedX) < 0.15 && Math.abs(targetY - renderedY) < 0.15;
      if (!scrollSettled || !pointerSettled) animationFrame = window.requestAnimationFrame(render);
    };

    const requestRender = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
      requestRender();
    };

    const onPointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      auraRef.current?.classList.add('is-active');
      requestRender();
    };

    const onPointerLeave = () => {
      auraRef.current?.classList.remove('is-active');
    };

    const onResize = () => {
      targetScroll = window.scrollY;
      requestRender();
    };

    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const observed = new WeakSet();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-cinematically-visible');
          updateSectionDepth(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -7% 0px' }
    );

    const observeNewSections = () => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((node, index) => {
        if (!isRevealCandidate(node) || observed.has(node)) return;
        observed.add(node);
        node.classList.add('cinematic-reveal');
        // Tall sections with sticky content (e.g. the stock list sidebar) skew badly when tilted in 3D.
        node.classList.add(node.hasAttribute('data-no-tilt') ? 'cinematic-flat' : 'cinematic-depth');
        node.style.setProperty('--cinematic-index', `${index % 4}`);
        observer.observe(node);
      });
    };

    observeNewSections();
    const mutationObserver = new MutationObserver(observeNewSections);
    mutationObserver.observe(document.querySelector('.site-shell') || document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [routeKey]);

  return (
    <div className="cinematic-ui" aria-hidden="true" key={routeKey}>
      <span className="cinematic-progress" />
      <span className="cinematic-aura" ref={auraRef} />
      <span className="cinematic-vignette" />
      <span className="cinematic-grain" />
      <span className="cinematic-depth-shape cinematic-depth-shape-near" />
      <span className="cinematic-depth-shape cinematic-depth-shape-far" />
      <span className="cinematic-transition cinematic-transition-dark" />
      <span className="cinematic-transition cinematic-transition-red" />
    </div>
  );
}
