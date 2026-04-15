/**
 * Star Medical Services — Uluntu Medicare Page TypeScript
 * Handles: Navbar, Scroll Reveal, Scroll-to-Top, Lucide Icons
 */
export {};

// ── Navbar scroll & mobile drawer ──
function initNavbar(): void {
  const navbar = document.getElementById('main-nav');
  const hamburger = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-nav-drawer');

  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('is-open');
    drawer?.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}

// ── Smooth scroll for anchor links ──
function initSmoothScroll(): void {
  const hamburger = document.getElementById('hamburger-btn');
  const drawer = document.getElementById('mobile-nav-drawer');

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      // Always close mobile drawer if it's a mobile link
      if (link.classList.contains('mobile-nav-link') || link.closest('#mobile-nav-drawer')) {
        hamburger?.classList.remove('is-open');
        drawer?.classList.remove('is-open');
        document.body.style.overflow = '';
      }
      
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch(err) {
        // Invalid selector, do nothing and let default navigation occur
      }
    });
  });
}

// ── Scroll Reveal ──
function initScrollReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Scroll to Top Button ──
function initScrollToTop(): void {
  const btn = document.getElementById('scroll-top-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn?.classList.add('visible');
    } else {
      btn?.classList.remove('visible');
    }
  });

  btn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Initialize Lucide Icons ──
function initIcons(): void {
  const w = window as any;
  if (w.lucide) {
    w.lucide.createIcons();
  }
}

// ── Boot ──
initNavbar();
initSmoothScroll();
initScrollReveal();
initScrollToTop();
initIcons();
