(() => {
  /* Nav */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  const burger = nav.querySelector('.nav__burger');
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', nav.classList.toggle('is-open')));
  nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* System map: select a node, update the info panel (content from the one-pager) */
  const data = {
    a: { k: 'A · Federated Agentis', word: 'Syntax', cap: 'on AgentStation, from MiPhi', tint: '--ka', list: [
      'Complete AI stack: KV-cache offload, local model serving, integrations, agent platform',
      'On-premises appliance inside your own network',
      'Cited research with Word, PDF, PowerPoint and Excel output',
      'Agents, routines and a meeting notetaker, with human approval gates'] },
    b: { k: 'B · Federated Build', word: 'Any tool', cap: 'idea to working agent', tint: '--kb', list: [
      'A build team that realises any agentic tool you need, on top of Agentis',
      'For example: tender and bid-response assistants, technical documentation search',
      'Same approval gates and audit trail'] },
    c: { k: 'C · Federated Cloud', word: 'aiDAPTIV+', cap: 'MiPhi memory extension, in the box', tint: '--kc', list: [
      'GPU servers with aiDAPTIV+ built in',
      'Larger models, longer context, more users on the same GPUs',
      'Sessions spill onto in-box flash instead of failing',
      'Enterprise NVIDIA GPUs, shared across business units'] },
    d: { k: 'D · Federated DC', word: 'Private', cap: 'under your control', tint: '--kd', list: [
      'Runs your private cloud or on-premises build',
      'Hosting, power, cooling, networking and security'] },
    e: { k: 'E · Federated Ecosystem', word: 'Connected', cap: 'partners and clients', tint: '--ke', list: [
      'For clients: a trusted network of vendors, integrators and software builders',
      'For partners: access to clients and a governed platform'] }
  };
  const info = document.querySelector('.info');
  const nodes = document.querySelectorAll('.node[data-k]');
  const select = k => {
    const d = data[k];
    nodes.forEach(n => n.classList.toggle('is-on', n.dataset.k === k));
    info.style.setProperty('--tint', `var(${d.tint})`);
    info.querySelector('.info__k').textContent = d.k;
    info.querySelector('.info__word').textContent = d.word;
    info.querySelector('.info__cap').textContent = d.cap;
    info.querySelector('.info__list').innerHTML = d.list.map(t => `<li>${t}</li>`).join('');
    info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
  };
  nodes.forEach(n => {
    // C sits inside D: stop the click reaching the container
    n.addEventListener('click', e => { e.stopPropagation(); select(n.dataset.k); stopTour(); });
    n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.dataset.k); stopTour(); } });
  });
  select('a');

  // Gentle auto-tour until the visitor interacts
  const order = ['a', 'b', 'c', 'd', 'e'];
  let ti = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tour = reduce ? null : setInterval(() => { ti = (ti + 1) % order.length; select(order[ti]); }, 3800);
  function stopTour() { if (tour) { clearInterval(tour); tour = null; } }

  /* Components: expanding strips */
  const strips = document.querySelectorAll('.s');
  const open = s => strips.forEach(x => x.classList.toggle('is-open', x === s));
  strips.forEach(s => {
    s.addEventListener('click', () => open(s));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(s); } });
    if (window.matchMedia('(hover: hover) and (min-width: 1025px)').matches) s.addEventListener('mouseenter', () => open(s));
  });

  /* aiDAPTIV+: drag to compare */
  const compare = document.querySelector('.compare');
  const range = compare.querySelector('.compare__range');
  range.addEventListener('input', () => compare.style.setProperty('--pos', `${range.value}%`));

  /* Who: client / partner switch */
  const sw = document.querySelector('.switch');
  sw.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    sw.dataset.who = b.dataset.who;
    sw.querySelectorAll('button').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
    document.querySelectorAll('.who__panel').forEach(p => { p.hidden = p.dataset.who !== b.dataset.who; });
  }));
})();
