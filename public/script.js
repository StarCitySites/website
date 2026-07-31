(() => {
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const year = document.querySelector('[data-year]');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const updateHeader = () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 24);
    }
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeNav = () => {
    if (!navToggle || !nav) return;
    navToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      nav.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('nav-open', !isOpen);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNav();
    });
  }

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  const contactForm = document.querySelector('.contact-form');
  document.querySelectorAll('a[href="#contact"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (!contactForm) return;
      const label = link.textContent.trim().toLowerCase();
      const projectSelect = contactForm.querySelector('[name="project_type"]');
      const message = contactForm.querySelector('[name="message"]');

      if (label.includes('launch') || label.includes('growth')) {
        projectSelect.value = 'New website';
      } else if (label.includes('custom')) {
        projectSelect.value = 'Something else';
      } else if (label.includes('care')) {
        projectSelect.value = 'Hosting and maintenance';
      }

      if (message && !message.value && label.includes('launch')) {
        message.placeholder = 'Tell me about your business and the focused website you need.';
      }
    });
  });

  const forms = document.querySelectorAll('[data-lead-form]');

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const status = form.querySelector('[data-form-status]');
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;

      status.textContent = '';
      status.className = 'form-status';

      if (!form.reportValidity()) return;

      form.classList.add('is-submitting');
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(payload)
        });

        let result = {};
        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (!response.ok) {
          throw new Error(result.message || 'The form could not be sent.');
        }

        form.reset();
        status.textContent = result.message || 'Thank you. Your request has been sent.';
        status.classList.add('success');
      } catch (error) {
        status.textContent = `${error.message} You can also email hello@starcitysites.com.`;
        status.classList.add('error');
      } finally {
        form.classList.remove('is-submitting');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  });
})();
