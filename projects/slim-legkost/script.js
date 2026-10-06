const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const num = (n) => Math.round(n).toLocaleString('ru-RU');
const dec = (n) => n.toFixed(1).replace('.', ',');
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };

// Хедер и мобильное меню
const header = $('#header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = $('#burger');
const nav = $('#nav');
const toggleNav = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.style.overflow = open ? 'hidden' : '';
};
burger.addEventListener('click', () => toggleNav(!nav.classList.contains('is-open')));
$$('a', nav).forEach(a => a.addEventListener('click', () => toggleNav(false)));
document.addEventListener('keydown', e => e.key === 'Escape' && toggleNav(false));

// Появление при скролле
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-visible');
    io.unobserve(e.target);
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  io.observe(el);
});

// Калькулятор калорий (формула Миффлина — Сан Жеора)
const calc = $('#calcForm');
const out = {
  target: $('#target'), tdee: $('#tdee'), bmi: $('#bmi'), protein: $('#protein'),
  pace: $('#pace'), note: $('#calcNote'), marker: $('#bmiMarker'), error: $('#calcError'),
};
const limits = { age: [16, 90], height: [130, 220], weight: [35, 250] };

const calculate = () => {
  let ok = true;
  const v = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    const input = calc[key];
    v[key] = parseFloat(String(input.value).replace(',', '.'));
    const bad = !(v[key] >= min && v[key] <= max);
    input.classList.toggle('is-invalid', bad);
    if (bad) ok = false;
  }
  out.error.textContent = ok ? '' : 'Проверьте значения: возраст 16–90, рост 130–220 см, вес 35–250 кг';
  if (!ok) return;

  const female = calc.sex.value === 'f';
  const bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (female ? -161 : 5);
  const tdee = bmr * +calc.activity.value;
  const bmi = v.weight / (v.height / 100) ** 2;
  const floor = female ? 1200 : 1500;

  // дефицит 20%, при нормальном весе — 10%, при недостатке — без дефицита;
  // и никогда не ниже основного обмена и безопасного минимума
  let deficit = bmi < 18.5 ? 0 : bmi < 25 ? 0.1 : 0.2;
  let target = Math.max(tdee * (1 - deficit), bmr, floor);
  if (bmi < 18.5) target = tdee;
  target = Math.round(target / 10) * 10;
  const weekly = Math.max(0, (tdee - target) * 7 / 7700);
  // белок считаем от веса, соответствующего ИМТ 25, если текущий выше
  const refWeight = Math.min(v.weight, 25 * (v.height / 100) ** 2);

  out.target.textContent = num(target);
  out.tdee.textContent = `${num(Math.round(tdee / 10) * 10)} ккал`;
  out.bmi.textContent = dec(bmi);
  out.protein.textContent = `${Math.round(refWeight * 1.4)} г`;
  out.pace.textContent = weekly > 0.05 ? `≈${dec(weekly)} кг/нед` : '—';
  // шкала ИМТ от 15 до 40
  out.marker.style.left = `${Math.min(Math.max((bmi - 15) / 25, 0), 1) * 100}%`;

  out.note.textContent =
    bmi < 18.5 ? 'Индекс массы тела ниже нормы. Снижать вес не рекомендуем — обратитесь к врачу.' :
    bmi < 25 ? 'Вес в пределах нормы. Если хотите изменить фигуру, сделаем упор на тренировки и мягкий дефицит.' :
    bmi < 30 ? 'Небольшой избыточный вес. Умеренный дефицит и 3 тренировки в неделю дадут стабильный результат.' :
    'Перед стартом рекомендуем показаться врачу и выбрать тариф с нутрициологом.';
};
calc.addEventListener('input', calculate);
calc.addEventListener('change', calculate);
calculate();

// Тест
const quizForm = $('#quizForm');
const steps = $$('.quiz__q', quizForm);
const bar = $('#quizBar');
const stepLabel = $('#quizStep');
const result = $('#quizResult');
let step = 0;

const plans = { self: 'Сама', curator: 'С куратором', personal: 'Персонально' };
const focus = {
  sweet: 'десерты в плане, а не под запретом',
  evening: 'режим питания и сытный обед',
  time: 'меню из 5 продуктов и заготовки на 3 дня',
  motivation: 'маленькие шаги и поддержка куратора',
};

