// Общий движок страниц: язык, ссылки на игры, мелочи интерфейса.
//
// Русский текст живёт ТОЛЬКО в разметке (её видят и люди, и поисковики), а здесь
// и на страницах лежит лишь английский. При переключении на английский движок
// запоминает русский оригинал каждого элемента и подставляет перевод.
// Так русский невозможно рассинхронизировать: второй копии у него нет.
//
// Апострофы в английском — только ’ (прямой ломает строки в кавычках).

const COMMON_EN = {
  brand: "Games About You",
  nav_kids: "For kids", nav_adults: "For grown-ups", nav_story: "Our story", nav_price: "Pricing",
  cta_top: "Start",
  // --- как это работает ---
  how_kicker: "How it works", how_h: "From brief to game in four steps",
  s1_h: "The brief", s1_p: "Tell us about the hero: family, pets, favourite things, the words and jokes only you share. Build their look yourself in the dress-up tool.",
  s2_h: "The story — $49", s2_p: "We write the script within 48 hours: levels, plot, who gets in the way and how to beat them. We show it and revise — up to three rounds, until you say yes.",
  s3_h: "The game — in 5 days", s3_p: "Once the story is approved and paid, we start: in 5 days you get a link to your game — 5–6 levels, a boss and a finale.",
  s4_h: "New chapters", s4_p: "Optional subscription: every month we add a new chapter from your life. Earlier chapters never change and stay forever.",
  // --- цены ---
  price_kicker: "Pricing", price_h: "Clear pricing — no surprises",
  p_std_name: "Game", p_std_time: "⏱ 5 days", p_std_split: "$49 for the story (written within 48 hours) · $950 once the story is approved",
  p_fast_name: "Fast", p_fast_time: "⚡ 72 hours", p_rush_name: "Express", p_rush_time: "🚀 24 hours",
  p_split_all: "The $49 story fee is included",
  p_note: "The clock starts once the story is approved and payment is received.",
  sub_h: "A new chapter every month", sub_p: "Your story continues: a new level about what happened this month. Stop anytime — everything already made stays yours.",
  sub_price: "$99 / mo",
  inside_h: "What every game includes",
  in1: "5–6 levels, a boss and a finale", in2: "The hero, family and pets — with their real names",
  in3: "A dress-up tool for the hero", in4: "A sticker album for achievements",
  in5: "7 languages: English, Russian, French, German, Spanish, Portuguese and Italian. Need another one? We’ll make it", in6: "Phone, tablet, computer — nothing to install",
  in7: "Hidden from search engines: opens only from your link", in8: "40–60 minutes of play, and stickers and high scores invite replays",
  // --- вопросы ---
  faq_h: "Questions",
  q1: "What if I don’t like the story?", a1: "We revise up to three rounds. If it’s still not right, you pay nothing more — the $49 covers the work on the story.",
  q2: "What can it be played on?", a2: "A phone (best held sideways), a tablet or a computer. Nothing to install — the game opens from a link in the browser.",
  q7: "What languages can the game be in?", a7: "English, Russian, French, German, Spanish, Portuguese and Italian. Need another language? Tell us in the brief and we’ll make it. A game can be in several languages at once — they switch in the menu.",
  q3: "Who will see the game?", a3: "Only the people you share the link with. The game is hidden from search engines.",
  q5: "What happens if I cancel the subscription?", a5: "New chapters stop being added. Everything already made stays yours and keeps opening forever.",
  q6: "When does the clock start for the 72-hour and 24-hour options?", a6: "Once the story is approved and payment is received. The story itself takes up to 48 hours, so plan the whole thing a few days ahead.",
  // --- финал и подвал ---
  start_h: "Tell us about your hero", start_p: "Start with the brief. For $49, within 48 hours, you get the story and see what the game will be — before the main payment.",
  start_btn: "Fill in the brief",
  foot: "Made with love — by Kiryl and Ava", foot_kids: "For kids", foot_adults: "For grown-ups", foot_home: "Home",
  // --- общие карточки игр ---
  gm_play: "Play free", gm_soon: "In the works", gm_soon_btn: "Coming soon",
  gm1_who: "For kids", gm1_t: "Ava & Cookie: One Perfect Day",
  gm1_p: "School, a walk with the dog, the pool, a hamster, a cafe with Grandpa — and Granny, sent off with donuts.",
  gm1_c: ["pack the bag", "quiz", "obstacle run", "maze", "donut battle"],
  gm2_who: "For couples", gm2_t: "Emma & Jake: How We Met",
  gm2_p: "A meet-cute in a crowded coffee shop, the first-date quiz, a flat-pack wardrobe with three screws left over, and a road trip to the future.",
  gm2_c: ["through the crowd", "“how well do you know me”", "build the wardrobe", "road trip"],
  gm3_who: "For friends", gm3_t: "The Crew: Best Weekend Ever",
  gm3_p: "Make the last train, own karaoke night, defend the last slice of pizza and survive the camping trip.",
  gm3_c: ["run for the train", "karaoke on the beat", "race for the pizza", "campfire"],
  gm4_who: "For colleagues and bosses", gm4_t: "The Team: Friday, 5 PM",
  gm4_p: "Clear the inbox, make stand-up on time, win the office trivia and beat the Deadline together.",
  gm4_c: ["sort the inbox", "team trivia", "coffee run", "battle the Deadline"],
};

