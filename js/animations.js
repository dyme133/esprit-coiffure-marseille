/* =============================================================
   ANIMATIONS.JS -- Lueur Beauty Template Dynamic Effects
   Architecture: GSAP ScrollTrigger + Lenis + lerp RAF
   - GSAP ScrollTrigger: [data-reveal] one-shot reveals
   - GSAP scrub: .statement-text word-by-word scroll-linked
   - Lenis: smooth scroll momentum, wired to GSAP ticker
   - Custom lerp RAF: hero parallax, tilt, magnetic buttons
   - Full IO + CSS @keyframes fallback when GSAP unavailable
   ============================================================= */

window.LueurAnimations = (function () {
  'use strict';

  /* -- - Utilities ------------------------------------------- -- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const reducedMotion = false;

  /* -- - Scroll state (updated by Lenis or native scroll) ----- -- */
  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* -- - Mouse ----------------------------------------------- -- */
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  /* -- - State pools ----------------------------------------- -- */
  const tilts   = [];
  const magnets = [];
  let heroBg = null, heroX = 0, heroY = 0;
  let initialized = false;

  /* -- - Cached viewport (avoid per-frame layout reflow) ------ -- */
  let cachedVH = window.innerHeight;
  let cachedVW = window.innerWidth;

  /* -- - Image break cache (absolute positions, no reflow) --- -- */
  let imgCache = [];

  function cacheImgBreaks() {
    imgCache = Array.from(document.querySelectorAll('.image-break img')).map(img => {
      const ib = img.closest('.image-break');
      if (!ib) return null;
      const r = ib.getBoundingClientRect();
      img.style.willChange = 'transform';
      return { img, absTop: r.top + window.scrollY, height: r.height };
    }).filter(Boolean);
  }

  /* -- - Lenis smooth scroll + GSAP ticker wiring ------------ -- */
  function initLenis() {
    if (!window.Lenis || !window.gsap || reducedMotion) return;
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      smoothTouch: true,
    });
    lenis.on('scroll', ({ scroll }) => { scrollY = scroll; });
    if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(time => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
  }

  /* -- - 1. SCROLL REVEAL ------------------------------------ -- */
  function initReveal() {
    const els = Array.from(document.querySelectorAll('[data-reveal], .reveal-up'));
    if (!els.length) return;
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      els.forEach(el => {
        if (el.classList.contains('statement-text')) return; // handled by initTextReveal
        const delay = +(el.dataset.revealDelay || 0) / 1000;
        const dur   = el.dataset.revealDuration ? +(el.dataset.revealDuration) / 1000 : 0.95;
        const type  = el.dataset.reveal;
        const from  = { opacity: 0, filter: 'blur(7px)', scale: 1, x: 0, y: 0 };
        if (type === 'up')    { from.y = 52; from.scale = 0.96; }
        if (type === 'down')  { from.y = -32; from.scale = 0.96; }
        if (type === 'left')  { from.x = -72; from.scale = 0.97; }
        if (type === 'right') { from.x = 72; from.scale = 0.97; }
        if (type === 'scale') { from.scale = 0.82; from.y = 24; from.filter = 'blur(12px)'; }
        window.gsap.set(el, from);
        window.gsap.to(el, {
          opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)',
          duration: dur, delay, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        });
      });
    } else {
      /* IntersectionObserver fallback */
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const delay = +(el.dataset.revealDelay || 0);
          const dur   = el.dataset.revealDuration;
          if (dur) el.style.transitionDuration = (dur / 1000) + 's';
          el.style.willChange = 'transform, opacity, filter';
          setTimeout(() => {
            el.classList.add('revealed');
            el.addEventListener('transitionend', () => { el.style.willChange = 'auto'; }, { once: true });
          }, delay);
          io.unobserve(el);
        });
      }, { threshold: 0, rootMargin: '0px 0px 150px 0px' });
      els.forEach(el => {
        el.classList.add('will-reveal', `reveal-${el.dataset.reveal}`);
        io.observe(el);
      });
    }
  }

  /* -- - 1b. AUTO-REVEAL: programmatic data-reveal injection -- -- */
  function initAutoReveal() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const SKIP = '.site-header, footer, .nav-drawer, .cart-drawer, .search-overlay, .toast';

    const auto = (sel, type, staggerMs) => {
      let i = 0;
      document.querySelectorAll(sel).forEach(el => {
        if (el.hasAttribute('data-reveal') || el.closest(SKIP)) return;
        el.dataset.reveal = type;
        if (staggerMs) el.dataset.revealDelay = String(i++ * staggerMs);
      });
    };

    /* Cards stagger per grid container */
    document.querySelectorAll('.grid, .products-grid').forEach(grid => {
      let i = 0;
      grid.querySelectorAll('.product-card:not([data-reveal]), .cat-card:not([data-reveal])').forEach(el => {
        el.dataset.reveal = 'up';
        el.dataset.revealDelay = String(i++ * 80);
      });
    });

    auto('.section__label, .grid-header__eyebrow', 'up');
    auto('.section__title, .grid-header__title', 'up');
    auto('.split-section__title, .split-section__text', 'up');
    auto('.benefit-label, .benefit-num', 'up');
    auto('.product-info__brand, .product-info__rating, .product-info__price', 'up');
    auto('.product-features, .product-specs', 'up');
    auto('.mission-card', 'up', 80);
    auto('.team-card, .value-card', 'up', 80);
    auto('.timeline-item', 'up', 60);
    auto('.faq-item', 'up', 50);
    auto('.contact-item', 'up', 80);
    auto('.about-hero__text, .about-hero__sub', 'up');
    auto('.page-intro, .page-hero__text', 'up');

    document.querySelectorAll('.split-section__media:not([data-reveal])').forEach(el => {
      if (el.closest(SKIP)) return;
      el.dataset.reveal = el.closest('.split-section--reverse') ? 'left' : 'right';
      el.dataset.revealDuration = '900';
    });

    const gallery = document.querySelector('.product-gallery:not([data-reveal])');
    if (gallery) { gallery.dataset.reveal = 'right'; gallery.dataset.revealDuration = '900'; }
    const info = document.querySelector('.product-info:not([data-reveal])');
    if (info) { info.dataset.reveal = 'left'; info.dataset.revealDuration = '900'; }
  }

  /* -- - 2. 3D TILT ------------------------------------------ -- */
  function initTilt() {
    if (reducedMotion) return;
    document.querySelectorAll('.product-card, .stat-item, .cat-card').forEach(el => {
      const s = { tx: 0, ty: 0, cx: 0, cy: 0, over: false, rect: null };
      tilts.push({ el, s });
      el.addEventListener('mouseenter', () => { s.over = true; s.rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', e => {
        s.clientX = e.clientX;
        s.clientY = e.clientY;
      });
      el.addEventListener('mouseleave', () => { s.tx = 0; s.ty = 0; s.clientX = undefined; s.clientY = undefined; s.over = false; s.rect = null; });
    });
  }

  /* -- - 3. COUNTER ANIMATION -------------------------------- -- */
  function initCounters() {
    if (reducedMotion) return;
    if (window.gsap && window.ScrollTrigger) {
      document.querySelectorAll('.stat-item__value').forEach(el => {
        const em     = el.querySelector('em');
        if (!em) return;
        const suffix = em.textContent;
        const raw    = el.textContent.replace(suffix, '').trim();
        const target = parseFloat(raw.replace(/[^0-9.]/g, ''));
        const dec    = raw.includes('.');
        if (isNaN(target)) return;
        const proxy  = { val: 0 };
        window.gsap.to(proxy, {
          val: target, duration: 2.2, ease: 'power4.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          onUpdate() {
            el.innerHTML = (dec ? proxy.val.toFixed(1) : Math.floor(proxy.val)) + '<em>' + suffix + '</em>';
          }
        });
      });
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); runCounter(e.target); });
      }, { threshold: 0.5 });
      document.querySelectorAll('.stat-item__value').forEach(el => io.observe(el));
    }
  }

  function runCounter(el) {
    const em = el.querySelector('em');
    if (!em) return;
    const suffix = em.textContent;
    const raw    = el.textContent.replace(suffix, '').trim();
    const target = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const dec    = raw.includes('.');
    if (isNaN(target)) return;
    let t0 = null;
    const ease = p => 1 - Math.pow(1 - p, 4);
    function step(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 2200, 1);
      el.innerHTML = (dec ? (ease(p) * target).toFixed(1) : Math.floor(ease(p) * target)) + '<em>' + suffix + '</em>';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* -- - 4a. DARK SECTION ORBS ------------------------------ -- */
  function initOrbs() {
    if (reducedMotion) return;
    document.querySelectorAll('.section--dark').forEach(sec => {
      const a = document.createElement('div');
      const b = document.createElement('div');
      a.className = 'dark-orb dark-orb--a';
      b.className = 'dark-orb dark-orb--b';
      sec.prepend(a);
      sec.appendChild(b);
    });
  }

  /* -- - 4. FLOATING PARTICLES (CSS-only, JS just injects) --- -- */
  function initParticles() {
    if (reducedMotion) return;
    document.querySelectorAll('.section--dark').forEach(sec => {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 18; i++) {
        const p    = document.createElement('span');
        const size = 3 + Math.random() * 7;
        p.className = 'glow-particle';
        Object.assign(p.style, {
          width:             size + 'px',
          height:            size + 'px',
          left:              (Math.random() * 100) + '%',
          top:               (Math.random() * 100) + '%',
          animationDuration: (9 + Math.random() * 14) + 's',
          animationDelay:    -(Math.random() * 22) + 's',
          opacity:           0.06 + Math.random() * 0.18,
          background:        `rgba(196,${130 + Math.floor(Math.random() * 40)},138,0.5)`,
        });
        frag.appendChild(p);
      }
      sec.appendChild(frag);
    });
  }

  /* -- - 5. PARALLAX SETUP ----------------------------------- -- */
  function initParallax() {
    if (reducedMotion) return;
    heroBg = document.querySelector('.hero--full .hero__bg');
    if (heroBg) heroBg.style.willChange = 'transform';
    cacheImgBreaks();
    window.addEventListener('resize', cacheImgBreaks, { passive: true });
  }

  /* -- - 6. TEXT WORD REVEAL --------------------------------- -- */
  function splitWords(el) {
    const parts = el.innerHTML.split(/(\s+|<[^>]+>)/g);
    let html = '';
    parts.forEach(p => {
      if (!p) return;
      if (p[0] === '<' || /^\s+$/.test(p)) {
        html += p;
      } else {
        html += `<span class="word-outer" style="overflow:hidden;display:inline-block;vertical-align:bottom">` +
                `<span class="word-inner" style="display:inline-block">${p}</span>` +
                `</span>`;
      }
    });
    el.innerHTML = html;
    return el.querySelectorAll('.word-inner');
  }

  function initTextReveal() {
    if (reducedMotion) return;
    /* Auto-mark h1s on inner pages (skip hero area and navigation) */
    const HSKIP = '.site-header, footer, .nav-drawer, .cart-drawer, .search-overlay, .hero--full';
    document.querySelectorAll('h1').forEach(el => {
      if (!el.hasAttribute('data-text-reveal') && !el.closest(HSKIP)) {
        el.dataset.textReveal = 'true';
      }
    });

    const els       = Array.from(document.querySelectorAll('.statement-text'));
    const headingEls = Array.from(document.querySelectorAll('[data-text-reveal]'));

    if (window.gsap && window.ScrollTrigger) {
      /* .statement-text – scroll-scrub word reveal */
      els.forEach(el => {
        window.ScrollTrigger.getAll()
          .filter(st => st.trigger === el || el.contains(st.trigger))
          .forEach(st => st.kill());
        const words = el.querySelectorAll('.word-inner').length ? el.querySelectorAll('.word-inner') : splitWords(el);
        window.gsap.set(words, { y: '115%', rotate: 3, opacity: 0 });
        window.gsap.to(words, {
          y: '0%', rotate: 0, opacity: 1,
          ease: 'power4.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 40%', scrub: 1.4 }
        });
      });

      /* h1 headings on inner pages – one-shot word reveal, no scrub */
      headingEls.forEach(el => {
        if (el.querySelector('.word-inner')) return; // already split by prev lang-switch
        window.ScrollTrigger.getAll()
          .filter(st => st.trigger === el || el.contains(st.trigger))
          .forEach(st => st.kill());
        const words = splitWords(el);
        window.gsap.set(words, { y: '100%', opacity: 0 });
        window.gsap.to(words, {
          y: '0%', opacity: 1, ease: 'power4.out', stagger: 0.06, duration: 0.8,
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        });
      });

      window.ScrollTrigger.refresh();
    } else {
      /* CSS @keyframes fallback – skip already-split elements */
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const el = e.target;
          if (el.querySelector('.word-inner')) return;
          const words = splitWords(el);
          let wi = 0;
          words.forEach(w => {
            w.classList.add('word-reveal');
            w.style.animationDelay = (wi++ * 75) + 'ms';
          });
          el.classList.add('text-revealing');
        });
      }, { threshold: 0, rootMargin: '0px 0px 100px 0px' });
      [...els, ...headingEls].filter(el => !el.querySelector('.word-inner')).forEach(el => io.observe(el));
    }
  }

  /* -- - 7. MAGNETIC BUTTONS --------------------------------- -- */
  function initMagnetic() {
    if (reducedMotion) return;
    document.querySelectorAll('.btn--primary, .btn--outline').forEach(el => {
      if (el.closest('.input-group, form, .email-popup')) return;
      const s = { tx: 0, ty: 0, cx: 0, cy: 0, rect: null };
      magnets.push({ el, s });
      el.addEventListener('mouseenter', () => { s.rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', e => {
        s.clientX = e.clientX;
        s.clientY = e.clientY;
      });
      el.addEventListener('mouseleave', () => { s.tx = 0; s.ty = 0; s.clientX = undefined; s.clientY = undefined; s.rect = null; });
    });
  }

  /* -- - 8. GLOW BORDER -------------------------------------- -- */
  function initGlowBorder() {
    const c = document.querySelector('.product-card');
    if (c) c.classList.add('glow-border');
  }

  /* -- - 9. HERO CINEMATIC ENTRY ----------------------------- -- */
  let heroEntryRan = false;

  function initHeroEntry() {
    if (reducedMotion) { document.querySelector('.hero--full')?.classList.add('hero-ready'); return; }
    if (heroEntryRan) return;
    heroEntryRan = true;
    const hero = document.querySelector('.hero--full');
    if (!hero) return;
    const content = hero.querySelector('.hero__content');
    if (!content) return;
    const children = Array.from(content.children);
    if (!children.length) { hero.classList.add('hero-ready'); return; }

    if (window.gsap) {
      /* GSAP fromTo – no clearProps to avoid snap-back to CSS translateY(22px) */
      gsap.fromTo(children,
        { opacity: 0, y: 22 },
        {
          opacity: 1, y: 0,
          duration: 0.95,
          stagger: 0.12,
          ease: 'power4.out'
        }
      );
    } else {
      /* Fallback: double RAF + class-based CSS transition */
      requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('hero-ready')));
    }
  }

  /* Run immediately (defer ensures DOM + GSAP are ready) so animation starts
     before DOMContentLoaded – no more blank-hero delay on page entry. */
  initHeroEntry();

  /* -- - MAIN RAF LOOP ---------------------------------------- -- */
  let lastScrollForParallax = -1;
  let rafId = null;
  let idleFrames = 0;
  const IDLE_THRESHOLD = 90; // ~1.5s of idle -> pause loop, save CPU

  function startTicking() {
    if (rafId) return;
    idleFrames = 0;
    rafId = requestAnimationFrame(tick);
  }

  function wakeRaf() { if (!rafId) startTicking(); }

  function tick() {
    if (reducedMotion) { rafId = null; return; }
    const vh = cachedVH;
    const vw = cachedVW;
    let busy = false;

    /* Tilt (lerp 10%) — rect cached on mouseenter, no per-frame reflow */
    tilts.forEach(({ el, s }) => {
      if (s.over && s.clientX !== undefined && s.rect) {
        s.tx = ((s.clientX - s.rect.left) / s.rect.width  - 0.5) * 8;
        s.ty = ((s.clientY - s.rect.top)  / s.rect.height - 0.5) * -6;
      }
      s.cx = lerp(s.cx, s.tx, 0.10);
      s.cy = lerp(s.cy, s.ty, 0.10);
      const rest = !s.over && Math.abs(s.cx) < 0.04 && Math.abs(s.cy) < 0.04;
      if (rest) { if (el.style.transform) el.style.transform = ''; }
      else { el.style.transform = `perspective(900px) rotateX(${s.cy}deg) rotateY(${s.cx}deg) translateZ(10px) scale(1.018)`; busy = true; }
    });

    /* Magnetic (lerp 9%) — rect cached on mouseenter, no per-frame reflow */
    magnets.forEach(({ el, s }) => {
      if (s.clientX !== undefined && s.rect) {
        s.tx = (s.clientX - s.rect.left - s.rect.width  / 2) * 0.30;
        s.ty = (s.clientY - s.rect.top  - s.rect.height / 2) * 0.30;
      }
      s.cx = lerp(s.cx, s.tx, 0.09);
      s.cy = lerp(s.cy, s.ty, 0.09);
      const rest = Math.abs(s.cx) < 0.04 && Math.abs(s.cy) < 0.04;
      if (rest) { if (el.style.transform) el.style.transform = ''; }
      else { el.style.transform = `translate(${s.cx}px,${s.cy}px)`; busy = true; }
    });

    /* Hero parallax (lerp 4%) */
    if (heroBg) {
      const tx = (mouse.x / vw - 0.5) * 10;
      const ty = (mouse.y / vh - 0.5) * 5;
      const px = heroX, py = heroY;
      heroX = lerp(heroX, tx, 0.04);
      heroY = lerp(heroY, ty, 0.04);
      if (Math.abs(heroX - px) > 0.005 || Math.abs(heroY - py) > 0.005) {
        heroBg.style.transform = `scale(1.07) translate(${heroX}px,${heroY}px)`;
        busy = true;
      }
    }

    /* Image parallax — only when scroll position changed */
    if (scrollY !== lastScrollForParallax && imgCache.length) {
      lastScrollForParallax = scrollY;
      imgCache.forEach(({ img, absTop, height }) => {
        const relTop = absTop - scrollY;
        if (relTop > vh + 200 || relTop + height < -200) return;
        const ratio = (vh - relTop) / (vh + height);
        img.style.transform = `translateY(${(ratio - 0.5) * 48}px) scale(1.12)`;
      });
      busy = true;
    }

    /* Idle detection – pause RAF when nothing animated for ~1.5s */
    if (!busy) {
      idleFrames++;
      if (idleFrames > IDLE_THRESHOLD) {
        rafId = null;
        return;
      }
    } else {
      idleFrames = 0;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* -- - INIT ------------------------------------------------ -- */
  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; wakeRaf(); }, { passive: true });
    /* Wake RAF on scroll / touch so image-parallax & idle-detection work */
    document.addEventListener('scroll', wakeRaf, { passive: true });
    document.addEventListener('touchstart', wakeRaf, { passive: true });
    document.addEventListener('wheel', wakeRaf, { passive: true });
    /* Cache viewport dimensions on resize (avoid per-frame reflow) */
    window.addEventListener('resize', () => { cachedVH = window.innerHeight; cachedVW = window.innerWidth; }, { passive: true });
    initLenis();
    initAutoReveal();
    initReveal();
    initTilt();
    initCounters();
    initOrbs();
    initParticles();
    initParallax();
    /* Defer past language system – setLang runs in same DOMContentLoaded batch */
    setTimeout(initTextReveal, 0);
    initMagnetic();
    initGlowBorder();
    startTicking();
  }

  /* -- - CLEANUP: free GSAP + Lenis on page unload --------------- -- */
  window.addEventListener('beforeunload', () => {
    if (window.ScrollTrigger) { window.ScrollTrigger.getAll().forEach(st => st.kill()); window.ScrollTrigger.clearMatchMedia?.(); }
    if (window.gsap) window.gsap.globalTimeline.clear();
    tilts.length = 0;
    magnets.length = 0;
    heroBg = null;
    imgCache.length = 0;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });

  return { init, initTextReveal };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.LueurAnimations?.init?.(), { once: true });
} else {
  window.LueurAnimations?.init?.();
}
