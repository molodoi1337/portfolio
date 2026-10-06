const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const eur = (n) => '€' + Math.round(n).toLocaleString('ru-RU');

// Переходы между страницами: шторка закрывается перед уходом
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a || reduced || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname === location.pathname || !url.pathname.endsWith('.html')) return;
  e.preventDefault();
  document.body.classList.add('is-leaving');
  setTimeout(() => { location.href = a.href; }, 550);
});
window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('is-leaving'); });

// Хедер: фон после скролла, прячется при прокрутке вниз
const header = $('#header');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 60);
  header.classList.toggle('is-hidden', y > 400 && y > lastY && !menu.classList.contains('is-open'));
  lastY = y;
};

// Полноэкранное меню
const burger = $('#burger');
const menu = $('#menu');
const toggleMenu = (open) => {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    header.classList.remove('is-hidden');
  } else {
    menu.classList.remove('is-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
  }
};
burger.addEventListener('click', () => toggleMenu(!menu.classList.contains('is-open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { toggleMenu(false); burger.focus(); } });

// Заголовки «по словам»
$$('.split').forEach(el => {
  const walk = (node) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.innerHTML = `<span>${part}</span>`;
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
  $$('.w > span', el).forEach((s, i) => { s.style.transitionDelay = `${0.6 + i * 0.07}s`; });
  setTimeout(() => el.classList.add('is-in'), 60);
});

// Появление при скролле
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
$$('.reveal, .reveal-img').forEach(el => io.observe(el));

// Параллакс
const parallax = $$('[data-parallax]');
const updateParallax = () => {
  if (reduced) return;
  const vh = window.innerHeight;
  parallax.forEach(img => {
    const box = img.parentElement.getBoundingClientRect();
    if (box.bottom < 0 || box.top > vh) return;
    const offset = (box.top + box.height / 2 - vh / 2) * -(+img.dataset.parallax);
    img.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); updateParallax(); ticking = false; });
}, { passive: true });
onScroll();
updateParallax();

// Слайд-шоу на главной
const slides = $$('.hero__slides img');
if (slides.length > 1 && !reduced) {
  let cur = 0;
  setInterval(() => {
    slides[cur].classList.remove('is-active');
    cur = (cur + 1) % slides.length;
    slides[cur].classList.add('is-active');
  }, 6500);
}

// Отзывы
const quotes = $('#quotes');
if (quotes) {
  const figs = $$('figure', quotes);
  const dots = $('.quotes__dots', quotes);
  let cur = 0;
  let timer;
  const show = (i) => {
    cur = i;
    figs.forEach((f, k) => f.classList.toggle('is-active', k === i));
    $$('button', dots).forEach((b, k) => b.setAttribute('aria-selected', k === i));
  };
  figs.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Отзыв ${i + 1}`);
    b.addEventListener('click', () => { show(i); clearInterval(timer); });
    dots.append(b);
  });
  show(0);
  if (!reduced) timer = setInterval(() => show((cur + 1) % figs.length), 7000);
}

// Фильтр галереи
const filters = $$('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
  $$('.masonry__item').forEach(item => {
    item.hidden = btn.dataset.filter !== 'all' && item.dataset.cat !== btn.dataset.filter;
  });
}));

// Лайтбокс
$$('[data-lightbox]').forEach(group => {
  group.addEventListener('click', (e) => {
    const item = e.target.closest('[data-full]');
    if (!item) return;
    const items = $$('[data-full]', group).filter(i => !i.hidden);
    let idx = items.indexOf(item);
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Просмотр фото');
    box.innerHTML = `<img alt=""><button class="lightbox__close" aria-label="Закрыть">✕</button>
      <button class="lightbox__prev" aria-label="Предыдущее фото">←</button><button class="lightbox__next" aria-label="Следующее фото">→</button>
      <span class="lightbox__count"></span>`;
    const img = $('img', box);
    const render = () => {
      img.src = items[idx].dataset.full;
      img.alt = $('img', items[idx]).alt;
      $('.lightbox__count', box).textContent = `${idx + 1} / ${items.length}`;
    };
    const go = (d) => { idx = (idx + d + items.length) % items.length; render(); };
    const close = () => {
      box.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      setTimeout(() => box.remove(), 500);
      item.focus();
    };
    const onKey = (ev) => {
      if (ev.key === 'Escape') close();
      if (ev.key === 'ArrowLeft') go(-1);
      if (ev.key === 'ArrowRight') go(1);
    };
    $('.lightbox__close', box).onclick = close;
    $('.lightbox__prev', box).onclick = () => go(-1);
    $('.lightbox__next', box).onclick = () => go(1);
    box.addEventListener('click', (ev) => { if (ev.target === box) close(); });
    document.addEventListener('keydown', onKey);
    if (items.length < 2) $$('.lightbox__prev, .lightbox__next', box).forEach(b => b.remove());
    render();
    document.body.append(box);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => box.classList.add('is-open'));
    $('.lightbox__close', box).focus();
  });
});

// Даты
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = new Date();
const linkDates = (inEl, outEl, params) => {
  inEl.min = iso(today);
  inEl.value = params.get('in') || iso(addDays(today, 14));
  const syncOut = () => {
    const minOut = iso(addDays(new Date(inEl.value || today), 1));
    outEl.min = minOut;
    if (!outEl.value || outEl.value < minOut) outEl.value = iso(addDays(new Date(inEl.value || today), 7));
  };
  outEl.value = params.get('out') || '';
  syncOut();
  inEl.addEventListener('change', syncOut);
};

const bar = $('#bookBar');
if (bar) linkDates(bar.in, bar.out, new URLSearchParams());

// Страница бронирования
const form = $('#bookingForm');
if (form) {
  const params = new URLSearchParams(location.search);
  linkDates(form.in, form.out, params);
  if (params.get('guests')) form.guests.value = params.get('guests');
  const roomParam = params.get('room');
  if (roomParam && form.querySelector(`[name="room"][value="${CSS.escape(roomParam)}"]`)) {
    form.querySelector(`[name="room"][value="${CSS.escape(roomParam)}"]`).checked = true;
  }

  const out = { room: $('#sumRoom'), dates: $('#sumDates'), nights: $('#sumNights'), stay: $('#sumStay'), extras: $('#sumExtras'), total: $('#sumTotal') };
  const dateFmt = (v) => new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  let summary = {};

  const update = () => {
    const guests = +form.guests.value;
    // номера, которые не вмещают выбранное число гостей, недоступны
    $$('[name="room"]', form).forEach(r => { r.disabled = +r.dataset.guests < guests; });
    let room = $('[name="room"]:checked', form);
    if (!room || room.disabled) {
      room = $$('[name="room"]', form).find(r => !r.disabled);
      room.checked = true;
    }
    const nights = Math.max(0, Math.round((new Date(form.out.value) - new Date(form.in.value)) / 864e5));
    const stay = nights * +room.dataset.price;
    let extras = 0;
    if (form.transfer.checked) extras += +form.transfer.value;
    if (form.dinner.checked) extras += +form.dinner.value * guests * nights;
    if (form.yacht.checked) extras += +form.yacht.value;

    out.room.textContent = room.dataset.name;
    out.dates.textContent = nights ? `${dateFmt(form.in.value)} — ${dateFmt(form.out.value)}` : '—';
    out.nights.textContent = nights || '—';
    out.stay.textContent = nights ? eur(stay) : '—';
    out.extras.textContent = extras ? eur(extras) : '—';
    out.total.textContent = nights ? eur(stay + extras) : '—';
    summary = { room: room.dataset.name, nights, total: stay + extras, dates: out.dates.textContent };
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  const setError = (input, msg) => {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    $('.error', field).textContent = msg || '';
    return !msg;
  };
  const validate = () => [
    setError(form.in, !form.in.value || form.in.value < form.in.min ? 'Выберите дату заезда' : ''),
    setError(form.out, !form.out.value || form.out.value <= form.in.value ? 'Выезд позже заезда' : ''),
    setError(form.name, form.name.value.trim().length < 2 ? 'Укажите имя' : ''),
    setError(form.email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()) ? 'Проверьте email' : ''),
    setError(form.phone, form.phone.value.replace(/\D/g, '').length < 10 ? 'Проверьте номер' : ''),
  ].every(Boolean);
  form.addEventListener('input', () => $('.has-error', form) && validate());

  const modal = $('#modal');
  const closeModal = () => { modal.hidden = true; document.body.style.overflow = ''; };
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      $('.has-error input, .has-error select', form)?.focus();
      return;
    }
    const btn = $('button[form="bookingForm"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    // имитация отправки
    setTimeout(() => {
      $('#modalText').textContent = `${form.name.value.trim()}, мы получили запрос на ${summary.room}, ${summary.dates} (${summary.nights} ноч.), итого ${eur(summary.total)}. Подтверждение придёт на ${form.email.value.trim()} в течение часа.`;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      $('#modalClose').focus();
      btn.disabled = false;
      btn.textContent = 'Отправить запрос';
    }, 1000);
  });
}
