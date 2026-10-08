(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const burger = nav.querySelector('.nav__burger');
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', nav.classList.toggle('is-open')));
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* Menus: mark the current page, and its section (Platform for component pages) */
  let here = location.pathname.split('/').pop() || 'index.html';
  if (!here.includes('.')) here += '.html';
  const section = { 'agentis.html': 'platform.html', 'build.html': 'platform.html', 'cloud.html': 'platform.html', 'dc.html': 'platform.html', 'ecosystem.html': 'platform.html', 'case-study.html': 'case-studies.html' }[here];
  document.querySelectorAll('.nav__links a, .footer__cols a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here) a.setAttribute('aria-current', 'page');
    else if (href === section) a.classList.add('is-section');
  });

  /* Hero: typed rotating word, one per component */
  const words = [['private agents', 'a'], ['custom tools', 'b'], ['GPU compute', 'c'], ['data centres', 'd'], ['partner networks', 'e']];
  const word = document.querySelector('.rotator__word');
  if (word && !reduce) {
    let w = 0, i = words[0][0].length, deleting = true;
    const tick = () => {
      const [text, c] = words[w];
      if (deleting) {
        i--;
        word.textContent = text.slice(0, i);
        if (i === 0) { deleting = false; w = (w + 1) % words.length; word.dataset.c = words[w][1]; }
        setTimeout(tick, 38);
      } else {
        const next = words[w][0];
        i++;
        word.textContent = next.slice(0, i);
        if (i === next.length) { deleting = true; setTimeout(tick, 2400); } else setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 2600);
  }

  /* Hero: full-section dot pattern with a slow ripple from the mark and a soft cursor glow */
  const canvas = document.querySelector('.hero__pattern');
  if (canvas) {
    const hero = canvas.parentElement;
    const mark = hero.querySelector('.hero__mark');
    const ctx = canvas.getContext('2d');
    const GAP = 26, R = 1.1;
    let w, h, dpr, ox, oy, mx = -9999, my = -9999, running = true, last = 0;

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hr = hero.getBoundingClientRect(), m = mark.getBoundingClientRect();
      ox = m.left - hr.left + m.width / 2; oy = m.top - hr.top + m.height / 2;
    };

    const draw = t => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const d = Math.hypot(x - ox, y - oy);
          // ripple travelling outward from the mark, fading with distance
          const wave = Math.pow((Math.sin(d / 80 - time * 1.1) + 1) / 2, 4) * Math.max(0, 1 - d / 1300);
          const near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 150);
          const a = .09 + wave * .5 + near * .45;
          ctx.fillStyle = wave > .55 ? `rgba(255, 98, 86, ${a})` : `rgba(255, 255, 255, ${a})`;
          ctx.beginPath(); ctx.arc(x, y, R + wave * .6 + near * .6, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const loop = t => {
      if (!running) return;
      if (t - last > 33) { draw(t); last = t; } // ~30fps is plenty for a background
      requestAnimationFrame(loop);
    };

    size();
    if (reduce) draw(0);
    else {
      requestAnimationFrame(loop);
      new IntersectionObserver(([e]) => {
        const was = running; running = e.isIntersecting;
        if (running && !was) requestAnimationFrame(loop);
      }).observe(hero);
      hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      hero.addEventListener('pointerleave', () => { mx = my = -9999; });
    }
    window.addEventListener('resize', () => { size(); if (reduce) draw(0); });
    window.addEventListener('load', size);
  }

  /* Hero: highlight ticker */
  const items = document.querySelectorAll('.ticker__item');
  const dots = document.querySelectorAll('.ticker__dots i');
  let t = 0;
  if (items.length && !reduce) setInterval(() => {
    items[t].classList.remove('is-on'); dots[t].classList.remove('is-on');
    t = (t + 1) % items.length;
    items[t].classList.add('is-on'); dots[t].classList.add('is-on');
  }, 2600);

  /* Reveal */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* Components: vertical scroll drives the cards sideways while the section is pinned */
  const comp = document.querySelector('.components');
  if (comp) {
  const pin = comp.querySelector('.components__pin');
  const rail = comp.querySelector('.rail');
  const bar = comp.querySelector('.comp__bar');
  const count = comp.querySelector('.comp__count');
  const cards = rail.querySelectorAll('.card');
  const PACE = 1.6; // px of vertical scroll per px of horizontal travel
  let dist = 0, enabled = false;

  const measure = () => {
    enabled = window.innerWidth > 800;
    if (!enabled) { comp.style.height = ''; rail.style.transform = ''; return; }
    dist = Math.max(0, rail.scrollWidth - window.innerWidth);
    comp.style.height = `${pin.offsetHeight + dist * PACE}px`;
    update();
  };
  const update = () => {
    if (!enabled) return;
    const top = comp.getBoundingClientRect().top;
    const p = dist ? Math.min(1, Math.max(0, -top / (dist * PACE))) : 0;
    rail.style.transform = `translate3d(${-p * dist}px, 0, 0)`;
    bar.style.setProperty('--p', p);
    count.textContent = `0${Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)} / 0${cards.length}`;
  };
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  measure();
  }

  /* Audiences: hover (or tap/focus) a half to expand it */
  const halves = document.querySelectorAll('.split__half');
  const openHalf = h => halves.forEach(x => x.classList.toggle('is-open', x === h));
  const canHover = window.matchMedia('(hover: hover) and (min-width: 801px)').matches;
  halves.forEach(h => {
    h.addEventListener('click', () => openHalf(h));
    h.addEventListener('focus', () => openHalf(h));
    if (canHover) h.addEventListener('mouseenter', () => openHalf(h));
  });

  /* Legal pages: highlight the table-of-contents entry for the section in view */
  const tocLinks = document.querySelectorAll('.lg__toc a');
  if (tocLinks.length) {
    const byId = {};
    tocLinks.forEach(a => { byId[a.getAttribute('href').slice(1)] = a; });
    const spy = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) tocLinks.forEach(a => a.classList.toggle('is-on', a === byId[e.target.id]));
    }), { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.lg__sec').forEach(s => spy.observe(s));
  }

  /* Case studies: filter cards by component */
  const csFilters = document.querySelectorAll('.csh__filters button');
  if (csFilters.length) {
    const cards = document.querySelectorAll('.csl .csc');
    const empty = document.querySelector('.csl__empty');
    csFilters.forEach(b => b.addEventListener('click', () => {
      const f = b.dataset.f;
      csFilters.forEach(x => x.classList.toggle('is-on', x === b));
      let shown = 0;
      cards.forEach(c => { const hit = f === 'all' || c.dataset.k.split(' ').includes(f); c.hidden = !hit; if (hit) shown++; });
      empty.hidden = shown > 0;
    }));
  }

  /* How it fits: exploded view, scrubbed by scroll */
  const o10 = document.querySelector('.o10');
  if (o10) {
    const track = o10.querySelector('.o10__track');
    const order = ['a', 'b', 'c', 'd', 'e'];
    const lay = {}; o10.querySelectorAll('.iso__layer').forEach(l => { lay[l.dataset.k] = l; });
    const items = {}; o10.querySelectorAll('.o10__list li').forEach(li => { items[li.dataset.k] = li; });
    const title = o10.querySelector('.o10__title'), sub = o10.querySelector('.o10__sub');
    const bar = o10.querySelector('.o10__progress');
    // offsets that collapse the drawn (exploded) geometry into a tight stack
    const packed = { a: 105, b: 45, c: -15, d: -75, e: -95 };
    const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
    const update = () => {
      if (window.innerWidth <= 1024 || reduce) {
        order.forEach(k => { lay[k].style.transform = ''; lay[k].classList.add('is-on'); items[k].classList.add('is-on'); });
        o10.classList.add('is-done'); title.textContent = 'One stack.'; sub.textContent = 'Together or one at a time, with one integrator accountable.';
        return;
      }
      const r = track.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (track.offsetHeight - window.innerHeight)));
      const e = p < .3 ? ease((p - .06) / .24) : p < .8 ? 1 : 1 - ease((p - .8) / .14);
      const idx = p < .3 ? -1 : p >= .8 ? 5 : Math.min(4, Math.floor((p - .3) / .5 * 5));
      order.forEach((k, i) => {
        lay[k].style.transform = `translateY(${packed[k] * (1 - e)}px)`;
        lay[k].classList.toggle('is-on', i <= idx);
        items[k].classList.toggle('is-on', i <= idx);
        items[k].classList.toggle('is-cur', i === idx);
      });
      const done = p >= .8;
      o10.classList.toggle('is-done', done);
      title.textContent = done ? 'One stack.' : 'Five layers.';
      sub.textContent = done ? 'Together or one at a time, with one integrator accountable.' : p < .3 ? 'Scroll to take the stack apart.' : 'Each one stands on its own.';
      bar.style.setProperty('--p', p);
    };
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* How it fits: use-case walkthrough */
  const o12 = document.querySelector('.o12');
  if (o12) {
    const cases = {
      bid: { t: 'Tender and bid-response assistant', desc: 'An assistant built around your bid process, with your people approving every response.', out: ['Your tools', 'Approval gates', 'Audit trail'],
        b: 'Our build team creates the assistant around your bid process.', a: 'It runs on the agent platform, with approval gates and an audit trail.', c: 'Models are served on GPUs in your own data centre.', d: 'Bid documents stay on infrastructure under your control.', light: [] },
      research: { t: 'Cited research across large document sets', desc: 'Ask questions across large document sets and get answers with citations.', out: ['Word', 'PDF', 'PowerPoint', 'Excel'],
        b: 'Not needed: this works out of the box. Build can add custom tools later.', a: 'Syntax on AgentStation runs the research and cites its sources.', c: 'Larger models and longer context on the same GPUs, with aiDAPTIV+.', d: 'Your documents stay inside your own network.', light: ['b'] },
      docs: { t: 'Technical documentation search', desc: 'A search tool across your technical documentation, built for your teams.', out: ['Integrated', 'Role-based access', 'Audit trail'],
        b: 'Our build team creates the search tool and connects it to your sources.', a: 'Enterprise integrations, with role-based access controlling what each person sees.', c: 'Local model serving on enterprise NVIDIA GPUs.', d: 'Hosting, power and security under your control.', light: [] },
      notes: { t: 'Meeting notetaker', desc: 'Agents, routines and a meeting notetaker, with human approval gates.', out: ['Approval gates', 'Metering', 'Audit trail'],
        b: 'Not needed: included in Agentis. Build can tailor it further.', a: 'The notetaker and routines run on the agent platform, with human approval gates.', c: 'More users on the same GPUs, with aiDAPTIV+.', d: 'Meeting notes stay on infrastructure under your control.', light: ['b'] }
    };
    const chips = document.querySelectorAll('.o12__chips button');
    const box = o12.querySelector('.o12__case');
    const lanes = o12.querySelectorAll('.lane');
    const replay = el => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); };
    const set = u => {
      const c = cases[u];
      chips.forEach(ch => { const on = ch.dataset.u === u; ch.classList.toggle('is-on', on); ch.setAttribute('aria-selected', on); });
      box.querySelector('.o12__t').textContent = c.t;
      box.querySelector('.o12__d').textContent = c.desc;
      box.querySelector('.o12__out').innerHTML = c.out.map(o => `<span>${o}</span>`).join('');
      replay(box);
      lanes.forEach(l => { const p = l.querySelector('p'); p.textContent = c[l.dataset.k]; replay(p); l.classList.toggle('is-light', c.light.includes(l.dataset.k)); });
    };
    chips.forEach(ch => ch.addEventListener('click', () => set(ch.dataset.u)));
    set('bid');
  }

  /* Platform page: stack builder */
  const builder = document.querySelector('.o11');
  if (builder) {
    const names = { a: 'Agentis', b: 'Build', c: 'Cloud', d: 'DC', e: 'Ecosystem' };
    const order = ['a', 'b', 'c', 'd', 'e'];
    const boxes = builder.querySelectorAll('input[type=checkbox]');
    const layers = builder.querySelectorAll('.o11__iso .iso__layer');
    const presets = builder.querySelectorAll('.o11__presets button');
    const sum = builder.querySelector('.o11__sum');
    const sorted = s => [...s].sort().join('');
    const render = () => {
      const on = order.filter(k => builder.querySelector(`input[data-k="${k}"]`).checked);
      layers.forEach(l => { const v = on.includes(l.dataset.k); l.classList.toggle('is-on', v); l.classList.toggle('is-ghost', !v); });
      presets.forEach(p => p.classList.toggle('is-on', sorted(p.dataset.set) === sorted(on.join(''))));
      sum.innerHTML = !on.length ? 'Choose at least one layer.'
        : on.length === 5 ? 'The full FederatedOne stack.<span>One integrator accountable, from software to data centre.</span>'
        : `Your stack: ${on.map(k => names[k]).join(' + ')}.<span>Each layer works on its own, with one integrator for all of them.</span>`;
    };
    boxes.forEach(b => b.addEventListener('change', render));
    presets.forEach(p => p.addEventListener('click', () => { boxes.forEach(b => { b.checked = p.dataset.set.includes(b.dataset.k); }); render(); }));
    render();
  }

  /* FAQ page: live search across questions and answers */
  const fqInput = document.querySelector('.fq__search input');
  if (fqInput) {
    const groups = [...document.querySelectorAll('.fq__group')];
    const items = groups.flatMap(g => [...g.querySelectorAll('details')]);
    const empty = document.querySelector('.fq__empty');
    const help = document.querySelector('.fq .lg__help');
    items.forEach(d => { d.dataset.q = d.querySelector('summary').innerHTML; });
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const run = () => {
      const q = fqInput.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(d => {
        const hit = !q || d.textContent.toLowerCase().includes(q);
        d.hidden = !hit;
        d.open = !!q && hit;
        const s = d.querySelector('summary');
        // wrap in one span so the highlight stays inline inside the flex summary row
        s.innerHTML = `<span>${q && hit ? d.dataset.q.replace(new RegExp(`(${esc(q)})`, 'gi'), '<mark>$1</mark>') : d.dataset.q}</span>`;
        if (hit) shown++;
      });
      groups.forEach(g => {
        const any = [...g.querySelectorAll('details')].some(d => !d.hidden);
        g.hidden = !any;
        document.querySelector(`.lg__toc a[href="#${g.id}"]`)?.classList.toggle('is-dim', !any);
      });
      empty.hidden = shown > 0;
      help.hidden = shown === 0;
    };
    fqInput.addEventListener('input', run);
  }

  /* Contact form: prefill from the link, validate, show a thank-you state */
  const fm = document.querySelector('.fm');
  if (fm) {
    const q = new URLSearchParams(location.search);
    if (q.get('type') === 'partner') fm.querySelector('input[name="who"][value="partner"]').checked = true;
    (q.get('c') || '').split(',').forEach(k => { const box = fm.querySelector(`input[name="interest"][value="${k}"]`); if (box) box.checked = true; });

    fm.addEventListener('input', e => e.target.closest('.fm__field, .fm__consent')?.classList.remove('is-invalid'));
    fm.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      fm.querySelectorAll('input[required]').forEach(i => {
        const bad = i.type === 'checkbox' ? !i.checked : (!i.value.trim() || (i.type === 'email' && !i.checkValidity()));
        i.closest('.fm__field, .fm__consent').classList.toggle('is-invalid', bad);
        if (bad && !first) first = i;
      });
      if (first) { first.focus(); return; }
      // Prototype only: send the enquiry to the CRM / email endpoint here.
      fm.style.minHeight = `${fm.offsetHeight}px`;
      fm.classList.add('is-sent');
      fm.querySelector('.fm__done').hidden = false;
      fm.style.display = 'grid'; fm.style.alignContent = 'center';
    });
  }

  /* Comparison: toggle between multi-vendor and FederatedOne */
  const cmp = document.querySelector('.cmp');
  if (cmp) {
    const count = cmp.querySelector('.cmp__count');
    const note = cmp.querySelector('.cmp__note');
    const btns = cmp.querySelectorAll('.cmp__switch button');
    const setMode = mode => {
      const us = mode === 'us';
      cmp.dataset.mode = mode;
      btns.forEach(x => { const on = x.dataset.mode === mode; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
      count.textContent = us ? '6 / 6' : '0 / 6';
      note.innerHTML = us ? 'All six, with one name accountable. Tap <b>Multi-vendor</b> to compare.' : 'Tap <b>FederatedOne</b> to see the difference.';
    };
    btns.forEach(b => b.addEventListener('click', () => { cmp.classList.add('is-touched'); setMode(b.dataset.mode); }));
    setMode('them');

    // Auto-play once: shortly after the section is in view, show the FederatedOne state
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      setTimeout(() => { if (!cmp.classList.contains('is-touched')) setMode('us'); }, reduce ? 0 : 1800);
    }, { threshold: .5 }).observe(cmp.querySelector('.cmp__box'));
  }
})();
