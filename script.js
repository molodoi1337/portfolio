const projects = [
  {
    id: "torque",
    url: "https://frabjous-trifle-5e67a8.netlify.app/",
    newTab: true, // login cookies may be blocked inside an iframe
    title: "ТОРК — автосервис",
    kind: "Веб-приложение · сайт + CRM",
    text: "Сайт автосервиса с онлайн-записью на свободные слоты, статусом ремонта по ссылке, личным кабинетом и админкой: дашборд выручки, канбан заказов, расписание постов.",
    note: "Демо: на странице входа кнопка «Администратор» — вход в один клик",
    tags: ["Next.js", "База данных", "Авторизация", "Админка", "Telegram-уведомления"],
  },
  {
    id: 'senpai-parts',
    title: 'SENPAI.PARTS',
    kind: 'Интернет-магазин · 17 страниц',
    text: 'Магазин запчастей для японских авто в стиле glassmorphism × аниме: каталог, подбор по авто и VIN, корзина, гараж, избранное и оформление заказа.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Каталог', 'Корзина'],
  },
  {
    id: 'style-atlas',
    title: 'Атлас веб-стилей',
    kind: 'Коллекция · 32 мини-сайта',
    text: '32 стиля веб-дизайна — от ар-деко и баухауса до авроры, — каждый как отдельный мини-сайт на музыкальную тему.',
    tags: ['Дизайн', 'Анимации', 'Адаптив'],
  },
  {
    id: 'hotel-asteria',
    title: 'Asteria Bay',
    kind: 'Бутик-отель · 11 страниц',
    text: 'Многостраничный сайт отеля 5* в Бодруме: номера и виллы, ресторан, спа, галерея и форма бронирования.',
    tags: ['Многостраничный', 'Бронирование', 'Галерея', 'Адаптив'],
  },
  {
    id: 'remont-kvadrat',
    title: '«Квадрат»',
    kind: 'Ремонт квартир · 16 страниц',
    text: 'Сайт ремонтной компании: услуги, кейсы с фото объектов и калькулятор стоимости ремонта.',
    tags: ['Калькулятор', 'Кейсы', 'Услуги'],
  },
  {
    id: 'peretz',
    title: 'Бистро «Перец»',
    kind: 'Ресторан · 5 страниц',
    text: 'Яркий сайт бистро с меню, страницей о заведении и онлайн-бронью столика.',
    tags: ['Меню', 'Бронь столика', 'Анимации'],
  },
  {
    id: 'coffee-zerno',
    title: 'Кофейня «Зерно»',
    kind: 'Кофейня · лендинг',
    text: 'Тёплый одностраничник для кофейни: меню, атмосфера, выпечка и бронь столика.',
    tags: ['Лендинг', 'Меню', 'Форма'],
  },
  {
    id: 'slim-legkost',
    title: '«Лёгкость»',
    kind: 'Онлайн-школа · лендинг',
    text: 'Продающий лендинг онлайн-программы: квиз для подбора тарифа, программа, отзывы, цены.',
    tags: ['Лендинг', 'Квиз', 'Тарифы'],
  },
];

const grid = document.getElementById('grid');
grid.innerHTML = projects.map((p) => `
  <article class="card">
    <button class="shot" data-open="${p.id}" aria-label="Посмотреть сайт ${p.title}">
      <img src="shots/${p.id}.png" alt="Главная страница сайта ${p.title}" loading="lazy">
    </button>
    <div class="card-body">
      <div class="card-top"><h3>${p.title}</h3><span class="kind">${p.kind}</span></div>
      <p>${p.text}</p>${p.note ? `<p class="note">${p.note}</p>` : ""}
      <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <div class="card-actions">
        <button class="btn btn-primary" data-open="${p.id}">Посмотреть</button>
      </div>
    </div>
  </article>`).join('');

const viewer = document.getElementById('viewer');
const frame = document.getElementById('viewer-frame');
const deviceButtons = viewer.querySelectorAll('.devices button');

function setWidth(w) {
  frame.style.width = w;
  deviceButtons.forEach((b) => b.classList.toggle('active', b.dataset.w === w));
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (!btn) return;
  const p = projects.find((x) => x.id === btn.dataset.open);
  const url = `${p.url || `projects/${p.id}/`}`;
  // On phones the dialog is the phone itself — just go to the site
  if (p.newTab || window.innerWidth <= 600) { window.open(url, '_blank'); return; }
  document.getElementById('viewer-title').textContent = p.title;
  document.getElementById('viewer-open').href = url;
  frame.src = url;
  setWidth('100%');
  viewer.showModal();
  document.body.style.overflow = 'hidden';
});

deviceButtons.forEach((b) => b.addEventListener('click', () => setWidth(b.dataset.w)));
viewer.querySelector('.close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => { frame.src = 'about:blank'; document.body.style.overflow = ''; });
