/* ЭФИР — интерфейс: прокрутка → сцена, курсор → камера, цвета, корзина, оформление. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const scene = window.EfirScene || null;
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватный режим */ } },
  };

  const TIERS = {
    lite: { name: 'ЭФИР Сфера Lite', price: 19990 },
    sfera: { name: 'ЭФИР Сфера', price: 34990 },
    pro: { name: 'ЭФИР Сфера Pro', price: 49990 },
  };
  const COLORS = {
    nebula: {
      name: 'Туманность', pal: ['#8A7CFF', '#FF7AD9', '#5CE1E6'],
      hp: { main: '#7d6ef2', light: '#c9c1ff', dark: '#2e2470', metal: '#dcd8f5', pad: '#231d45', accent: '#FF7AD9' },
      desc: 'Фиолетовый алюминий, светлая сталь и розовый индикатор.',
    },
    quasar: {
      name: 'Квазар', pal: ['#FF7AD9', '#FFB36B', '#8A7CFF'],
      hp: { main: '#e48ab8', light: '#ffd9ea', dark: '#6e2b4f', metal: '#f3d2b8', pad: '#3a1f2e', accent: '#FFB36B' },
      desc: 'Пудрово-розовый корпус и рама цвета розового золота.',
    },
    aurora: {
      name: 'Аврора', pal: ['#5CE1E6', '#7CF2B0', '#8A7CFF'],
      hp: { main: '#4fbfc4', light: '#c4f7f3', dark: '#14545b', metal: '#e2f5f2', pad: '#132e33', accent: '#7CF2B0' },
      desc: 'Ледяной циан с зелёным отливом — как полярное сияние над Мурманском.',
    },
    eclipse: {
      name: 'Затмение', pal: ['#F5F3FF', '#8A7CFF', '#5A5470'],
      hp: { main: '#3b3848', light: '#7a7590', dark: '#121118', metal: '#b9b6c6', pad: '#19181f', accent: '#F5F3FF' },
      desc: 'Графит и тёмная сталь — для тех, кто не любит лишнего внимания.',
    },
  };

  /* ---------- старт ---------- */

  let started = false;
  function start() {
    if (started) return;
    started = true;
    root.classList.add('loaded');
    if (scene) scene.start();
  }
  addEventListener('load', () => setTimeout(start, 300));
  setTimeout(start, 3500);

  /* ---------- появление блоков ---------- */

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- прокрутка → номер сцены ----------
     у каждой секции есть «плато», где форма держится, и переходы на стыках */

  const marks = $$('[data-scene]');
  let keypoints = [];
  function measure() {
    const vh = innerHeight;
    keypoints = [];
    marks.forEach((el) => {
      const top = el.offsetTop, hgt = el.offsetHeight, s = +el.dataset.scene;
      const pad = Math.min(hgt * 0.3, vh * 0.35);
      keypoints.push([top + pad, s], [top + hgt - pad, s]);
    });
  }
  function sceneAt(y) {
    if (y <= keypoints[0][0]) return keypoints[0][1];
    for (let i = 1; i < keypoints.length; i++) {
      const [y1, s1] = keypoints[i];
      if (y <= y1) {
        const [y0, s0] = keypoints[i - 1];
        return y1 === y0 ? s1 : s0 + (s1 - s0) * (y - y0) / (y1 - y0);
      }
    }
    return keypoints[keypoints.length - 1][1];
  }

  const nav = $('#nav');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY;
      if (scene) { scene.setTarget(sceneAt(y + innerHeight / 2)); scene.setScroll(y); }
      root.style.setProperty('--hero-p', Math.min(1, y / innerHeight).toFixed(3));
      nav.classList.toggle('scrolled', y > 20);
    });
  }
  measure();
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);

  // подсветка пункта меню
  const links = $$('.nav-links a');
  const sectionIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  marks.forEach((s) => sectionIo.observe(s));

  /* ---------- курсор: камера, параллакс, свет ---------- */

  const light = $('#cursorLight');
  let px = 0, py = 0, pending = false;
  addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    const nx = px / innerWidth * 2 - 1, ny = -(py / innerHeight * 2 - 1);
    if (scene && e.pointerType === 'mouse') scene.setMouse(nx, ny);
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      root.style.setProperty('--mx', nx.toFixed(3));
      root.style.setProperty('--my', ny.toFixed(3));
      light.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      light.classList.add('on');
    });
  }, { passive: true });
  document.addEventListener('pointerleave', () => { light.classList.remove('on'); if (scene) scene.releaseMouse(); });

  /* ---------- меню на мобильных ---------- */

  const burger = $('#burger'), navLinks = $('#navLinks');
  function closeMenu() { navLinks.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', () => {
    const open = !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  links.forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------- звук ---------- */

  const soundBtns = $$('[data-sound]');
  function syncSound(on) {
    root.classList.toggle('sound-on', on);
    soundBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      if (b.hasAttribute('aria-label')) b.setAttribute('aria-label', on ? 'Выключить звуковую сцену' : 'Включить звуковую сцену');
      const label = $('[data-sound-label]', b);
      if (label) label.textContent = on ? 'Выключить сцену' : 'Включить сцену';
    });
  }
  soundBtns.forEach((b) => b.addEventListener('click', async () => {
    if (!window.EfirAudio) return;
    const on = await window.EfirAudio.toggle();
    if (on) toast('Звук пошёл: мелодия кружит вокруг головы — лучше в наушниках');
  }));
  document.addEventListener('efir-audio', (e) => {
    syncSound(e.detail.on);
    if (e.detail.blocked) toast('Браузер не дал включить звук — нажмите кнопку ещё раз');
  });

  /* ---------- цвета ---------- */

  let color = store.get('efir-color', 'nebula');
  if (!COLORS[color]) color = 'nebula';
  const swatches = $('#swatches'), stage = $('#productStage');
  const hp = window.EfirProduct ? window.EfirProduct.headphones : () => '';
  $('#product').innerHTML = hp();
  $$('[data-hp]').forEach((el) => { el.innerHTML = hp(); });
  swatches.innerHTML = Object.entries(COLORS).map(([id, c]) => `
    <button type="button" class="swatch" role="radio" data-color="${id}" aria-label="${c.name}"
      style="--s-main:${c.hp.main};--s-light:${c.hp.light};--s-dark:${c.hp.dark}">
      <span class="swatch-ball"></span><span class="swatch-name">${c.name}</span>
    </button>`).join('');

  function setColor(id, save) {
    color = id;
    const c = COLORS[id];
    $$('.swatch').forEach((b) => {
      const on = b.dataset.color === id;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    $('#colorName').textContent = c.name;
    $('#colorDesc').textContent = c.desc;
    $$('[data-color-name]').forEach((el) => { el.textContent = c.name; });
    root.style.setProperty('--c1', c.pal[0]);
    root.style.setProperty('--c2', c.pal[1]);
    root.style.setProperty('--c3', c.pal[2]);
    for (const k in c.hp) root.style.setProperty('--hp-' + k, c.hp[k]);
    stage.setAttribute('aria-label', `ЭФИР Сфера в цвете «${c.name}»`);
    if (save) { stage.classList.remove('shine'); void stage.offsetWidth; stage.classList.add('shine'); }
    if (scene) scene.setPalette(c.pal);
    if (save) store.set('efir-color', id);
  }
  swatches.addEventListener('click', (e) => {
    const b = e.target.closest('.swatch');
    if (b) setColor(b.dataset.color, true);
  });
  swatches.addEventListener('keydown', (e) => {
    const ids = Object.keys(COLORS);
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const next = ids[(ids.indexOf(color) + d + ids.length) % ids.length];
    setColor(next, true);
    $(`.swatch[data-color="${next}"]`).focus();
  });
  setColor(color, false);

  /* ---------- корзина ---------- */

  let cart = store.get('efir-cart', []);
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter((i) => i && TIERS[i.tier] && COLORS[i.color] && i.qty > 0);

  const total = () => cart.reduce((s, i) => s + TIERS[i.tier].price * i.qty, 0);
  const count = () => cart.reduce((s, i) => s + i.qty, 0);

  function renderCart() {
    store.set('efir-cart', cart);
    const n = count();
    $('#cartCount').textContent = n;
    $('#cartCount').classList.toggle('has', n > 0);
    $('#cartList').innerHTML = cart.map((i, idx) => {
      const t = TIERS[i.tier], c = COLORS[i.color];
      return `<li class="cart-item">
        <span class="cart-thumb" aria-hidden="true">${hp(c.hp)}</span>
        <div class="cart-info">
          <b>${t.name}</b>
          <span>${c.name}</span>
          <div class="qty" aria-label="Количество">
            <button type="button" data-qty="${idx}" data-d="-1" aria-label="Меньше">−</button>
            <output>${i.qty}</output>
            <button type="button" data-qty="${idx}" data-d="1" aria-label="Больше">+</button>
          </div>
        </div>
        <div class="cart-right">
          <b>${rub(t.price * i.qty)}</b>
          <button type="button" class="remove" data-remove="${idx}">Удалить</button>
        </div>
      </li>`;
    }).join('');
    $('#cartEmpty').hidden = n > 0;
    $('#cartSum').hidden = n === 0;
    $('#sumItems').textContent = rub(total());
    $('#sumTotal').textContent = rub(total());
    $('#formTotal').textContent = rub(total());
  }

  function add(tier) {
    const item = cart.find((i) => i.tier === tier && i.color === color);
    if (item) item.qty = Math.min(9, item.qty + 1);
    else cart.push({ tier, color, qty: 1 });
    renderCart();
    const btn = $('#cartOpen');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    toast(`${TIERS[tier].name} · ${COLORS[color].name} — в корзине`, true);
  }
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => add(b.dataset.add)));

  $('#cartList').addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]'), r = e.target.closest('[data-remove]');
    if (q) {
      const item = cart[+q.dataset.qty];
      item.qty = Math.max(0, Math.min(9, item.qty + +q.dataset.d));
      if (!item.qty) cart.splice(+q.dataset.qty, 1);
    } else if (r) {
      cart.splice(+r.dataset.remove, 1);
    } else return;
    renderCart();
  });

  /* ---------- шторка ---------- */

  const drawer = $('#drawer'), scrim = $('#scrim'), toastEl = $('#toast');
  let lastFocus = null;
  function view(name) {
    $$('.drawer-view', drawer).forEach((v) => { v.hidden = v.dataset.view !== name; });
    $('#drawerTitle').textContent = { cart: 'Корзина', form: 'Оформление', done: 'Готово' }[name];
  }
  function openDrawer(v = 'cart') {
    lastFocus = document.activeElement;
    toastEl.classList.remove('show');
    view(v);
    scrim.hidden = false;
    drawer.inert = false;
    requestAnimationFrame(() => { root.classList.add('drawer-open'); });
    setTimeout(() => $('#cartClose').focus(), 50);
  }
  function closeDrawer() {
    root.classList.remove('drawer-open');
    drawer.inert = true;
    setTimeout(() => { scrim.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  $('#cartOpen').addEventListener('click', () => openDrawer('cart'));
  $('#cartClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('drawer-open')) closeDrawer();
    if (e.key === 'Escape') closeMenu();
  });
  $('#toCheckout').addEventListener('click', () => { view('form'); $('#orderForm [name=name]').focus(); });
  $('#backToCart').addEventListener('click', () => view('cart'));

  /* ---------- оформление ---------- */

  const form = $('#orderForm');
  const phone = form.elements.phone;
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    phone.value = !d ? '' : '+7' + (p[0] ? ` (${p[0]}` : '') + (p[1] ? `) ${p[1]}` : '') + (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
  });

  const addressField = $('#addressField');
  function syncDelivery() {
    const courier = form.elements.delivery.value === 'courier';
    addressField.hidden = !courier;
    form.elements.address.required = courier;
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'delivery') syncDelivery(); });
  syncDelivery();

  function check(input) {
    const v = input.value.trim();
    let msg = '';
    if (input.required && !v) msg = 'Заполните это поле';
    else if (input.name === 'phone' && v.replace(/\D/g, '').length !== 11) msg = 'Нужно 11 цифр';
    else if (input.name === 'name' && v.length < 2) msg = 'Слишком коротко';
    const field = input.closest('.field');
    field.classList.toggle('invalid', !!msg);
    $('.err', field).textContent = msg;
    input.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  }
  $$('input:not([type=radio])', form).forEach((i) => {
    i.addEventListener('blur', () => { if (i.value) check(i); });
    i.addEventListener('input', () => { if (i.closest('.field').classList.contains('invalid')) check(i); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = $$('input:not([type=radio])', form).filter((i) => !i.closest('[hidden]'));
    const bad = inputs.filter((i) => !check(i));
    if (bad.length) { bad[0].focus(); return; }
    const no = 'ЭФ-' + String(Math.floor(100000 + Math.random() * 900000));
    const f = form.elements;
    const where = f.delivery.value === 'courier' ? `курьер привезёт по адресу: ${f.city.value.trim()}, ${f.address.value.trim()}` : `заберите в пункте выдачи, г. ${f.city.value.trim()}`;
    $('#orderNo').textContent = no;
    $('#orderText').textContent = `${f.name.value.trim()}, спасибо! ${count()} шт. на ${rub(total())} — ${where}. Позвоним на ${f.phone.value}, чтобы согласовать время.`;
    cart = [];
    renderCart();
    form.reset();
    syncDelivery();
    view('done');
  });

  /* ---------- тост ---------- */

  let toastTimer;
  function toast(text, withCart) {
    toastEl.innerHTML = '';
    toastEl.append(text);
    if (withCart) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Открыть';
      b.addEventListener('click', () => { toastEl.classList.remove('show'); openDrawer('cart'); });
      toastEl.append(b);
    }
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
  }

  renderCart();
})();
