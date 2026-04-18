/**
 * Star Medical Services — Main TypeScript
 * Handles: Navbar, Scroll Reveal, Animated Counters, Contact Form, Scroll-to-Top
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

// ── ScrollSpy for Navbar Links ──
function initScrollSpy(): void {
  const sections = document.querySelectorAll('section[id], div[id="hero"]');
  const navLinks = document.querySelectorAll('.nav-pill-link, .mobile-nav-link');

  // We observe a thin slice of the top area of the screen to detect which section we are in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          // Only process internal hashes
          if (href && href.startsWith('#')) {
            link.classList.remove('nav-pill-link--active', 'mobile-nav-link--active');
            if (href === `#${entry.target.id}`) {
              if (link.classList.contains('nav-pill-link')) {
                link.classList.add('nav-pill-link--active');
              }
              if (link.classList.contains('mobile-nav-link')) {
                link.classList.add('mobile-nav-link--active');
              }
            }
          }
        });
      }
    });
  }, { rootMargin: '-100px 0px -60% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

// ── Scroll Reveal (IntersectionObserver) ──
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

// ── Animated Counters ──
function initCounters(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          if (el.dataset.counted) return;
          el.dataset.counted = 'true';

          const end = parseInt(el.dataset.countEnd || '0');
          const suffix = el.dataset.countSuffix || '';
          const duration = 2000;
          const startTime = Date.now();

          const tick = (): void => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * end) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll<HTMLElement>('[data-count-end]').forEach(el => observer.observe(el));
}

// ── Contact Form ──
function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const successMsg = document.getElementById('form-success-msg');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (successMsg) {
      successMsg.style.display = 'flex';
      setTimeout(() => { successMsg.style.display = 'none'; }, 4000);
    }
    form.reset();
  });
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
initScrollSpy();
initScrollReveal();
initCounters();
initContactForm();
initScrollToTop();
initIcons();
