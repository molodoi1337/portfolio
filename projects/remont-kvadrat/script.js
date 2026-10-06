const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Хедер и бургер
const header = $('#header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = $('#burger');
const nav = $('#nav');
const toggleNav = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
};
burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
$$('a', nav).forEach(a => a.addEventListener('click', () => toggleNav(false)));
document.addEventListener('keydown', e => e.key === 'Escape' && toggleNav(false));

// Появление при скролле + счётчики
const countUp = (el) => {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || '';
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min((t - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    $$('[data-count]', e.target).forEach(countUp);
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.07}s`;
  io.observe(el);
});

// Калькулятор
const calcForm = $('#calcForm');
let lastCalc = '';
if (calcForm) {
  const area = $('#area');
  const out = { area: $('#areaOut'), price: $('#price'), term: $('#term'), perM: $('#perM') };
  let shown = 0;

  const animatePrice = (to) => {
    const from = shown;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min((t - start) / 400, 1);
      shown = from + (to - from) * p;
      out.price.textContent = fmt(shown);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const calculate = () => {
    const m2 = +area.value;
    const rate = +calcForm.type.value;
    const k = +calcForm.house.value;
    const rooms = calcForm.rooms ? +calcForm.rooms.value : 0;
    // каждая комната — перегородки, двери, отдельная разводка света
    let total = m2 * rate * k + rooms * 15000;
    $$('[name="extra"]:checked', calcForm).forEach(c => {
      total += c.dataset.perM ? +c.value * m2 : +c.value;
    });
    const base = { 4500: 14, 9800: 35, 15500: 55 }[rate];
    const days = Math.round(base + m2 * (rate / 15500) * 0.4 + rooms * 2);

    out.area.textContent = m2;
    out.term.textContent = days < 45 ? `${days} дн.` : `${(days / 30).toFixed(1).replace('.', ',')} мес.`;
    out.perM.textContent = `${fmt(total / m2)} ₽`;
    area.style.background = `linear-gradient(90deg, var(--orange) ${(m2 - 20) / 1.8}%, var(--graphite-3) 0)`;
    animatePrice(total);

    const typeName = $('[name="type"]:checked + span', calcForm).textContent;
    lastCalc = `${typeName}, ${m2} м², ~${fmt(total)} ₽`;
    const hidden = $('#contact [name="calc"]');
    if (hidden) hidden.value = lastCalc;
  };
  calcForm.addEventListener('input', calculate);
  calculate();
}

// До / после
$$('.ba').forEach(ba => {
  const range = $('input', ba);
  range.addEventListener('input', () => ba.style.setProperty('--pos', range.value + '%'));
});

// Фильтр портфолио
const filters = $$('.filter');
filters.forEach(btn => btn.addEventListener('click', () => {
  filters.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
  const f = btn.dataset.filter;
  $$('#projects .project-card').forEach(card => {
    card.hidden = f !== 'all' && card.dataset.type !== f;
  });
}));

// Маска телефона
$$('input[type="tel"]').forEach(input => {
  input.addEventListener('input', () => {
    let d = input.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    let v = d ? '+7' : '';
    if (p[0]) v += ` (${p[0]}`;
    if (p[0].length === 3) v += ')';
    if (p[1]) v += ` ${p[1]}`;
    if (p[2]) v += `-${p[2]}`;
    if (p[3]) v += `-${p[3]}`;
    input.value = v;
  });
});

// Лид-формы
const toast = $('#toast');
let toastTimer;
const showToast = (text) => {
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5000);
};

const setError = (input, msg) => {
  const field = input.closest('.field');
  field.classList.toggle('has-error', !!msg);
  $('.error', field).textContent = msg || '';
  return !msg;
};

$$('.lead-form').forEach(form => {
  const validate = () => [
    setError(form.name, form.name.value.trim().length < 2 ? 'Введите имя' : ''),
    setError(form.phone, form.phone.value.replace(/\D/g, '').length !== 11 ? 'Введите номер полностью' : ''),
  ].every(Boolean);

  form.addEventListener('input', () => $('.has-error', form) && validate());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const btn = $('button', form);
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    // имитация отправки
    setTimeout(() => {
      const extra = form.calc && form.calc.value ? ` Ваш расчёт (${form.calc.value}) уже у него.` : '';
      showToast(`${form.name.value.trim()}, спасибо! Инженер перезвонит в течение 15 минут.${extra}`);
      form.reset();
      if (form.calc) form.calc.value = lastCalc;
      btn.disabled = false;
      btn.textContent = label;
    }, 900);
  });
});
