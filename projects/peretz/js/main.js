/* ===== Общие компоненты: шапка и подвал ===== */
const NAV = [
  ["index.html", "Главная"],
  ["menu.html", "Меню"],
  ["about.html", "О нас"],
  ["contacts.html", "Контакты"],
];

const IMG = (name) => `img/${name}.jpg`;

function renderHeader() {
  const current = location.pathname.split("/").pop() || "index.html";
  const links = NAV.map(([href, label]) =>
    `<a href="${href}" class="${href === current ? "active" : ""}">${label}</a>`).join("");
  document.body.insertAdjacentHTML("afterbegin", `
    <header class="header">
      <div class="container header__inner">
        <a href="index.html" class="logo"><span class="logo__dot"></span>Перец</a>
        <nav class="nav" id="nav">${links}<a href="booking.html" class="btn btn--red">Забронировать</a></nav>
        <button class="burger" id="burger" aria-label="Меню"><span></span></button>
      </div>
    </header>`);

  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    nav.classList.toggle("open");
    document.body.style.overflow = nav.classList.contains("open") ? "hidden" : "";
  });
}

function renderFooter() {
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="footer">
      <div class="container">
        <div class="footer__big">Перец.</div>
        <div class="footer__grid">
          <div><h4>Адрес</h4><p>ул. Пряная, 12<br>Москва</p></div>
          <div><h4>Часы</h4><p>Пн–Чт 12:00–23:00<br>Пт–Вс 12:00–01:00</p></div>
          <div><h4>Связь</h4><ul><li><a href="tel:+74950000000">+7 495 000-00-00</a></li><li><a href="mailto:hello@peretz.bistro">hello@peretz.bistro</a></li></ul></div>
          <div><h4>Соцсети</h4><ul><li><a href="#">Telegram</a></li><li><a href="#">VK</a></li><li><a href="#">Instagram*</a></li></ul></div>
        </div>
        <div class="footer__bottom"><span>© ${new Date().getFullYear()} Бистро «Перец»</span><span>Концепт-проект для портфолио</span></div>
      </div>
    </footer>`);
}

/* ===== Анимация появления при скролле ===== */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

/* ===== Данные меню ===== */
const MENU = [
  { name: "Свиные рёбра BBQ", desc: "Копчёные 6 часов, печёные томаты, соус барбекю", price: 890, cat: "mains", tags: ["hit"], img: "ribs" },
  { name: "Боул «Сад»", desc: "Нут, авокадо, печёный батат, хумус", price: 590, cat: "starters", tags: ["veg"], img: "garden-bowl" },
  { name: "Тёплый салат с киноа", desc: "Красный лук, оливки, перечная заправка", price: 520, cat: "starters", tags: ["veg", "hot"], img: "quinoa-salad" },
  { name: "Боул с лососем", desc: "Рис, авокадо, эдамаме, соус понзу", price: 720, cat: "mains", tags: ["new"], img: "salmon-bowl" },
  { name: "Стейк мачете", desc: "Соус чимичурри, картофель фри с розмарином", price: 1490, cat: "mains", tags: ["hit"], img: "steak" },
  { name: "Фарфалле с песто", desc: "Песто из базилика, черри, пармезан", price: 620, cat: "mains", tags: ["veg"], img: "pasta" },
  { name: "Куриные шашлычки", desc: "Маринад харисса, йогуртовый соус", price: 650, cat: "mains", tags: ["hot"], img: "skewers" },
  { name: "Пицца «Перец»", desc: "Пепперони, халапеньо, мёд с чили", price: 790, cat: "mains", tags: ["hot", "hit"], img: "pizza" },
  { name: "Пломбир с карамелью", desc: "Солёная карамель с чили, вафельная трубочка", price: 390, cat: "desserts", tags: ["new"], img: "caramel-sundae" },
  { name: "Шоколадный парфе", desc: "Печенье, взбитые сливки, тёмный шоколад", price: 450, cat: "desserts", tags: ["veg"], img: "parfait" },
  { name: "Перечный смэш", desc: "Бурбон, розмарин, сироп из розового перца", price: 650, cat: "drinks", tags: ["hot", "hit"], img: "pepper-smash" },
  { name: "Домашний лимонад", desc: "Маракуйя, мята, содовая", price: 350, cat: "drinks", tags: ["veg"], img: "lemonade" },
];

const TAG_LABEL = { veg: ["Вег", "tag--veg"], hot: ["Остро 🌶", "tag--hot"], new: ["Новинка", "tag--new"], hit: ["Хит", ""] };

function dishCard(d) {
  const tags = d.tags.map((t) => `<span class="tag ${TAG_LABEL[t][1]}">${TAG_LABEL[t][0]}</span>`).join("");
  return `
    <article class="dish fade-in">
      <img class="dish__img" src="${IMG(d.img)}" alt="${d.name}" loading="lazy">
      <div class="dish__body">
        <div class="dish__top"><h3>${d.name}</h3><span class="dish__price">${d.price} ₽</span></div>
        <p>${d.desc}</p>
        <div class="tags">${tags}</div>
      </div>
    </article>`;
}

/* ===== Главная: популярные блюда ===== */
function initHits() {
  const box = document.getElementById("hits");
  if (!box) return;
  box.innerHTML = MENU.filter((d) => d.tags.includes("hit")).slice(0, 3).map(dishCard).join("");
}

/* ===== Страница меню: фильтры и поиск ===== */
function initMenu() {
  const grid = document.getElementById("menu-grid");
  if (!grid) return;
  const state = { cat: "all", veg: false, hot: false, q: "" };
  const empty = document.getElementById("empty");

  function render() {
    const list = MENU.filter((d) =>
      (state.cat === "all" || d.cat === state.cat) &&
      (!state.veg || d.tags.includes("veg")) &&
      (!state.hot || d.tags.includes("hot")) &&
      d.name.toLowerCase().includes(state.q));
    grid.innerHTML = list.map(dishCard).join("");
    empty.style.display = list.length ? "none" : "block";
  }

  document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    state.cat = chip.dataset.cat;
    render();
  }));
  document.getElementById("f-veg").addEventListener("change", (e) => { state.veg = e.target.checked; render(); });
  document.getElementById("f-hot").addEventListener("change", (e) => { state.hot = e.target.checked; render(); });
  document.getElementById("search").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
  render();
}

/* ===== Бронирование ===== */
function initBooking() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const dateInput = form.date;
  const slotsBox = document.getElementById("slots");
  const guestsOut = document.getElementById("guests");
  let guests = 2;
  let time = null;

  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  const max = new Date(); max.setDate(today.getDate() + 30);
  dateInput.min = toISO(today);
  dateInput.max = toISO(max);
  dateInput.value = toISO(today);

  // Псевдослучайная «занятость» слотов, стабильная для каждой даты
  function busy(dateStr, slot) {
    let h = 0;
    for (const ch of dateStr + slot) h = (h * 31 + ch.charCodeAt(0)) % 997;
    return h % 4 === 0;
  }

  function renderSlots() {
    const d = new Date(dateInput.value);
    const weekend = d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0;
    const lastHour = weekend ? 23 : 21;
    const isToday = dateInput.value === toISO(new Date());
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    let html = "";
    for (let h = 12; h <= lastHour; h++) {
      for (const m of [0, 30]) {
        const label = `${pad(h)}:${pad(m)}`;
        const past = isToday && h + m / 60 <= nowH + 0.5;
        const disabled = past || busy(dateInput.value, label);
        html += `<button type="button" class="slot ${label === time ? "active" : ""}" data-time="${label}" ${disabled ? "disabled" : ""}>${label}</button>`;
      }
    }
    slotsBox.innerHTML = html;
    updateSummary();
  }

  slotsBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".slot");
    if (!btn || btn.disabled) return;
    time = btn.dataset.time;
    slotsBox.querySelectorAll(".slot").forEach((s) => s.classList.toggle("active", s === btn));
    setError("time", "");
    updateSummary();
  });

  dateInput.addEventListener("change", () => { time = null; renderSlots(); });

  document.getElementById("minus").addEventListener("click", () => { guests = Math.max(1, guests - 1); guestsOut.value = guests; updateSummary(); });
  document.getElementById("plus").addEventListener("click", () => { guests = Math.min(12, guests + 1); guestsOut.value = guests; updateSummary(); });

  // Маска телефона
  form.phone.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.startsWith("8")) v = "7" + v.slice(1);
    if (!v.startsWith("7")) v = "7" + v;
    v = v.slice(0, 11);
    const p = [v.slice(1, 4), v.slice(4, 7), v.slice(7, 9), v.slice(9, 11)];
    e.target.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") +
      (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
  });

  function updateSummary() {
    const d = new Date(dateInput.value);
    document.getElementById("s-date").textContent = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
    document.getElementById("s-time").textContent = time || "—";
    document.getElementById("s-guests").textContent = guests;
    document.getElementById("s-zone").textContent = form.zone.options[form.zone.selectedIndex].text;
  }
  form.zone.addEventListener("change", updateSummary);

  function setError(name, msg) {
    const field = form.querySelector(`[data-field="${name}"]`);
    field.classList.toggle("error", !!msg);
    field.querySelector(".field__err").textContent = msg;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.name.value.trim();
    const phoneDigits = form.phone.value.replace(/\D/g, "");
    if (name.length < 2) { setError("name", "Введите имя"); ok = false; } else setError("name", "");
    if (phoneDigits.length !== 11) { setError("phone", "Введите телефон полностью"); ok = false; } else setError("phone", "");
    if (!time) { setError("time", "Выберите время"); ok = false; }
    if (!ok) return;

    document.getElementById("m-text").textContent =
      `${name}, ждём вас ${document.getElementById("s-date").textContent} в ${time}. Гостей: ${guests}. Мы перезвоним для подтверждения.`;
    document.getElementById("modal").classList.add("open");
    form.reset();
    dateInput.value = toISO(new Date());
    guests = 2; guestsOut.value = 2; time = null;
    renderSlots();
  });

  document.querySelectorAll("[data-close]").forEach((el) =>
    el.addEventListener("click", (e) => { if (e.target === el) document.getElementById("modal").classList.remove("open"); }));

  renderSlots();
}

/* ===== Контакты: открыто ли сейчас ===== */
function initStatus() {
  const el = document.getElementById("status");
  if (!el) return;
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const weekend = day === 5 || day === 6 || day === 0;
  // Пт–Вс до 01:00 следующего дня
  const lateNight = h < 1 && (day === 6 || day === 0 || day === 1);
  const open = (h >= 12 && h < (weekend ? 24 : 23)) || lateNight;
  el.textContent = open ? "Сейчас открыто" : "Сейчас закрыто";
  el.className = "status " + (open ? "status--open" : "status--closed");
}

renderHeader();
renderFooter();
initHits();
initMenu();
initBooking();
initStatus();
initReveal();
