/**
 * PRODUCT STUDIO
 * Project copy, wall positions, and page behavior live in this file.
 *
 * Replace before publishing:
 * - Studio name in index.html ("PRODUCT STUDIO")
 * - YOUR_STUDIO_EMAIL on the Email us link
 * - YOUR_KIRYL_LINKEDIN, YOUR_NVIDIA_FEATURE, YOUR_FORBES_PROFILE
 * - Drop screenshots into /assets using the paths below
 *
 * The portfolio is a row of narrow spines; the one under the pointer opens into its card.
 */

const PROJECTS = [
  {
    id: "magiscan",
    name: "MagiScan",
    category: "AI · 3D · Mobile · Spatial Computing",
    tag: "AI · 3D",
    headline: "Making the physical world editable.",
    overview: "MagiScan is an AI-powered 3D creation ecosystem that allows real-world objects to be transformed into digital 3D models using a smartphone.",
    challenge: "Make 3D creation and capture accessible through a simple mobile experience.",
    built: "A product ecosystem centered around mobile capture, 3D scanning, model creation and spatial workflows.",
    capabilities: ["Product Strategy", "Mobile Product", "UX/UI", "AI", "3D", "Computer Vision", "AR"],
    proof: ["4M+ installs worldwide", "16M+ 3D models created"],
    url: "https://magiscan.app/",
    images: [
      ["/sustain/assets/magiscan-cover.png?v=2", "MagiScan scanning cover"],
      ["/sustain/assets/magiscan-01.jpg?v=3", "MagiScan mobile scanning interface"],
      ["/sustain/assets/magiscan-02.jpg", "MagiScan 3D model review"],
      ["/sustain/assets/magiscan-03.jpg", "3D model created with MagiScan"]
    ]
  },
  {
    id: "ava",
    name: "AVA",
    category: "MedTech · AI · 3D",
    tag: "MedTech",
    headline: "3D technology for aesthetic medicine.",
    overview: "AVA applies 3D scanning and digital visualization technology to aesthetic medicine workflows.",
    challenge: "Create a clear visualization experience for specialized professional use cases.",
    built: "A product experience centered around 3D scanning, visualization and workflow usability.",
    capabilities: ["Product", "UX/UI", "3D", "AI", "Mobile Experience", "MedTech"],
    useCases: ["Craniofacial Planning", "Breast Augmentation 3D"],
    images: [
      ["/sustain/assets/ava-cover.png?v=2", "AVA face analysis cover"],
      ["/sustain/assets/ava-01.jpg", "AVA facial 3D visualization"],
      ["/sustain/assets/ava-02.jpg", "AVA aesthetic medicine 3D visualization"]
    ]
  },
  {
    id: "freightsizer",
    name: "FreightSizer",
    category: "Logistics · Spatial AI · B2B",
    tag: "Spatial AI",
    headline: "Turning spatial data into smarter logistics.",
    overview: "FreightSizer is a spatial technology product designed around cargo measurement and logistics workflows.",
    challenge: "Turn physical cargo dimensions into useful digital information.",
    built: "A product experience centered around scanning, dimension capture and logistics workflow usability.",
    capabilities: ["B2B Product", "Spatial AI", "3D", "Mobile", "UX/UI", "Logistics Technology"],
    images: [
      ["/sustain/assets/freightsizer-cover.png?v=2", "FreightSizer cargo measurement cover"]
    ]
  },
  {
    id: "orthio",
    name: "ORTHIO",
    category: "3D · Orthotics · Mobile",
    tag: "3D · Mobile",
    headline: "Guided 3D foot scanning from a smartphone.",
    overview: "ORTHIO is a mobile 3D scanning product designed around remote foot scanning and custom orthotic workflows.",
    challenge: "Make remote capture guided, understandable and easy to complete.",
    built: "A mobile scanning experience including guided capture, scan review and provider submission workflows.",
    capabilities: ["Mobile Product", "UX/UI", "3D Scanning", "Spatial Technology", "Guided Capture Flow"],
    url: "https://orthio.app/",
    images: [
      ["/sustain/assets/orthio-cover.png?v=2", "ORTHIO foot scanning cover"],
      ["/sustain/assets/orthio-01.jpg", "3D foot model for custom orthotics"]
    ]
  },
  {
    id: "arize",
    name: "ARize",
    category: "AR · E-commerce · 3D",
    tag: "AR · Commerce",
    headline: "Bringing physical products into digital commerce.",
    overview: "ARize is an augmented-reality commerce product focused on interactive product visualization using 3D and AR.",
    challenge: "Reduce the gap between physical product experience and digital shopping.",
    built: "A commerce experience centered around AR interaction and product visualization.",
    capabilities: ["AR", "3D Commerce", "UX/UI", "E-commerce", "Interactive Experience"],
    useCases: ["Footwear Virtual Try-On", "Interior Design"],
    images: [
      ["/sustain/assets/arize-cover.png?v=2", "ARize product visualization cover"],
      ["/sustain/assets/arize-01.jpg", "ARize footwear viewing interface"],
      ["/sustain/assets/arize-02.jpg", "ARize interior product visualization"]
    ]
  },
  {
    id: "monixa",
    name: "Monixa",
    category: "FinTech · AI · Mobile · Web",
    tag: "FinTech",
    headline: "Investment intelligence, reimagined.",
    overview: "Monixa is an AI-powered financial technology product combining market intelligence, portfolio tools and personalized information experiences across web and mobile.",
    challenge: "Present complex financial information through a clear and usable product experience.",
    built: "A product experience centered around market intelligence, portfolio views and financial tools.",
    capabilities: ["FinTech", "AI", "Web", "Mobile", "Product Design"],
    url: "https://monixa.ai/",
    images: [
      ["/sustain/assets/monixa-01.jpg", "Monixa portfolio interface"],
      ["/sustain/assets/monixa-02.png", "Monixa product page"]
    ]
  },
  {
    id: "itgrows",
    name: "ItGrows",
    category: "AI · SaaS · Social Automation",
    tag: "SaaS",
    headline: "An AI content engine that learns your voice.",
    overview: "ItGrows is an AI-powered SaaS platform designed to create, schedule and publish content across LinkedIn and X.",
    challenge: "Help users create content efficiently while maintaining a consistent personal or company voice.",
    built: "A SaaS workflow around AI generation, content planning, scheduling and publishing.",
    capabilities: ["AI", "SaaS", "Automation", "UX/UI", "Web Platform"],
    url: "https://www.itgrows.ai/",
    images: [
      ["/sustain/assets/itgrows-cover.png?v=2", "ItGrows content studio cover"]
    ]
  },
  {
    id: "oyper",
    name: "Oyper",
    category: "AI · Computer Vision · E-commerce",
    tag: "Computer Vision",
    headline: "Turning visual content into searchable commerce.",
    overview: "Oyper is an AI-powered visual search and recommendation product designed to recognize fashion products in images and video and connect users with relevant products.",
    challenge: "Transform visual media into product discovery experiences.",
    built: "A product focused on computer vision, recognition, recommendation and visual commerce.",
    capabilities: ["Computer Vision", "Visual Search", "Recommendation", "Video Commerce", "E-commerce"],
    images: [
      ["/sustain/assets/oyper-cover.png?v=2", "Oyper visual search cover"]
    ]
  },
  {
    id: "pickaclass",
    name: "PickAClass",
    category: "EdTech · Marketplace · Web · Mobile",
    tag: "EdTech",
    headline: "Making practical education easier to discover.",
    overview: "PickAClass is a digital learning marketplace built around course discovery, purchasing, subscriptions and skills credentials.",
    challenge: "Organize a large learning catalog into a clear and usable digital experience.",
    built: "A marketplace product covering discovery, course access, purchasing, subscriptions and learning flows.",
    capabilities: ["EdTech", "Marketplace", "Web Platform", "Mobile", "Subscription", "E-commerce"],
    url: "https://pickaclass.com/",
    images: [
      ["/sustain/assets/pickaclass-cover.png?v=2", "PickAClass marketplace cover"]
    ]
  },
  {
    id: "luni",
    name: "LUNI",
    category: "E-commerce · Beauty · Web",
    tag: "E-commerce",
    headline: "A curated digital home for Korean beauty.",
    overview: "LUNI is a premium Korean beauty e-commerce experience built around curated products, clean presentation and a clear customer journey.",
    challenge: "Create an online beauty experience that feels premium while remaining simple and easy to navigate.",
    built: "A responsive e-commerce experience combining product presentation, brand direction and shopping UX.",
    capabilities: ["Web Design", "E-commerce", "UX/UI", "Responsive Design"],
    url: "https://www.luni.care/",
    images: [
      ["/sustain/assets/luni-cover.png?v=2", "LUNI product cover"],
      ["/sustain/assets/luni-01.webp", "LUNI homepage product presentation"],
      ["/sustain/assets/luni-02.webp", "LUNI catalog product"]
    ]
  },
  {
    id: "learnflat",
    name: "LearnFlat",
    category: "AI · EdTech · Web Platform",
    tag: "AI · EdTech",
    headline: "Building smarter learning experiences.",
    overview: "An AI-powered learning platform focused on structured skill development and personalized learning experiences.",
    capabilities: ["AI", "EdTech", "Web Platform", "Product", "UX/UI"],
    placement: "more",
    images: [
      ["/sustain/assets/learnflat-cover.png?v=2", "LearnFlat learning platform cover"]
    ]
  },
  {
    id: "deepmate",
    name: "DeepMate",
    category: "AI · HRTech · SaaS",
    tag: "AI · HRTech",
    headline: "AI-assisted recruiting and interviewing.",
    overview: "A recruiting technology product centered around candidate-specific questions and structured AI-assisted interview workflows.",
    capabilities: ["AI", "HRTech", "SaaS", "Product", "UX/UI"],
    placement: "more",
    images: [
      ["/sustain/assets/deepmate-cover.png?v=2", "DeepMate interview session cover"]
    ]
  },
  {
    id: "appslift",
    name: "AppsLift",
    category: "Mobile · ASO · Growth",
    tag: "Mobile · ASO",
    headline: "Helping mobile products get discovered.",
    overview: "A mobile growth product focused on app-store visibility, search optimization and organic acquisition.",
    capabilities: ["Mobile", "ASO", "Growth", "Product", "Web"],
    placement: "more",
    platform: {
      label: "Open platform",
      url: "https://ai.appslift.com/"
    },
    images: [
      ["/sustain/assets/appslift-cover.png?v=2", "AppsLift growth dashboard cover"]
    ]
  }
];

