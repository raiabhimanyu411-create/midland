// Gentle "inertia" scrolling for mouse wheels and trackpads (Lenis). Touch scrolling stays native,
// and nothing changes for visitors who ask their system for reduced motion.
import Lenis from 'lenis';

let lenis = null;
let frame = 0;

export function startSmoothScroll() {
  if (lenis || typeof window === 'undefined') return lenis;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (window.location.pathname.startsWith('/admin')) return null;

  lenis = new Lenis({
    lerp: 0.09,            // lower = longer glide
    wheelMultiplier: 0.95,
    smoothWheel: true,
    syncTouch: false,
    anchors: { offset: -96 } // same-page #links glide too, clearing the sticky header
  });

  const raf = (time) => {
    lenis?.raf(time);
    frame = window.requestAnimationFrame(raf);
  };
  frame = window.requestAnimationFrame(raf);
  return lenis;
}

export function stopSmoothScroll() {
  window.cancelAnimationFrame(frame);
  lenis?.destroy();
  lenis = null;
}

// Jump to the top on page changes without a long glide from the old position.
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, behavior: 'auto' });
}
