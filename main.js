import './styles.css';

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
    const spotlight = document.createElement('div');
    spotlight.className = 'grid-pixel-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    const offsetX = Math.floor(Math.random() * 8) * 8;
    const offsetY = Math.floor(Math.random() * 8) * 8;
    spotlight.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
    section.insertBefore(spotlight, section.firstChild);

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

function initPrincipleCards() {
  const cards = document.querySelectorAll('.principle-card');
  if (!cards.length) return;

  function syncPrincipleCardHeights() {
    cards.forEach((card) => {
      card.style.minHeight = '';
    });

    if (!window.matchMedia('(max-width: 640px)').matches) return;

    const maxHeight = Math.max(...[...cards].map((card) => card.offsetHeight));
    cards.forEach((card) => {
      card.style.minHeight = `${maxHeight}px`;
    });
  }

  function setFlipped(card, flipped) {
    card.classList.toggle('is-flipped', flipped);
    card.setAttribute('aria-expanded', flipped ? 'true' : 'false');
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('is-flipped')) {
        setFlipped(card, false);
        return;
      }

      cards.forEach((otherCard) => {
        if (otherCard !== card) {
          setFlipped(otherCard, false);
        }
      });

      setFlipped(card, true);
    });
  });

  syncPrincipleCardHeights();
  window.addEventListener('resize', syncPrincipleCardHeights);
  window.addEventListener('load', syncPrincipleCardHeights);
}

initPrincipleCards();

const CHALLENGE_CHAIN = [
  { file: 'ibm-xftm.html', title: 'IBM XFTM' },
  { file: 'elastic-cases.html', title: 'Elastic Cases' },
  { file: 'karmen.html', title: 'KARMEN' },
  // { file: 'elastic-slo.html', title: 'Elastic SLO' }, // hidden — restore when SLO returns to homepage
  { file: 'otomoto.html', title: 'Otomoto' },
  { file: 'mobile-games.html', title: 'My hobby' },
];

const CONTACT_LINK = 'https://linkedin.com/in/maciejforc/';

function initCaseNavFooter() {
  const footer = document.querySelector('.case-nav-footer');
  if (!footer || footer.dataset.navInit) return;
  footer.dataset.navInit = 'true';

  const pageName = window.location.pathname.split('/').pop();
  const currentIndex = CHALLENGE_CHAIN.findIndex(
    (challenge) => challenge.file === pageName
  );
  if (currentIndex === -1) return;

  const isLast = currentIndex === CHALLENGE_CHAIN.length - 1;

  if (isLast) {
    const footerBand = footer.closest('.story-band');
    if (!footerBand) return;

    const contactSection = document.createElement('section');
    contactSection.className =
      'story-band story-band--contact story-band--grid case-contact-closing';
    contactSection.innerHTML = `
      <div class="container story-chapter contact">
        <div class="contact-block project-card-copy">
          <h3>Have a product challenge?</h3>
          <a
            class="contact-cta"
            href="${CONTACT_LINK}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reach me on LinkedIn →
          </a>
        </div>
      </div>
    `;

    footerBand.before(contactSection);
    return;
  }

  const next = CHALLENGE_CHAIN[currentIndex + 1];
  const link = document.createElement('a');
  link.className = 'contact-cta case-nav-next';
  link.href = next.file;
  link.textContent = 'Next challenge →';
  link.setAttribute('aria-label', `Next challenge: ${next.title}`);

  footer.appendChild(link);
}

initCaseNavFooter();