const shelfViewport = document.getElementById("shelf-viewport");
const shelfTrack = document.getElementById("shelf-track");
const indexEl = document.getElementById("work-index");
const moreEl = document.getElementById("more-grid");
const overlay = document.getElementById("overlay");
const dialog = overlay.querySelector(".overlay__dialog");
const modalContent = document.getElementById("modal-content");
const page = document.getElementById("page");
const nav = document.getElementById("site-nav");
const burger = document.getElementById("burger");
const form = document.getElementById("inquiry");
const formStatus = document.getElementById("form-status");

const showcase = PROJECTS.filter((project) => project.placement !== "more");
const moreProjects = PROJECTS.filter((project) => project.placement === "more");

let modalProject = null;
let lastFocus = null;
let menuOpen = false;
let modalOpen = false;
let scrollY = 0;
let scrollLocked = false;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function projectById(id) {
  return PROJECTS.find((project) => project.id === id);
}

function plate(project, named) {
  return `
    <span class="plate">
      <span class="plate__tag">${esc(project.tag)}</span>
      ${named ? `<span class="plate__name">${esc(project.name)}</span>` : ""}
    </span>
  `;
}

function externalAnchor(href, label, className) {
  return `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span class="ext" aria-hidden="true">↗</span></a>`;
}

function imageTag(src, alt) {
  if (!src) return "";
  return `<img src="${esc(src)}" alt="${esc(alt)}" draggable="false">`;
}

