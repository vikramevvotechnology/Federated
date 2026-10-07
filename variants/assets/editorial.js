(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: solid on scroll, mobile menu */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = nav.querySelector('.nav__burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* Reveal on scroll, staggered within each parent */
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--rd', siblings.indexOf(el));
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach(el => io.observe(el));

  /* Hero: highlight one layer at a time once the stack has settled */
  const isoLayers = [...document.querySelectorAll('.iso__layer')].sort((a, b) => a.style.getPropertyValue('--i') - b.style.getPropertyValue('--i'));
  if (!reduce && isoLayers.length) {
    let i = 0;
    setTimeout(() => {
      setInterval(() => {
        isoLayers.forEach(l => l.classList.remove('is-active'));
        isoLayers[i % isoLayers.length].classList.add('is-active');
        i++;
      }, 2200);
    }, 3000);
  }

  /* Stack: scroll steps light up diagram layers */
  const steps = document.querySelectorAll('.stack__step');
  const parts = document.querySelectorAll('.diagram [data-layer]');
  const setLayer = k => {
    steps.forEach(s => s.classList.toggle('is-active', s.dataset.layer === k));
    parts.forEach(p => p.classList.toggle('is-active', p.dataset.layer === k));
  };
  const stepIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setLayer(e.target.dataset.layer); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => stepIO.observe(s));
  setLayer('B');

  /* aiDAPTIV+: with / without comparison */
  const tiers = document.querySelector('.tiers');
  const status = document.querySelector('.aid__status');
  const copy = {
    with: 'Overflow spills onto in-box flash. The session continues.',
    without: 'GPU memory is full. The session fails or has to be cut short.'
  };
  document.querySelectorAll('.toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle__btn').forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on);
      });
      tiers.dataset.mode = btn.dataset.mode;
      status.textContent = copy[btn.dataset.mode];
    });
  });

  /* Configurator */
  const names = { A: 'Agentis', B: 'Build', C: 'Cloud', D: 'DC', E: 'Ecosystem' };
  const phrases = {
    A: 'the complete AI stack and agent platform',
    B: 'agentic tools built around your work',
    C: 'GPU servers with aiDAPTIV+ memory extension',
    D: 'data-centre hosting under your control',
    E: 'a trusted network of partners'
  };
  const order = ['A', 'B', 'C', 'D', 'E'];
  const config = document.querySelector('.config');
  const chips = config.querySelectorAll('.chip');
  const rows = config.querySelectorAll('.mini__row');
  const sentence = config.querySelector('.config__sentence');
  const list = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const selected = () => order.filter(k => config.querySelector(`.chip[data-k="${k}"]`).classList.contains('is-on'));

  const render = () => {
    const on = selected();
    rows.forEach(r => r.classList.toggle('is-on', on.includes(r.dataset.k)));
    if (!on.length) sentence.textContent = 'Choose a component to begin.';
    else if (on.length === 5) sentence.textContent = 'All five: the complete FederatedOne, one accountable integrator from software to data centre.';
    else {
      const p = list(on.map(k => phrases[k]));
      sentence.textContent = `${on.map(k => names[k]).join(' + ')}: ${p.charAt(0).toUpperCase() + p.slice(1)}.`;
    }
  };
  chips.forEach(c => c.addEventListener('click', () => {
    const v = c.classList.toggle('is-on');
    c.setAttribute('aria-pressed', v);
    render();
  }));
  render();

  /* Enquiry form */
  const form = document.querySelector('.enquiry');
  const formChips = form.querySelectorAll('.chip');
  const setChip = (c, v) => { c.classList.toggle('is-on', v); c.setAttribute('aria-pressed', v); };
  formChips.forEach(c => c.addEventListener('click', () => setChip(c, !c.classList.contains('is-on'))));

  // "Discuss this configuration" carries the configurator selection into the form
  config.querySelector('.link-arrow').addEventListener('click', () => {
    const on = selected();
    formChips.forEach(c => setChip(c, on.includes(c.dataset.k)));
  });

  form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input[required]').forEach(i => {
      const bad = !i.value.trim() || (i.type === 'email' && !i.checkValidity());
      i.closest('.field').classList.toggle('is-invalid', bad);
      if (bad && ok) { i.focus(); ok = false; }
    });
    if (!ok) return;
    // Prototype only: connect to the CRM / email endpoint here.
    form.style.minHeight = form.offsetHeight + 'px';
    form.classList.add('is-sent');
    form.querySelector('.enquiry__done').hidden = false;
  });
})();