function initSite(PAGE_EN = {}) {
  const EN = { ...COMMON_EN, ...PAGE_EN };
  const ru = new Map();          // русский оригинал каждого переводимого элемента

  function apply(lang) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (!ru.has(el)) ru.set(el, el.innerHTML);
      if (lang === "ru") { el.innerHTML = ru.get(el); return; }
      const v = EN[el.dataset.i18n];
      if (v == null) { console.warn("нет перевода:", el.dataset.i18n); return; }
      el.innerHTML = Array.isArray(v) ? v.map((x) => `<span class="chip">${x}</span>`).join("") : v;
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      if (!ru.has(el)) ru.set(el, el.alt);
      el.alt = lang === "ru" ? ru.get(el) : (EN[el.dataset.i18nAlt] ?? el.alt);
    });
    const t = document.querySelector("title");
    if (!ru.has(t)) ru.set(t, t.textContent);
    t.textContent = lang === "ru" ? ru.get(t) : (EN.title ?? t.textContent);
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
    // ссылки в игры несут язык: у игры своё хранилище и свой выбор языка
    document.querySelectorAll("a[data-play]:not([aria-disabled=true])").forEach((a) => {
      a.href = `/game/play/${a.dataset.play}?lang=${lang}`;
    });
    try { localStorage.setItem("game_lang", lang); } catch (e) {}
  }

  let start = new URLSearchParams(location.search).get("lang");
  if (!start) { try { start = localStorage.getItem("game_lang"); } catch (e) {} }
  if (!start) start = (navigator.language || "").toLowerCase().startsWith("ru") ? "ru" : "en";
  apply(start === "en" ? "en" : "ru");
  document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => apply(b.dataset.lang)));

  // фото истории — с сервера картинок; без файла остаётся заглушка
  const ph = document.getElementById("storyPhoto");
  if (ph) {
    ph.onload = () => { ph.hidden = false; document.getElementById("photoPh")?.remove(); };
    ph.src = "https://blogs.itgrows.ai/images/game-ava-cookie.jpg";
  }

  const hdr = document.querySelector("header");
  addEventListener("scroll", () => hdr.classList.toggle("scrolled", scrollY > 8), { passive: true });

  // «Отправь эту страницу маме или папе» — для детей, которые хотят игру про себя
  document.querySelectorAll("[data-share]").forEach((btn) => btn.addEventListener("click", async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) { await navigator.share({ title: document.title, url }); return; }
      await navigator.clipboard.writeText(url);
      const n = btn.parentElement.querySelector(".copied"); if (n) n.hidden = false;
    } catch (e) {}
  }));
}
