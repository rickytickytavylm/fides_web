const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 32);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

const searchOverlay = document.querySelector(".search-overlay");
if (searchOverlay) {
  const searchInput = searchOverlay.querySelector("input");
  const setSearch = (open) => {
    searchOverlay.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) searchInput.focus();
  };

  document.querySelector(".search-button")?.addEventListener("click", () => setSearch(true));
  searchOverlay.querySelector(".search-close").addEventListener("click", () => setSearch(false));
  searchOverlay.addEventListener("click", (event) => { if (event.target === searchOverlay) setSearch(false); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !searchOverlay.hidden) setSearch(false); });
  searchOverlay.querySelector(".search-form").addEventListener("submit", (event) => event.preventDefault());
}

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

const observe = (element) => observer.observe(element);
document.querySelectorAll(".reveal").forEach(observe);

const news = {
  russia: [
    ["img-report-2", "КЦ в России", "Сегодня", "В Москве прошла конференция по катехизации взрослых"],
    ["img-people-3", "Новости", "Вчера", "Новый приход зарегистрирован на Дальнем Востоке"],
    ["img-arch-1", "КЦ в России", "25 июля", "Служба десятилетия общины вернулась в родные стены"],
  ],
  vatican: [
    ["img-people-1", "Святой Престол", "Сегодня", "Папа Римский обратился к участникам Всемирного дня молодёжи"],
    ["img-art-1", "Ватикан", "Вчера", "В Ватикане представили тему Всемирного дня мира"],
    ["img-art-3", "Святой Престол", "24 июля", "Открыта новая выставка из собрания Ватиканских музеев"],
  ],
  world: [
    ["img-report-1", "КЦ в мире", "Сегодня", "Паломничество к святыням Сибири объединило тысячи верующих"],
    ["img-people-2", "Мир", "Вчера", "Католические общины Европы начали новый образовательный сезон"],
    ["img-light", "КЦ в мире", "23 июля", "Встреча молодёжи завершилась общей молитвой о мире"],
  ],
};

const newsGrid = document.querySelector("[data-news-panel]");
document.querySelectorAll("[data-news]").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll("[data-news]").forEach((button) => button.classList.toggle("active", button === tab));
  newsGrid.innerHTML = news[tab.dataset.news].map(([image, category, date, title]) => `
    <article class="news-card">
      <a class="card-image ${image}" href="article.html"></a>
      <p class="story-meta"><span>${category}</span><time>${date}</time></p>
      <h3><a href="article.html">${title}</a></h3>
    </article>`).join("");
}));

const sectionsPhoto = document.querySelector(".sections-photo");
document.querySelectorAll(".section-row").forEach((row) => row.addEventListener("mouseenter", () => {
  if (!sectionsPhoto) return;
  sectionsPhoto.style.setProperty("--pos", row.dataset.pos);
}));

const subscribeForm = document.querySelector(".subscribe-form");
subscribeForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.querySelector(".note");
  if (subscribeForm.querySelector("input").checkValidity()) {
    subscribeForm.reset();
    note.textContent = "Спасибо. Первое письмо придёт в ближайшую субботу.";
  } else {
    note.textContent = "Проверьте адрес электронной почты.";
  }
});

const slides = [...document.querySelectorAll(".hero-pagination button")];
const counter = document.querySelector(".hero-count b");
slides.forEach((button, index) => button.addEventListener("click", () => {
  slides.forEach((item) => item.classList.toggle("active", item === button));
  counter.textContent = String(index + 1).padStart(2, "0");
}));

const progress = document.querySelector(".read-progress i");
if (progress) {
  const updateProgress = () => {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    progress.style.width = `${Math.min((window.scrollY / scrollable) * 100, 100)}%`;
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
}

const lightbox = document.querySelector(".lightbox");
if (lightbox) {
  const photo = lightbox.querySelector(".lightbox-photo");
  const caption = lightbox.querySelector(".lightbox-caption");
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  };

  document.querySelectorAll(".gallery-item").forEach((item) => item.addEventListener("click", () => {
    const image = getComputedStyle(item).getPropertyValue("--img").trim() || getComputedStyle(item).backgroundImage;
    photo.style.backgroundImage = image;
    caption.textContent = item.dataset.caption ?? "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }));

  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !lightbox.hidden) closeLightbox(); });
}

document.querySelectorAll(".copy-link").forEach((button) => button.addEventListener("click", async () => {
  await navigator.clipboard?.writeText(location.href);
  const original = button.textContent;
  button.textContent = "Ссылка скопирована";
  setTimeout(() => { button.textContent = original; }, 2200);
}));

const feed = document.getElementById("feed");
document.querySelector("[data-feed]")?.addEventListener("click", (event) => {
  const button = event.currentTarget;
  const batch = [...feed.children].slice(0, 3).map((item) => {
    const clone = item.cloneNode(true);
    clone.classList.add("reveal");
    clone.classList.remove("visible");
    return clone;
  });
  batch.forEach((item) => { feed.appendChild(item); observe(item); });
  if (feed.children.length > 14) button.remove();
});

document.querySelectorAll(".amount").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".amount").forEach((item) => item.classList.toggle("active", item === button));
}));
