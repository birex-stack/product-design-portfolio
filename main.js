import './styles.css';

const assetBase = import.meta.env.BASE_URL;

document.documentElement.style.setProperty(
  '--karmen-teaser-bg',
  `url("${assetBase}images/karmen-teaser-bg.png")`
);
document.documentElement.style.setProperty(
  '--ibm-teaser-bg',
  `url("${assetBase}images/ibm-xftm-teaser-bg.png")`
);

const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

function closeMenu() {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navMenu.classList.remove('open');
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

function getSectionBehindHeader() {
  if (!header) return null;
  const probeY = header.offsetHeight + 1;
  const sections = document.querySelectorAll('.story-band');

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > probeY) {
      return section;
    }
  }

  return null;
}

function isDarkSection(section) {
  if (!section) return false;
  return (
    section.classList.contains('story-band--g100') ||
    section.classList.contains('story-band--contact') ||
    section.classList.contains('story-band--footer')
  );
}

function updateHeader() {
  if (!header) return;

  const activeSection = getSectionBehindHeader();
  const onDark = isDarkSection(activeSection);
  const isHero =
    activeSection?.id === 'top' ||
    activeSection?.classList.contains('story-band--hero');
  const isAtTop = window.scrollY <= 12 && isHero;

  header.classList.toggle('is-scrolled', window.scrollY > 12);
  header.classList.toggle('is-at-top', isAtTop);
  header.classList.toggle('is-on-dark', onDark && !isAtTop);
  header.classList.toggle('is-on-light', !onDark && !isAtTop);

  scrollTicking = false;
}

let scrollTicking = false;

window.addEventListener(
  'scroll',
  () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateHeader);
    }
  },
  { passive: true }
);

window.addEventListener('resize', updateHeader, { passive: true });

updateHeader();

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    history.pushState(null, '', targetId);
  });
});

function revealElement(el) {
  el.classList.add('is-visible');
}

function initRevealAnimations() {
  const revealTargets = document.querySelectorAll(
    '.reveal, .reveal-heading, .reveal-text, .reveal-image, .reveal-stagger'
  );

  if (!revealTargets.length) return;

  if (prefersReducedMotion) {
    revealTargets.forEach(revealElement);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

initRevealAnimations();

function initGridSpotlight() {
  if (prefersReducedMotion) return;

  document.querySelectorAll('.story-band--grid').forEach((section) => {
    section.addEventListener(
      'mouseenter',
      () => {
        section.classList.add('is-grid-hover');
      },
      { passive: true }
    );

    section.addEventListener(
      'mouseleave',
      () => {
        section.classList.remove('is-grid-hover');
      },
      { passive: true }
    );

    section.addEventListener(
      'mousemove',
      (event) => {
        const rect = section.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        section.style.setProperty('--grid-spot-x', `${x}%`);
        section.style.setProperty('--grid-spot-y', `${y}%`);
      },
      { passive: true }
    );
  });
}

initGridSpotlight();

const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<button class="lightbox-close" aria-label="Close">×</button>';
document.body.appendChild(lightbox);

const lightboxImg = document.createElement('img');
lightbox.appendChild(lightboxImg);

function closeLightbox() {
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
}

lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});

document.querySelectorAll('.zoomable').forEach((img) => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });
});