function watchImages(root) {
  root.querySelectorAll("img").forEach((img) => {
    const show = () => {
      if (img.naturalWidth <= 0) return;
      img.classList.add("is-on");
      const shot = img.closest(".shot");
      if (!shot) return;
      const dpr = window.devicePixelRatio || 1;
      const frame = shot.clientWidth || img.naturalWidth;
      const sharp = Math.max(1, Math.round(img.naturalWidth / dpr));
      img.style.width = `${Math.min(frame, sharp)}px`;
    };
    const drop = () => img.remove();
    img.addEventListener("load", show);
    img.addEventListener("error", drop);
    if (img.complete) {
      if (img.naturalWidth > 0) show();
      else drop();
    }
  });
}

// These covers have a caption baked into their lower part, so only their top is shown.
const PORTRAIT_COVERS = new Set(["ava", "monixa", "itgrows", "oyper", "luni"]);

function renderShelf() {
  shelfTrack.innerHTML = showcase.map((project, index) => {
    const image = project.images?.[0];
    return `
      <button class="item${PORTRAIT_COVERS.has(project.id) ? " item--portrait" : ""}" type="button" data-cover="${esc(project.id)}" aria-haspopup="dialog" aria-label="${esc(project.name)}">
        <span class="item__spine">
          ${image ? `<span class="item__art" aria-hidden="true">${imageTag(image[0], "")}</span>` : ""}
          <span class="item__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
          <span class="item__title">${esc(project.name)}</span>
          <span class="item__label">${esc(project.tag)}</span>
        </span>
        <span class="item__card">
          <span class="item__cover">${image ? imageTag(image[0], "") : ""}</span>
          <span class="item__info">
            <span class="item__tag">${esc(project.category)}</span>
            <span class="item__name">${esc(project.name)}</span>
            <span class="item__headline">${esc(project.headline)}</span>
            <span class="item__text">${esc(project.overview)}</span>
            <span class="item__go">View project <span class="arr" aria-hidden="true">→</span></span>
          </span>
        </span>
      </button>
    `;
  }).join("");
}

