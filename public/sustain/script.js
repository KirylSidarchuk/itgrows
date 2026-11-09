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
 * The selected-work shelf is a horizontal row of overlapping covers.
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

const SHELF_LABEL = {
  magiscan: "AI · 3D · Mobile",
  ava: "MedTech · AI · 3D",
  freightsizer: "Logistics · Spatial AI",
  orthio: "3D · Orthotics · Mobile",
  arize: "AR · E-commerce",
  monixa: "FinTech · AI · Web",
  itgrows: "AI · SaaS",
  oyper: "Computer Vision",
  pickaclass: "EdTech",
  luni: "E-commerce"
};

function renderShelf() {
  shelfTrack.innerHTML = showcase.map((project) => {
    const image = project.images?.[0];
    const label = SHELF_LABEL[project.id] || project.tag;
    return `
      <button class="cover" type="button" data-cover="${esc(project.id)}" aria-haspopup="dialog">
        <span class="cover__view">
          ${plate(project, false)}
          ${image ? imageTag(image[0], "") : ""}
        </span>
        <span class="cover__meta">
          <span class="cover__tag">${esc(label)}</span>
          <span class="cover__name">${esc(project.name)}</span>
        </span>
      </button>
    `;
  }).join("");
}

function bindShelf() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = window.matchMedia("(max-width: 700px)");
  const prevBtn = document.getElementById("shelf-prev");
  const nextBtn = document.getElementById("shelf-next");
  const countEl = document.getElementById("shelf-count");
  let cards = [];
  let positions = [];
  let trackWidth = 0;
  let active = 0;
  let offset = 0;
  let dragging = false;
  let locked = false;
  let suppressClick = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startOffset = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let quietScroll = false;
  let dragFrame = 0;
  let settleTimer = 0;
  let tracking = true;
  let widths = [];

  const isMobile = () => mobileQuery.matches;

  const metrics = () => {
    const view = shelfViewport.clientWidth;
    if (view >= 1480) return { baseW: 300, baseH: 470, activeW: 380, activeH: 528, cover: 0.045, tuck: 18, peek: 12, after: 18 };
    if (view >= 1280) return { baseW: 268, baseH: 430, activeW: 340, activeH: 488, cover: 0.045, tuck: 16, peek: 10, after: 16 };
    if (view >= 1024) return { baseW: 236, baseH: 390, activeW: 300, activeH: 448, cover: 0.04, tuck: 14, peek: 8, after: 14 };
    return { baseW: 210, baseH: 356, activeW: 264, activeH: 408, cover: 0.04, tuck: 12, peek: 8, after: 12 };
  };

  const limits = () => ({
    min: Math.min(0, shelfViewport.clientWidth - trackWidth),
    max: 0
  });

  const targetFor = (index) => {
    const { peek } = metrics();
    const anchor = index === 0 ? 0 : positions[index - 1] + peek;
    const raw = -anchor;
    const { min, max } = limits();
    return Math.max(min, Math.min(max, raw));
  };

  const pad = (value) => String(value).padStart(2, "0");

  const mark = () => {
    cards.forEach((card, index) => {
      const on = index === active;
      card.classList.toggle("is-active", on);
      card.classList.toggle("is-prev", index === active - 1);
      card.classList.toggle("is-next", index === active + 1);
      card.style.setProperty("--pad-in", "16px");
      if (on) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
      if (!isMobile()) {
        card.style.zIndex = on ? "40" : String(index < active ? index + 1 : 12 + index);
      } else {
        card.style.zIndex = "";
      }
    });
    if (countEl) countEl.textContent = `${pad(active + 1)} / ${pad(cards.length)}`;
    if (prevBtn) prevBtn.disabled = active === 0;
    if (nextBtn) nextBtn.disabled = active === cards.length - 1;
  };

  const apply = (animated) => {
    if (isMobile()) return;
    tracking = !(animated && !reduce);
    shelfTrack.style.transition = animated && !reduce
      ? "transform 0.32s cubic-bezier(.16,.84,.28,1)"
      : "none";
    shelfTrack.style.transform = `translate3d(${Math.round(offset)}px,0,0)`;
  };

  const layout = () => {
    cards = [...shelfTrack.querySelectorAll(".cover")];
    if (isMobile()) {
      positions = cards.map((card) => card.offsetLeft);
      cards.forEach((card) => {
        card.style.left = "";
        card.style.top = "";
        card.style.width = "";
        card.style.height = "";
        card.style.removeProperty("--pad-in");
      });
      shelfTrack.style.width = "";
      shelfTrack.style.height = "";
      shelfTrack.style.transform = "none";
      trackWidth = shelfTrack.scrollWidth;
      mark();
      return;
    }

    const size = metrics();
    positions = [];
    widths = [];
    let x = 0;
    cards.forEach((card, index) => {
      const on = index === active;
      const width = on ? size.activeW : size.baseW;
      const height = on ? size.activeH : size.baseH;
      card.style.width = `${width}px`;
      card.style.height = `${height}px`;
      card.style.top = `${size.activeH - height}px`;
      positions.push(x);
      widths.push(width);
      card.style.left = `${x}px`;
      if (index < cards.length - 1) {
        const overlap = index === active ? size.tuck : index === active + 1 ? size.after : Math.round(width * size.cover);
        x += width - overlap;
      } else {
        x += width;
      }
    });
    trackWidth = x;
    shelfTrack.style.width = `${x}px`;
    shelfTrack.style.height = `${size.activeH + 18}px`;
    mark();
  };

  const nearest = (value) => {
    let best = 0;
    let dist = Infinity;
    positions.forEach((_, index) => {
      const gap = Math.abs(targetFor(index) - value);
      if (gap < dist) {
        dist = gap;
        best = index;
      }
    });
    return best;
  };

  const setActive = (index, animated = true) => {
    const next = Math.max(0, Math.min(cards.length - 1, index));
    const changed = next !== active || !positions.length;
    active = next;
    if (changed) layout();
    if (isMobile()) {
      const card = cards[active];
      if (!card) return;
      quietScroll = true;
      shelfViewport.scrollTo({
        left: card.offsetLeft,
        behavior: animated && !reduce ? "smooth" : "auto"
      });
      window.setTimeout(() => {
        quietScroll = false;
      }, animated && !reduce ? 480 : 0);
      return;
    }
    const dest = targetFor(active);
    if (!changed && Math.abs(dest - offset) < 1) return;
    offset = dest;
    apply(animated);
  };

  const paint = () => {
    dragFrame = 0;
    if (isMobile()) return;
    tracking = true;
    shelfTrack.style.transition = "none";
    shelfTrack.style.transform = `translate3d(${Math.round(offset)}px,0,0)`;
  };

  const queuePaint = () => {
    if (!dragFrame) dragFrame = requestAnimationFrame(paint);
  };

  const readOffset = () => {
    const raw = getComputedStyle(shelfTrack).transform;
    if (!raw || raw === "none") return offset;
    return new DOMMatrixReadOnly(raw).m41;
  };

  const clampOffset = (value, slack = 0) => {
    const { min, max } = limits();
    return Math.max(min - slack, Math.min(max + slack, value));
  };

  const takeOver = () => {
    if (tracking) return;
    offset = readOffset();
    tracking = true;
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    shelfTrack.style.transition = "none";
  };

  const settle = () => {
    settleTimer = 0;
    if (dragging || isMobile()) return;
    setActive(nearest(offset), true);
  };

  const queueSettle = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, reduce ? 0 : 280);
  };

  shelfViewport.addEventListener("pointerdown", (event) => {
    if (isMobile() || (event.button !== undefined && event.button !== 0)) return;
    window.clearTimeout(settleTimer);
    takeOver();
    dragging = true;
    locked = false;
    pointerId = event.pointerId;
    startX = lastX = event.clientX;
    startY = event.clientY;
    startOffset = offset;
    lastT = performance.now();
    velocity = 0;
  });

  shelfViewport.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!locked) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragging = false;
        return;
      }
      locked = true;
      shelfViewport.classList.add("is-dragging");
      try { shelfViewport.setPointerCapture(event.pointerId); } catch (err) { /* pointer already gone */ }
    }
    event.preventDefault();
    const now = performance.now();
    const dt = Math.max(16, now - lastT);
    velocity = Math.max(-2.2, Math.min(2.2, (event.clientX - lastX) / dt));
    lastX = event.clientX;
    lastT = now;
    offset = clampOffset(startOffset + dx, 24);
    queuePaint();
  }, { passive: false });

  const endDrag = (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    dragging = false;
    shelfViewport.classList.remove("is-dragging");
    if (Math.abs(dx) > 6) suppressClick = true;
    if (!locked) return;
    const flick = Math.max(-160, Math.min(160, velocity * 70));
    offset = clampOffset(offset + flick);
    setActive(nearest(offset), true);
  };

  shelfViewport.addEventListener("pointerup", endDrag);
  shelfViewport.addEventListener("pointercancel", endDrag);

  shelfViewport.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      return;
    }
    const card = event.target.closest("[data-cover]");
    if (!card) return;
    const index = cards.indexOf(card);
    if (index !== active) setActive(index);
    else openProject(card.dataset.cover, card);
  });

  shelfViewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    setActive(active + (event.key === "ArrowRight" ? 1 : -1));
    cards[active]?.focus();
  });

  shelfViewport.addEventListener("wheel", (event) => {
    if (isMobile()) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const delta = horizontal ? event.deltaX : event.deltaY;
    if (!horizontal && Math.abs(event.deltaX) < 2) return;
    if (Math.abs(delta) < 1) return;
    event.preventDefault();
    takeOver();
    offset = clampOffset(offset - delta);
    queuePaint();
    queueSettle();
  }, { passive: false });

  shelfViewport.addEventListener("scroll", () => {
    if (!isMobile() || quietScroll) return;
    const left = shelfViewport.scrollLeft;
    let best = 0;
    let dist = Infinity;
    cards.forEach((card, index) => {
      const gap = Math.abs(card.offsetLeft - left);
      if (gap < dist) {
        dist = gap;
        best = index;
      }
    });
    if (best === active) return;
    active = best;
    mark();
  }, { passive: true });

  prevBtn?.addEventListener("click", () => setActive(active - 1));
  nextBtn?.addEventListener("click", () => setActive(active + 1));

  window.addEventListener("resize", () => setActive(active, false));

  layout();
  setActive(1, false);
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
