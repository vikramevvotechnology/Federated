/* Federated.One — page interactions (header, menu, reveals, counters, statement, preloader) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- Smooth scrolling (Lenis) ---------- */
  // Inertia scrolling: each wheel step glides instead of jumping, so the
  // sections and the glass logo animation can be followed comfortably.
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.5,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.1
    });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    lenis.stop(); // held until the preloader finishes
    window.federatedLenis = lenis;
  }
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#') return;
      var el = id === '#top' ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      scrollToTarget(el);
    });
  });

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  var countEl = document.getElementById('preloaderCount');
  var shown = 0;
  var target = 30;
  var glassReady = false;
  var pageLoaded = false;
  var finished = false;

  var lastTick = performance.now();
  function tickLoader(now) {
    if (finished) return;
    now = now || performance.now();
    var dt = Math.max(0, Math.min((now - lastTick) / 1000, 0.5));
    lastTick = now;
    if (pageLoaded) target = glassReady ? 100 : Math.max(target, 85);
    shown += (target - shown) * (1 - Math.pow(0.004, dt)) + dt * 12;
    if (shown > target) shown = target;
    countEl.textContent = String(Math.floor(shown)).padStart(2, '0');
    if (shown >= 99.5) return finishLoader();
    requestAnimationFrame(tickLoader);
  }
  function finishLoader() {
    if (finished) return;
    finished = true;
    if (preloader) {
      countEl.textContent = '100';
      preloader.classList.add('is-done');
    }
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    document.dispatchEvent(new CustomEvent('federated:start'));
  }
  if (preloader) {
    window.addEventListener('load', function () { pageLoaded = true; });
    document.addEventListener('federated:glass-ready', function () { glassReady = true; });
    // Never block the page on the 3D scene
    setTimeout(function () { glassReady = true; pageLoaded = true; }, 7000);
    requestAnimationFrame(tickLoader);
  } else {
    // Inner pages have no preloader or 3D scene: start once the rest of this script has run
    requestAnimationFrame(finishLoader);
  }

  /* ---------- Year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header ---------- */
  var header = document.getElementById('header');
  var lastY = window.scrollY;
  function onScrollHeader() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    var goingDown = y > lastY && y > 400;
    header.classList.toggle('is-hidden', goingDown && !body.classList.contains('menu-open'));
    lastY = y;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080 && body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Split headings into words ---------- */
  function splitNode(node, counter) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'word';
          var inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', counter.i++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        splitNode(child, counter);
      }
    });
  }
  document.querySelectorAll('.split').forEach(function (el) { splitNode(el, { i: 0 }); });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .split, .card, .bento__item');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

    // Hero waits for the preloader so its entrance is visible
    document.addEventListener('federated:start', function () {
      revealEls.forEach(function (el) { io.observe(el); });
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // stagger siblings inside grids
  ['.why__grid', '.bento', '.serve__grid', '.numbers__grid', '.solutions__list'].forEach(function (sel) {
    var grid = document.querySelector(sel);
    if (!grid) return;
    Array.prototype.forEach.call(grid.children, function (c, i) {
      var el = c.classList.contains('reveal') ? c : c.querySelector('.reveal') || c;
      el.style.transitionDelay = (i * 0.08) + 's';
    });
  });

  /* ---------- Counters ---------- */
  function animateCount(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion) { el.textContent = end; return; }
    var start = performance.now();
    var dur = 1600 + Math.min(end, 500);
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(end * eased);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { co.observe(el); });
  }

  /* ---------- Statement: word-by-word highlight on scroll ---------- */
  var statement = document.querySelector('.statement');
  var stText = document.getElementById('statementText');
  var words = [];
  if (stText) {
    var accent = ['private,', 'governed', 'AI', 'platform'];
    var parts = stText.textContent.trim().split(/\s+/);
    stText.textContent = '';
    parts.forEach(function (p, i) {
      var s = document.createElement('span');
      s.className = 'w' + (accent.indexOf(p) > -1 && i > 8 && i < 18 ? ' is-accent' : '');
      s.textContent = p;
      stText.appendChild(s);
      if (i < parts.length - 1) stText.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }
  function onScrollStatement() {
    if (!statement) return;
    var r = statement.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.1) / (total * 0.8)));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-on', i < n);
  }
  window.addEventListener('scroll', onScrollStatement, { passive: true });
  onScrollStatement();

  /* ---------- Audit log ticker ---------- */
  var log = document.getElementById('auditLog');
  if (log && !reduceMotion) {
    var tenants = ['finance', 'hr', 'bi', 'kb', 'legal', 'ops', 'risk', 'sales'];
    var tags = ['guardrail ok', 'cost tracked', 'isolated', 'logged for audit', 'policy applied'];
    setInterval(function () {
      if (document.hidden) return;
      var li = document.createElement('li');
      var t = tenants[Math.floor(Math.random() * tenants.length)];
      var g = tags[Math.floor(Math.random() * tags.length)];
      li.innerHTML = '<b>tenant/' + t + '</b> request logged <em>· ' + g + '</em>';
      log.insertBefore(li, log.firstChild);
      while (log.children.length > 7) log.removeChild(log.lastChild);
    }, 1800);
  }

  /* ---------- Glass sheen follows pointer ---------- */
  document.querySelectorAll('.glass').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Tabs (Platform capabilities) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var ink = root.querySelector('.tabs__ink');
    function moveInk(tab) {
      if (!ink) return;
      ink.style.width = tab.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
        if (on) panel.classList.add('is-in');   // replay bar / list animations
      });
      moveInk(tab);
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    window.addEventListener('resize', function () { moveInk(root.querySelector('.tabs__tab.is-active')); });
    document.addEventListener('federated:start', function () { moveInk(root.querySelector('.tabs__tab.is-active')); });
    moveInk(tabs[0]);
  });

  /* ---------- Architecture stack (Platform) ---------- */
  var stack = document.getElementById('archStack');
  if (stack) {
    var layers = Array.prototype.slice.call(stack.querySelectorAll('.stack__layer'));
    var detail = document.getElementById('archDetail');
    var showLayer = function (layer) {
      layers.forEach(function (l) { l.classList.toggle('is-active', l === layer); });
      document.getElementById('archIdx').textContent = layer.getAttribute('data-idx');
      document.getElementById('archTitle').textContent = layer.getAttribute('data-title');
      document.getElementById('archText').textContent = layer.getAttribute('data-text');
      detail.classList.remove('is-swap');
      void detail.offsetWidth;          // restart the swap animation
      detail.classList.add('is-swap');
    };
    layers.forEach(function (l) {
      l.addEventListener('click', function () { showLayer(l); });
      l.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) showLayer(l); });
    });
  }

  /* ---------- Partner hero: seat matrix (50 internal + 450 subscribers) ---------- */
  var seatGrid = document.getElementById('seatGrid');
  if (seatGrid) {
    var INTERNAL = 50, TOTAL = 500;
    var seatCount = document.getElementById('seatCount');
    var seats = [];
    for (var s = 0; s < TOTAL; s++) {
      var dot = document.createElement('i');
      seatGrid.appendChild(dot);
      seats.push(dot);
    }
    var filled = 0, seatTimer = null;
    var fillSeat = function () {
      if (filled >= TOTAL) {
        clearInterval(seatTimer);
        setTimeout(resetSeats, 4000);
        return;
      }
      // fill a few seats per tick so the whole matrix takes ~5 seconds
      for (var n = 0; n < 4 && filled < TOTAL; n++, filled++) {
        var d = seats[filled];
        d.classList.add(filled < INTERNAL ? 'is-a' : 'is-b', 'is-pop');
        (function (el) { setTimeout(function () { el.classList.remove('is-pop'); }, 300); })(d);
      }
      seatCount.textContent = filled;
    };
    var resetSeats = function () {
      seats.forEach(function (d) { d.classList.remove('is-a', 'is-b'); });
      filled = 0;
      seatCount.textContent = '0';
      startSeats();
    };
    var startSeats = function () {
      clearInterval(seatTimer);
      seatTimer = setInterval(fillSeat, 40);
    };
    if (reduceMotion) {
      seats.forEach(function (d, i) { d.classList.add(i < INTERNAL ? 'is-a' : 'is-b'); });
      seatCount.textContent = TOTAL;
    } else {
      document.addEventListener('federated:start', function () { setTimeout(startSeats, 600); });
    }
  }

  /* ---------- Contact form ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var wrap = form.parentElement;
    var done = wrap.querySelector('.enquiry__done');
    var status = form.querySelector('.form-status');
    var submitBtn = form.querySelector('[type="submit"]');
    var submitLabel = form.querySelector('.enquiry__submit-label');

    // Returning from FormSubmit (?sent=1): show the thank-you panel
    if (new URLSearchParams(window.location.search).get('sent') === '1') {
      form.hidden = true;
      done.hidden = false;
      document.addEventListener('federated:start', function () {
        var target = document.getElementById('enquiry');
        if (window.federatedLenis && target) window.federatedLenis.scrollTo(target, { immediate: true, force: true, offset: -40 });
        else if (target) target.scrollIntoView();
      });
      if (window.history && history.replaceState) history.replaceState(null, '', window.location.pathname + '#enquiry');
    }

    // Pre-select the topic from the URL, e.g. contact.html?topic=partnership
    var topicParam = new URLSearchParams(window.location.search).get('topic');
    if (topicParam) {
      var topicInput = form.querySelector('input[name="topic"][value="' + topicParam.replace(/[^a-z]/gi, '') + '"]');
      if (topicInput) topicInput.checked = true;
    }

    var messages = {
      name: 'Please enter your name.',
      email: 'Please enter a valid work email.',
      organization: 'Please enter your organization.',
      organization_type: 'Please choose an organization type.',
      message: 'Please tell us a little more (at least 10 characters).',
      consent: 'Please confirm we may use these details to reply.'
    };
    function errorEl(field) {
      return field.type === 'checkbox' ? form.querySelector('.consent__error') : field.closest('.field').querySelector('.field__error');
    }
    function check(field) {
      var ok = field.checkValidity();
      if (field.name === 'email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim());
      if (field.type !== 'checkbox' && field.required && !field.value.trim()) ok = false;
      var holder = field.type === 'checkbox' ? field.closest('.consent') : field.closest('.field');
      holder.classList.toggle('is-invalid', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      errorEl(field).textContent = ok ? '' : (messages[field.name] || 'Please check this field.');
      return ok;
    }
    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    required.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value || f.type === 'checkbox') check(f); });
      f.addEventListener('input', function () { if (f.closest('.is-invalid')) check(f); });
      f.addEventListener('change', function () { if (f.closest('.is-invalid')) check(f); });
    });
    form.querySelectorAll('.field__input').forEach(function (f) {
      var sync = function () { f.closest('.field').classList.toggle('has-value', !!f.value); };
      f.addEventListener('input', sync); f.addEventListener('change', sync); sync();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      required.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f; });
      if (firstBad) {
        status.textContent = 'Please fix the highlighted fields.';
        firstBad.focus();
        return;
      }
      status.textContent = '';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = window.location.pathname;

      var endpoint = form.getAttribute('data-endpoint');
      var isNetlify = form.hasAttribute('data-netlify');
      submitBtn.disabled = true;
      submitLabel.textContent = 'Sending…';
      var send;
      var host = window.location.hostname;
      var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || window.location.protocol === 'file:';

      // FormSubmit: post the form normally (its CORS rules block AJAX). It emails the
      // submission, then redirects back here with ?sent=1, which shows the thank-you panel.
      if (form.getAttribute('data-delivery') === 'formsubmit' && !isLocal) {
        var next = form.querySelector('input[name="_next"]');
        if (next) next.value = window.location.origin + window.location.pathname + '?sent=1';
        HTMLFormElement.prototype.submit.call(form);
        return;
      }

      if (isNetlify && !isLocal) {
        // Netlify Forms expects a url-encoded POST that includes the hidden "form-name" field
        send = fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
      } else if (endpoint && !isLocal) {
        // JSON endpoint (FormSubmit AJAX, Formspree, …). FormSubmit replies { success: "true" | "false", message }
        send = fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json().catch(function () { return {}; });
          })
          .then(function (res) {
            if (res && String(res.success) === 'false') throw new Error(res.message || 'Rejected');
          });
      } else {
        // local preview, or no delivery configured: nothing is sent
        send = new Promise(function (res) { setTimeout(res, 700); });
      }
      send.then(function () {
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }).catch(function (err) {
        var reason = err && err.message ? String(err.message) : '';
        if (window.console) console.warn('[contact form] not sent:', reason);
        status.textContent = /activat/i.test(reason)
          ? 'This form is waiting to be activated. The site owner has been sent an activation email — please try again shortly.'
          : 'Something went wrong sending your message' + (reason ? ' (' + reason + ')' : '') + '. Please try again, or email us directly.';
      }).then(function () {
        submitBtn.disabled = false;
        submitLabel.textContent = 'Send message';
      });
    });

    var again = document.getElementById('contactAgain');
    if (again) again.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('has-value', 'is-invalid'); });
      done.hidden = true;
      form.hidden = false;
      form.querySelector('input[name="name"]').focus();
    });
  }

  /* ---------- Section indicator (right rail) ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('#sectionNav a'));
  var navFill = document.getElementById('sectionFill');
  var navTargets = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function onScrollNav() {
    var probe = window.innerHeight * 0.45;
    var active = 0;
    navTargets.forEach(function (el, i) { if (el && el.offsetParent !== null && el.getBoundingClientRect().top <= probe) active = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (navFill) navFill.style.transform = 'scaleY(' + (max > 0 ? window.scrollY / max : 0) + ')';
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
})();