function bindShelf() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollMode = window.matchMedia("(max-width: 859px)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const prevBtn = document.getElementById("shelf-prev");
  const nextBtn = document.getElementById("shelf-next");
  const countEl = document.getElementById("shelf-count");
  const items = [...shelfTrack.querySelectorAll(".item")];
  const HOVER_DELAY = reduce ? 0 : 90;
  const MOVE_TIME = reduce ? 0 : 340;
  const GAP = 4;
  let active = 1;
  let spine = 0;
  let cards = [];
  let lastWidth = 0;
  let timer = 0;
  let settleUntil = 0;
  let pointerX = -1;
  let pointerY = -1;
  let pointerInside = false;

  const place = () => {
    if (scrollMode.matches) {
      items.forEach((item) => { item.style.transform = ""; });
      return;
    }
    let x = 0;
    items.forEach((item, index) => {
      item.style.transform = `translate3d(${x}px,0,0)`;
      x += spine + GAP + (index === active ? cards[index] : 0);
    });
  };

  const mark = () => {
    items.forEach((item, index) => {
      const on = index === active;
      item.classList.toggle("is-active", on);
      if (on) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });
    if (countEl) countEl.textContent = `${String(active + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    if (prevBtn) prevBtn.disabled = active === 0;
    if (nextBtn) nextBtn.disabled = active === items.length - 1;
  };

  // Sizes are worked out here only, on load and when the window's width changes: never during a hover.
  const measure = () => {
    const view = shelfViewport.clientWidth;
    const small = scrollMode.matches;
    const tier = small
      ? { spine: 52, height: 400 }
      : view >= 1200
        ? { spine: 64, height: 420 }
        : view >= 1000
          ? { spine: 54, height: 390 }
          : { spine: 44, height: 350 };
    spine = tier.spine;
    const taken = items.length * (spine + GAP);
    const cardWidth = small ? Math.min(Math.round(window.innerWidth * 0.74), 300) : Math.min(view - taken, 760);
    shelfTrack.style.setProperty("--shelf-h", `${tier.height}px`);
    shelfTrack.style.setProperty("--spine-w", `${spine}px`);
    cards = items.map((item, index) => {
      const portrait = item.classList.contains("item--portrait");
      const cover = Math.min(Math.round(tier.height * (portrait ? 0.8 : 1152 / 1023)), cardWidth);
      // Too little room beside the cover for the text: the card is the cover alone.
      const noInfo = !small && cardWidth - cover < 170;
      const width = noInfo ? cover : cardWidth;
      item.style.zIndex = String(index + 1);
      item.style.setProperty("--cover-w", `${cover}px`);
      item.style.setProperty("--card-w", `${width}px`);
      item.classList.toggle("item--no-info", noInfo);
      return width;
    });
    place();
  };

  const setActive = (index, reveal = true) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    if (next !== active) {
      active = next;
      settleUntil = performance.now() + MOVE_TIME;
      mark();
      place();
    }
    if (reveal && scrollMode.matches) {
      shelfViewport.scrollTo({ left: Math.max(0, items[active].offsetLeft - 8), behavior: reduce ? "auto" : "smooth" });
    }
  };

  const itemUnderPointer = () => {
    if (!pointerInside) return -1;
    const item = document.elementFromPoint(pointerX, pointerY)?.closest?.(".item");
    return item ? items.indexOf(item) : -1;
  };

  // Opens what the pointer rests on, once the row has stopped moving. Spines left of an open card keep
  // their place and the ones right of it move away, so the pointer stays on the same project and nothing flickers.
  const follow = () => {
    window.clearTimeout(timer);
    const wait = Math.max(HOVER_DELAY, settleUntil - performance.now());
    timer = window.setTimeout(() => {
      const index = itemUnderPointer();
      if (index < 0 || index === active) return;
      setActive(index);
      follow();
    }, wait);
  };

  shelfViewport.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || scrollMode.matches || !canHover.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerInside = true;
    follow();
  }, { passive: true });

  shelfViewport.addEventListener("pointerleave", () => {
    pointerInside = false;
    window.clearTimeout(timer);
  });

  shelfViewport.addEventListener("click", (event) => {
    const item = event.target.closest("[data-cover]");
    if (!item) return;
    const index = items.indexOf(item);
    // Without a hover the first tap opens the card, the second the project.
    if (index !== active && (scrollMode.matches || !canHover.matches)) {
      setActive(index);
      return;
    }
    setActive(index);
    openProject(item.dataset.cover, item);
  });

  shelfViewport.addEventListener("focusin", (event) => {
    const item = event.target.closest?.(".item");
    if (item?.matches(":focus-visible")) setActive(items.indexOf(item));
  });

  shelfViewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    setActive(active + (event.key === "ArrowRight" ? 1 : -1));
    items[active]?.focus();
  });

  prevBtn?.addEventListener("click", () => setActive(active - 1));
  nextBtn?.addEventListener("click", () => setActive(active + 1));

  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    measure();
  });

  lastWidth = window.innerWidth;
  mark();
  measure();
}

function renderIndex() {
  indexEl.innerHTML = showcase.map((project) => `
    <button type="button" data-project="${esc(project.id)}" aria-haspopup="dialog">
      <span class="ix__name">${esc(project.name)}</span>
      <span class="ix__tag">${esc(project.tag)}</span>
    </button>
  `).join("");
}

function renderMore() {
  moreEl.innerHTML = moreProjects.map((project) => {
    const cover = project.images?.[0];
    const body = `
      ${cover ? `<span class="more__visual">${imageTag(cover[0], cover[1])}</span>` : ""}
      <span class="more__tag">${esc(project.category)}</span>
      <span class="more__name">${esc(project.name)}</span>
      <span class="more__headline">${esc(project.headline)}</span>
      <span class="more__text">${esc(project.overview)}</span>
      <span class="more__go">View <span class="arr" aria-hidden="true">→</span></span>
    `;
    const platform = project.platform
      ? externalAnchor(project.platform.url, project.platform.label, "more__platform")
      : "";
    if (!platform) {
      return `<button class="more__item" type="button" data-project="${esc(project.id)}" aria-haspopup="dialog">${body}</button>`;
    }
    return `
      <div class="more__item">
        <button class="more__open" type="button" data-project="${esc(project.id)}" aria-haspopup="dialog">${body}</button>
        ${platform}
      </div>
    `;
  }).join("");
}

function list(className, items) {
  if (!items?.length) return "";
  return `<ul class="${className}">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

function block(title, html) {
  if (!html) return "";
  return `<section class="modal__block"><h3>${esc(title)}</h3>${html}</section>`;
}

function gallery(project) {
  if (!project.images?.length) return "";
  const figures = project.images.map(([src, alt]) => `
    <figure class="shot">
      ${plate(project, true)}
      ${imageTag(src, alt)}
    </figure>
  `).join("");
  return block("Gallery", `<div class="gallery">${figures}</div>`);
}

function openProject(id, trigger) {
  const project = projectById(id);
  if (!project) return;
  closeMenu(false);

  modalContent.innerHTML = `
    <p class="modal__cat" id="modal-category">${esc(project.category)}</p>
    <h2 class="modal__title" id="modal-title">${esc(project.name)}</h2>
    <p class="modal__headline">${esc(project.headline)}</p>
    ${block("Overview", `<p>${esc(project.overview)}</p>`)}
    ${project.challenge || project.built ? `
      <div class="modal__split">
        ${block("Challenge", project.challenge ? `<p>${esc(project.challenge)}</p>` : "")}
        ${block("What we built", project.built ? `<p>${esc(project.built)}</p>` : "")}
      </div>
    ` : ""}
    ${block("Capabilities", list("caps", project.capabilities))}
    ${block("Known use cases", list("plain", project.useCases))}
    ${block("Proof", list("plain", project.proof))}
    ${gallery(project)}
    ${project.platform ? externalAnchor(project.platform.url, project.platform.label, "modal__link") : ""}
    ${project.url ? externalAnchor(project.url, "Open platform", "modal__link") : ""}
  `;

  watchImages(modalContent);
  lastFocus = trigger || document.activeElement;
  modalProject = project;
  modalOpen = true;
  overlay.hidden = false;
  page.inert = true;
  syncLock();
  dialog.scrollTop = 0;
  const closeBtn = overlay.querySelector("[data-close]");
  closeBtn.focus();
}

function closeModal() {
  if (!modalOpen) return;
  modalOpen = false;
  overlay.hidden = true;
  page.inert = false;
  modalContent.innerHTML = "";
  syncLock();
  if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  lastFocus = null;
}

function focusable() {
  return [...dialog.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter((el) => !el.disabled && el.getAttribute("aria-hidden") !== "true");
}

function onModalKeydown(event) {
  if (!modalOpen) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal();
    return;
  }
  if (event.key !== "Tab") return;
  const items = focusable();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function syncLock() {
  const should = menuOpen || modalOpen;
  if (should && !scrollLocked) {
    scrollY = window.scrollY;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    scrollLocked = true;
  } else if (!should && scrollLocked) {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    window.scrollTo(0, scrollY);
    scrollLocked = false;
  }
}

function closeMenu(restoreLock = true) {
  if (!menuOpen) return;
  menuOpen = false;
  nav.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Open menu");
  if (restoreLock) syncLock();
}

function openMenu() {
  menuOpen = true;
  nav.classList.add("is-open");
  burger.setAttribute("aria-expanded", "true");
  burger.setAttribute("aria-label", "Close menu");
  syncLock();
}

function studioEmail() {
  const link = document.querySelector("[data-email]");
  return (link?.getAttribute("href") || "").replace(/^mailto:/i, "").trim();
}

function emailIsReady(email) {
  return email.includes("@") && !email.toUpperCase().includes("YOUR_");
}

function bindPlaceholders() {
  document.querySelectorAll("[data-placeholder]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (/^https?:/i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return;
    }
    link.addEventListener("click", (event) => event.preventDefault());
  });
}

function bindExternalLinks() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (!/^https?:/i.test(href)) return;
    link.target = "_blank";
    if (!link.rel.includes("noopener")) link.rel = "noopener noreferrer";
  }, true);
}

