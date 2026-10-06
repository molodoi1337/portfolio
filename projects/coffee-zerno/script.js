// Липкий хедер
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Бургер-меню
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const toggleNav = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
};
burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

// Появление при скролле
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 0.08}s`;
  io.observe(el);
});

// Табы меню
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.menu__panel');
tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
  tab.classList.add('is-active');
  tab.setAttribute('aria-selected', 'true');
  panels.forEach(p => {
    const active = p.dataset.panel === tab.dataset.tab;
    p.classList.toggle('is-active', active);
    p.hidden = !active;
  });
}));

// Слайдер отзывов
const track = document.querySelector('.slider__track');
const slides = track.children;
const dotsBox = document.querySelector('.slider__dots');
let current = 0;
let timer;
[...slides].forEach(() => dotsBox.appendChild(document.createElement('i')));
const goTo = (i) => {
  current = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  [...dotsBox.children].forEach((d, idx) => d.classList.toggle('is-active', idx === current));
};
const autoplay = () => { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 6000); };
document.querySelectorAll('.slider__btn').forEach(btn =>
  btn.addEventListener('click', () => { goTo(current + Number(btn.dataset.dir)); autoplay(); })
);
// свайп на мобильных
let startX = 0;
track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); autoplay(); }
});
goTo(0);
autoplay();

// Форма брони
const form = document.getElementById('bookingForm');
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const phoneInput = document.getElementById('phone');

const today = new Date();
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = iso(today);
dateInput.value = iso(today);

// слоты времени зависят от дня недели
const fillTimes = () => {
  const day = dateInput.value ? new Date(dateInput.value).getDay() : 1;
  const weekend = day === 0 || day === 6;
  const [from, to] = weekend ? [9, 22] : [8, 21];
  timeSelect.innerHTML = '<option value="">—</option>';
  for (let h = from; h <= to; h++) {
    ['00', '30'].forEach(m => timeSelect.add(new Option(`${h}:${m}`, `${h}:${m}`)));
  }
};
dateInput.addEventListener('change', fillTimes);
fillTimes();

// маска телефона
phoneInput.addEventListener('input', () => {
  let d = phoneInput.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = '+7';
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3) out += ')';
  if (p[1]) out += ` ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  phoneInput.value = out;
});

const setError = (input, msg) => {
  const field = input.closest('.field');
  field.classList.toggle('has-error', !!msg);
  field.querySelector('.error').textContent = msg || '';
  return !msg;
};

const validate = () => {
  const name = form.name.value.trim();
  const digits = phoneInput.value.replace(/\D/g, '');
  const ok = [
    setError(form.name, name.length < 2 ? 'Введите имя' : ''),
    setError(phoneInput, digits.length !== 11 ? 'Введите номер полностью' : ''),
    setError(dateInput, !dateInput.value || dateInput.value < dateInput.min ? 'Выберите дату' : ''),
    setError(timeSelect, !timeSelect.value ? 'Выберите время' : ''),
  ];
  return ok.every(Boolean);
};

form.querySelectorAll('input, select').forEach(el =>
  el.addEventListener('input', () => el.closest('.field').classList.contains('has-error') && validate())
);

const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const closeModal = () => { modal.hidden = true; };

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Отправляем…';
  // имитация отправки
  setTimeout(() => {
    const date = new Date(dateInput.value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    modalText.textContent = `${form.name.value.trim()}, ждём вас ${date} в ${timeSelect.value}. Гостей: ${form.guests.value}. Скоро перезвоним для подтверждения.`;
    modal.hidden = false;
    document.getElementById('modalClose').focus();
    form.reset();
    dateInput.value = iso(today);
    fillTimes();
    btn.disabled = false;
    btn.textContent = 'Забронировать';
  }, 900);
});

document.getElementById('modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); toggleNav(false); } });
