/* =============================================================
   MAIN.JS — Esprit Coiffure (Salon Interactions)
   ============================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initHeader();
  initNavDrawer();
  initAccordions();
  initSmoothScroll();
  initBackToTop();
  initContactForm();
  initGalleryLightbox();
  initVideoHero();
  initVideoCards();
  if (window.lucide) lucide.createIcons();
});

/* -- Header scroll shadow ---------------------------------- */
function initHeader() {
  var header = document.getElementById('siteHeader');
  if (!header) return;
  var onScroll = function () {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* -- Mobile Nav Drawer ------------------------------------- */
function initNavDrawer() {
  var drawer  = document.getElementById('navDrawer');
  var toggle  = document.getElementById('menuToggle');
  var close   = document.getElementById('navClose');
  var backdrop = document.getElementById('navBackdrop');
  if (!drawer || !toggle) return;

  var open = function () {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  var shut = function () {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', open);
  if (close)    close.addEventListener('click', shut);
  if (backdrop) backdrop.addEventListener('click', shut);

  drawer.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') shut();
    trapFocus(e, drawer);
  });

  /* Close drawer when clicking a nav link */
  drawer.querySelectorAll('a[href]').forEach(function (link) {
    link.addEventListener('click', shut);
  });
}

/* -- Accordion / FAQ --------------------------------------- */
function initAccordions() {
  document.querySelectorAll('.accordion__header').forEach(function (header) {
    header.addEventListener('click', function () {
      var item   = header.closest('.accordion__item');
      if (!item) return;
      var body   = item.querySelector('.accordion__content');
      if (!body) return;
      var isOpen = header.getAttribute('aria-expanded') === 'true';
      var acc    = item.closest('.accordion');

      /* Close siblings if not multi-open */
      if (acc && !acc.dataset.multiopen) {
        acc.querySelectorAll('.accordion__item').forEach(function (sib) {
          if (sib !== item) {
            var sibHead = sib.querySelector('.accordion__header');
            var sibBody = sib.querySelector('.accordion__content');
            if (sibHead) sibHead.setAttribute('aria-expanded', 'false');
            if (sibBody) sibBody.classList.remove('open');
          }
        });
      }

      header.setAttribute('aria-expanded', String(!isOpen));
      body.classList.toggle('open', !isOpen);
    });
  });
}

/* -- Smooth anchor scrolling ------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
}

/* -- Back to Top Button ------------------------------------ */
function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var show = window.scrollY > 600;
        btn.classList.toggle('visible', show);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* -- Contact Form ------------------------------------------ */
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = form.querySelector('[name="name"]');
    var email   = form.querySelector('[name="email"]');
    var phone   = form.querySelector('[name="phone"]');
    var message = form.querySelector('[name="message"]');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var valid   = true;

    /* Reset errors */
    form.querySelectorAll('.form-error').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('.is-error').forEach(function (el) { el.classList.remove('is-error'); });

    if (!name || !name.value.trim()) {
      showFieldError(name, 'Veuillez entrer votre nom');
      valid = false;
    }
    if (!email || !emailRe.test(email.value.trim())) {
      showFieldError(email, 'Veuillez entrer un email valide');
      valid = false;
    }
    if (message && !message.value.trim()) {
      showFieldError(message, 'Veuillez écrire votre message');
      valid = false;
    }

    if (!valid) return;

    /* Simulate success */
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
    }

    setTimeout(function () {
      form.innerHTML =
        '<div style="text-align:center;padding:var(--sp-8)">' +
          '<i data-lucide="check-circle" style="width:48px;height:48px;color:var(--c-success);margin-bottom:var(--sp-4)"></i>' +
          '<h3 style="font-size:var(--fs-xl);margin-bottom:var(--sp-2)">Message envoyé !</h3>' +
          '<p style="color:var(--c-text-2)">Nous vous répondrons dans les plus brefs délais.</p>' +
        '</div>';
      if (window.lucide) lucide.createIcons();
    }, 1200);
  });
}

function showFieldError(field, msg) {
  if (!field) return;
  field.classList.add('is-error');
  var errorEl = field.parentElement.querySelector('.form-error');
  if (errorEl) errorEl.textContent = msg;
}

/* -- Gallery Lightbox (service & gallery pages) ------------ */
function initGalleryLightbox() {
  var items = document.querySelectorAll('[data-lightbox]');
  if (!items.length) return;

  var overlay = document.createElement('div');
  overlay.id = 'lightboxOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:none;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity var(--t-base)';
  overlay.innerHTML =
    '<button aria-label="Fermer" style="position:absolute;top:var(--sp-4);right:var(--sp-4);background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;z-index:2">&times;</button>' +
    '<img id="lightboxImg" src="" alt="" style="max-width:90vw;max-height:90vh;border-radius:var(--r-md);object-fit:contain;transform:scale(0.95);transition:transform var(--t-base)">';
  document.body.appendChild(overlay);

  var img = document.getElementById('lightboxImg');

  items.forEach(function (item) {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function (e) {
      e.preventDefault();
      var src = item.getAttribute('data-lightbox') || item.querySelector('img')?.src;
      var alt = item.getAttribute('data-lightbox-alt') || item.querySelector('img')?.alt || '';
      if (!src) return;
      img.src = src;
      img.alt = alt;
      overlay.style.display = 'flex';
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        img.style.transform = 'scale(1)';
      });
      document.body.style.overflow = 'hidden';
    });
  });

  overlay.addEventListener('click', function () {
    overlay.style.opacity = '0';
    img.style.transform = 'scale(0.95)';
    setTimeout(function () {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 250);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      overlay.click();
    }
  });
}

/* -- Video Hero (pause on scroll past) --------------------- */
function initVideoHero() {
  var video = document.querySelector('.hero__video');
  if (!video) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );
  observer.observe(video);
}

/* -- Toast Notification ------------------------------------ */
var toastTimer = null;

function showToast(message, duration) {
  duration = duration || 3000;
  var toast = document.getElementById('toast');
  var msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  if (!toast.hasAttribute('aria-live')) toast.setAttribute('aria-live', 'polite');
  msgEl.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('show');
  }, duration);
}

/* -- Focus trap helper (a11y) ------------------------------ */
function trapFocus(e, container) {
  if (e.key !== 'Tab') return;
  var focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  var first = focusable[0];
  var last  = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* -- Video Cards (play on hover) ---------------------------- */
function initVideoCards() {
  document.querySelectorAll('.video-card').forEach(function (card) {
    var video = card.querySelector('video');
    var playBtn = card.querySelector('.video-card__play');
    if (!video) return;

    card.addEventListener('mouseenter', function () {
      video.play().catch(function () {});
      if (playBtn) playBtn.style.opacity = '0';
    });
    card.addEventListener('mouseleave', function () {
      video.pause();
      video.currentTime = 0;
      if (playBtn) playBtn.style.opacity = '1';
    });

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (video.paused) {
          video.play().catch(function () {});
          playBtn.style.opacity = '0';
        } else {
          video.pause();
          playBtn.style.opacity = '1';
        }
      });
    }
  });
}

/* -- Escape HTML helper ------------------------------------ */
function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