function bindForm() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const company = form.company.value.trim();
    const type = form.type.value;
    const message = form.message.value.trim();

    if (!name || !email || !type || !message || !form.email.checkValidity()) {
      form.reportValidity();
      formStatus.textContent = "";
      return;
    }

    const studio = studioEmail();
    if (!emailIsReady(studio)) {
      formStatus.textContent = "Nothing was sent. Replace YOUR_STUDIO_EMAIL on the Email us link with a real address, then prepare the inquiry again.";
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "—"}`,
      `Project type: ${type}`,
      "",
      message
    ].join("\n");

    const href = `mailto:${studio}?subject=${encodeURIComponent("Project inquiry")}&body=${encodeURIComponent(body)}`;
    formStatus.innerHTML = `Nothing was sent from this page. <a href="${esc(href)}">Open this inquiry in email →</a>`;
  });
}

function bindMenu() {
  burger.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen && !modalOpen) closeMenu();
  });
}

function bindProjects() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-project]");
    if (!trigger) return;
    openProject(trigger.dataset.project, trigger);
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  overlay.querySelector("[data-close]").addEventListener("click", closeModal);
  document.addEventListener("keydown", onModalKeydown);
}

function bindSpy() {
  const links = [...document.querySelectorAll(".nav__link")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const update = () => {
    const line = 120;
    let current = "";
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) current = section.id;
    });
    links.forEach((link) => {
      const on = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-on", on);
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function bindReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  const nodes = [...document.querySelectorAll(".reveal")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  nodes.forEach((node) => {
    const top = node.getBoundingClientRect().top;
    if (top < window.innerHeight * 0.92) return;
    node.classList.add("await");
    observer.observe(node);
  });
}

function bindInquiryFocus() {
  const jump = document.querySelector('a[href="#inquiry"]');
  jump?.addEventListener("click", () => {
    window.setTimeout(() => document.getElementById("name")?.focus(), 350);
  });
}

renderShelf();
bindShelf();
renderIndex();
renderMore();
watchImages(document);
bindProjects();
bindMenu();
bindForm();
bindPlaceholders();
bindExternalLinks();
bindSpy();
bindReveal();
bindInquiryFocus();