const render = () => {
  steps.forEach((s, i) => s.classList.toggle('is-active', i === step));
  const done = step >= steps.length;
  result.hidden = !done;
  bar.style.width = `${done ? 100 : ((step + 1) / steps.length) * 100}%`;
  stepLabel.textContent = done ? 'Готово!' : `Вопрос ${step + 1} из ${steps.length}`;
};

const showResult = () => {
  const d = Object.fromEntries(new FormData(quizForm));
  const kg = +d.goal;
  // безопасный темп ~0,7 кг в неделю
  const weeks = Math.ceil(kg / 0.7);
  let plan = d.support;
  if (kg >= 15 && plan === 'self') plan = 'curator';
  if (kg >= 25) plan = 'personal';

  $('#resTitle').textContent = kg >= 15 ? 'Большая цель — разобьём её на этапы' : 'Ваша цель достижима за один поток';
  $('#resText').textContent = kg >= 25
    ? 'При большом снижении веса важно наблюдение специалиста, поэтому рекомендуем персональный формат с нутрициологом.'
    : `Без жёстких ограничений вы сможете сбросить около ${kg} кг. ${d.sport === '0' ? 'Начнём с прогулок и коротких тренировок по 10 минут.' : 'Добавим силовые тренировки, чтобы сохранить мышцы.'}`;
  const w = `${weeks} ${plural(weeks, 'неделя', 'недели', 'недель')}`;
  const flows = Math.ceil(weeks / 12);
  $('#resTerm').textContent = weeks <= 12 ? w : `${w} (${flows} ${plural(flows, 'поток', 'потока', 'потоков')})`;
  $('#resPlan').textContent = plans[plan];
  $('#resFocus').textContent = focus[d.trouble];
  $('#resCta').dataset.plan = plans[plan];
};

// после выбора ответа сразу переходим к следующему вопросу, после последнего — к результату
let advancing = false;
quizForm.addEventListener('change', (e) => {
  if (e.target.type !== 'radio' || advancing) return;
  advancing = true;
  setTimeout(() => {
    step++;
    if (step === steps.length) showResult();
    render();
    advancing = false;
  }, 280);
});
$('#quizRestart').addEventListener('click', () => {
  quizForm.reset();
  step = 0;
  render();
  $('input', steps[0]).focus();
});
render();

// Тарифы: 12 / 24 недели
const fmtPrice = (n) => num(Math.round(n / 100) * 100);
$$('[name="period"]').forEach(r => r.addEventListener('change', () => {
  const months = +$('[name="period"]:checked').value;
  $$('.plan').forEach(plan => {
    const base = +plan.dataset.base;
    const sum = $('.plan__sum', plan);
    sum.textContent = fmtPrice(months === 2 ? base * 2 * 0.8 : base);
  });
}));

// Выбор тарифа подставляется в форму
const planSelect = $('#sPlan');
let quizDone = false;
$$('[data-plan]').forEach(btn => btn.addEventListener('click', () => { planSelect.value = btn.dataset.plan; }));
$('#resCta').addEventListener('click', (e) => {
  planSelect.value = e.currentTarget.dataset.plan;
  quizDone = true;
});

// Заявка
const form = $('#signupForm');
const toast = $('#toast');
const setError = (input, msg) => {
  const field = input.closest('.field');
  field.classList.toggle('has-error', !!msg);
  $('.error', field).textContent = msg || '';
  return !msg;
};
const validate = () => {
  const contact = form.contact.value.trim();
  const isPhone = contact.replace(/\D/g, '').length >= 10;
  const isTg = /^@?[a-zA-Z0-9_]{5,32}$/.test(contact);
  const consentOk = form.consent.checked;
  $('#consentError').textContent = consentOk ? '' : 'Нужно согласие на обработку данных';
  return [
    setError(form.name, form.name.value.trim().length < 2 ? 'Укажите имя' : ''),
    setError(form.contact, !isPhone && !isTg ? 'Укажите телефон или ник в Telegram' : ''),
    consentOk,
  ].every(Boolean);
};
form.addEventListener('input', () => ($('.has-error', form) || $('#consentError').textContent) && validate());
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;
  const btn = $('button', form);
  btn.disabled = true;
  btn.textContent = 'Отправляем…';
  // имитация отправки
  setTimeout(() => {
    toast.textContent = `${form.name.value.trim()}, заявка принята! Куратор напишет вам сегодня${quizDone ? ' — скидка 15% за тест закреплена' : ''}.`;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 6000);
    form.reset();
    btn.disabled = false;
    btn.textContent = 'Записаться на поток';
  }, 900);
});
