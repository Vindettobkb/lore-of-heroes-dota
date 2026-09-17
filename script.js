"use strict";
const heroes = [...(window.HEROES || [])].sort((a, b) =>
  a.name.localeCompare(b.name, "en"),
);
const items = [...(window.ITEMS || [])].sort((a, b) =>
  a.name.localeCompare(b.name, "en"),
);
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function plainText(value) {
  return new DOMParser()
    .parseFromString(value || "", "text/html")
    .body.textContent.trim();
}
function safeImage(value) {
  return /^(https?:\/\/|(?:\.\/)?[\w-]+\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(
    value || "",
  )
    ? escapeHTML(value)
    : "";
}
const attributes = ["СИЛА", "ЛОВКОСТЬ", "ИНТЕЛЛЕКТ", "УНИВЕРСАЛЬНЫЙ"];
function note(text, side) {
  return text ? '<div class="side-note">' + escapeHTML(text) + "</div>" : "";
}
function itemMonogram(name) {
  return (name || "")
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
function renderItem(item) {
  const cost =
    typeof item.cost === "number" ? item.cost + " золота" : String(item.cost || "");
  return `<button type="button" class="item-card transition-all duration-300" data-item-key="${escapeHTML(item.key)}" data-item-name="${escapeHTML(item.name.toLowerCase())}" data-item-category="${escapeHTML((item.category || "").toLowerCase())}" aria-label="Открыть предмет ${escapeHTML(item.name)}">
    <span class="item-icon"><span class="item-icon-fallback" aria-hidden="true">${escapeHTML(itemMonogram(item.name) || "✶")}</span>${item.image ? '<img src="' + safeImage(item.image) + '" alt="' + escapeHTML(item.name) + '" loading="lazy" width="96" height="96">' : ""}</span>
    <span class="item-card-name">${escapeHTML(item.name)}</span>
    <span class="item-card-meta">${escapeHTML(item.category || "предмет")} · ${escapeHTML(cost)}</span>
  </button>`;
}
function renderHero(hero, index) {
  const lore = hero.lore
    .split(/<br\s*\/?>(?:\s*<br\s*\/?>)?/i)
    .map(plainText)
    .filter(Boolean)
    .map((text) => "<p>" + escapeHTML(text) + "</p>");
  const artSide = index % 2 === 0 ? "слева" : "справа";
  const textSide = index % 2 === 0 ? "справа" : "слева";
  return `<article id="hero-${hero.key}" class="hero-entry transition-all duration-700 motion-reduce:transition-none" data-name="${escapeHTML(hero.name.toLowerCase())}" data-letter="${hero.name[0]}" aria-labelledby="name-${hero.key}">
  <div class="chapter"><span>${String(index + 1).padStart(3, "0")}</span><span>${attributes[hero.attribute] || "ГЕРОЙ"} / ${hero.name[0]}</span></div>
  <div class="hero-layout"><div class="hero-art"><div class="art-slot"><span class="art-monogram" aria-hidden="true">${hero.name[0]}</span>${hero.image ? '<img src="' + safeImage(hero.image) + '" alt="' + escapeHTML(hero.name) + '" loading="lazy">' : ""}<div class="art-caption"><b>${escapeHTML(hero.name)}</b>${hero.image ? "ИЛЛЮСТРАЦИЯ ГЕРОЯ" : "МЕСТО ДЛЯ ИЗОБРАЖЕНИЯ ГЕРОЯ"}</div></div>${note(artSide === "слева" ? hero.leftText : hero.rightText, artSide)}</div>
  <div class="hero-story"><div class="hero-title-row"><span class="hero-logo">${hero.logo ? '<img src="' + safeImage(hero.logo) + '" alt="Лого ' + escapeHTML(hero.name) + '" loading="lazy">' : "ЛОГО<br>ГЕРОЯ"}</span><h3 class="hero-name" id="name-${hero.key}">${escapeHTML(hero.name)}</h3></div><p class="hero-intro">${escapeHTML(plainText(hero.intro))}</p><p class="lore-label">ИСТОРИЯ ГЕРОЯ</p><div class="lore">${lore[0] || ""}${lore.length > 1 ? '<details class="lore-more"><summary>Читать полную историю</summary>' + lore.slice(1).join("") + "</details>" : ""}</div><div class="abilities-heading"><span>СПОСОБНОСТИ</span><span>НАЖМИТЕ НА ИКОНКУ ↙</span></div><div class="abilities">${hero.abilities.map((a) => '<details class="ability"><summary aria-label="' + escapeHTML(a.name) + '" title="' + escapeHTML(a.name) + '"><img src="' + safeImage(a.icon) + '" alt="' + escapeHTML(a.name) + '" loading="lazy" width="50" height="50"><span class="ability-name">' + escapeHTML(a.name) + "</span></summary><p>" + escapeHTML(plainText(a.description)) + "</p></details>").join("")}</div>${note(textSide === "слева" ? hero.leftText : hero.rightText, textSide)}</div></div></article>`;
}
$("#heroes").innerHTML = heroes.map(renderHero).join("");
document.querySelectorAll("[data-total]").forEach((el) => {
  el.textContent = heroes.length;
});
const entries = [...document.querySelectorAll(".hero-entry")];
const alphabet = $("#alphabet");
alphabet.innerHTML = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
  .map(
    (letter) =>
      '<button type="button" data-letter="' +
      letter +
      '" aria-label="Герои на ' +
      letter +
      '">' +
      letter +
      "</button>",
  )
  .join("");
function filterHeroes() {
  const query = $("#hero-search").value.trim().toLowerCase();
  entries.forEach((entry) => {
    entry.hidden = !entry.dataset.name.includes(query);
  });
  const visible = entries.filter((entry) => !entry.hidden);
  $("#result-count").textContent =
    visible.length + " из " + heroes.length + " героев";
  $("#empty-state").hidden = visible.length > 0;
  $("#clear-search").hidden = !query;
  alphabet.querySelectorAll("button").forEach((button) => {
    button.disabled = !visible.some(
      (entry) => entry.dataset.letter === button.dataset.letter,
    );
    button.classList.remove("active");
    button.removeAttribute("aria-current");
  });
}
$("#hero-search").addEventListener("input", filterHeroes);
$("#clear-search").addEventListener("click", () => {
  $("#hero-search").value = "";
  filterHeroes();
  $("#hero-search").focus();
});
alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const entry = entries.find(
    (el) => !el.hidden && el.dataset.letter === button.dataset.letter,
  );
  if (entry) {
    entry.classList.remove("reveal-pending");
    entry.scrollIntoView();
  }
});
filterHeroes();
function initItemsSection() {
  const grid = $("#items-grid");
  const search = $("#item-search");
  const clear = $("#clear-item-search");
  const result = $("#item-result-count");
  const empty = $("#items-empty-state");
  const filters = $("#item-filters");
  const modal = $("#item-modal");
  const modalIcon = $("#item-modal-icon");
  const modalMonogram = $("#item-modal-monogram");
  const modalName = $("#item-modal-name");
  const modalMeta = $("#item-modal-meta");
  const modalEffect = $("#item-modal-effect");
  const modalLore = $("#item-modal-lore");
  if (
    !grid ||
    !search ||
    !clear ||
    !result ||
    !empty ||
    !filters ||
    !modal ||
    !modalIcon ||
    !modalMonogram ||
    !modalName ||
    !modalMeta ||
    !modalEffect ||
    !modalLore
  ) {
    return;
  }
  grid.innerHTML = items.map(renderItem).join("");
  const cards = [...grid.querySelectorAll(".item-card")];
  const byKey = new Map(items.map((item) => [item.key, item]));
  let activeCategory = "all";
  let triggerElement;
  function applyItemsFilter() {
    const query = search.value.trim().toLowerCase();
    cards.forEach((card) => {
      const matchesName = card.dataset.itemName.includes(query);
      const matchesCategory =
        activeCategory === "all" || card.dataset.itemCategory === activeCategory;
      card.hidden = !(matchesName && matchesCategory);
    });
    const visible = cards.filter((card) => !card.hidden);
    result.textContent = visible.length + " из " + items.length + " предметов";
    empty.hidden = visible.length > 0;
    clear.hidden = !query;
  }
  function closeItemModal() {
    modal.hidden = true;
    document.body.classList.remove("item-modal-open");
    if (triggerElement) triggerElement.focus();
  }
  function openItemModal(item, trigger) {
    if (!item) return;
    triggerElement = trigger || null;
    const cost =
      typeof item.cost === "number"
        ? item.cost + " золота"
        : String(item.cost || "Неизвестно");
    modalName.textContent = item.name || "Неизвестный предмет";
    modalMeta.textContent = (item.category || "предмет") + " · " + cost;
    modalEffect.textContent = plainText(item.effect || "Описание скоро появится.");
    modalLore.textContent = plainText(item.lore || "Лор пока не добавлен.");
    modalMonogram.textContent = itemMonogram(item.name) || "✶";
    if (item.image && safeImage(item.image)) {
      modalIcon.src = safeImage(item.image);
      modalIcon.alt = item.name || "";
      modalIcon.hidden = false;
    } else {
      modalIcon.removeAttribute("src");
      modalIcon.hidden = true;
    }
    modal
      .querySelector(".item-modal-icon-frame")
      .classList.toggle("image-failed", modalIcon.hidden);
    modal.hidden = false;
    document.body.classList.add("item-modal-open");
    $("#item-modal-close").focus();
  }
  search.addEventListener("input", applyItemsFilter);
  clear.addEventListener("click", () => {
    search.value = "";
    applyItemsFilter();
    search.focus();
  });
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-category]");
    if (!button) return;
    activeCategory = button.dataset.itemCategory || "all";
    filters
      .querySelectorAll("[data-item-category]")
      .forEach((entry) =>
        entry.setAttribute(
          "aria-pressed",
          String(entry.dataset.itemCategory === activeCategory),
        ),
      );
    applyItemsFilter();
  });
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".item-card");
    if (!card) return;
    openItemModal(byKey.get(card.dataset.itemKey), card);
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-item-close], #item-modal-close")) closeItemModal();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeItemModal();
    }
  });
  applyItemsFilter();
}
initItemsSection();
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (items) =>
      items.forEach((item) => {
        if (item.isIntersecting) {
          item.target.classList.remove("reveal-pending");
          observer.unobserve(item.target);
        }
      }),
    { rootMargin: "100px" },
  );
  entries.forEach((entry) => {
    entry.classList.add("reveal-pending");
    observer.observe(entry);
  });
}
let scheduled = false;
function updateScroll() {
  scheduled = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  $(".reading-progress").style.width =
    (max > 0 ? (scrollY / max) * 100 : 0) + "%";
  const current = entries.find(
    (entry) => !entry.hidden && entry.getBoundingClientRect().bottom > 120,
  );
  alphabet.querySelectorAll("button").forEach((button) => {
    const active = current?.dataset.letter === button.dataset.letter;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}
addEventListener(
  "scroll",
  () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
function setSettings(open) {
  $("#settings").hidden = !open;
  $("#settings-toggle").setAttribute("aria-expanded", String(open));
}
$("#settings-toggle").addEventListener("click", () =>
  setSettings($("#settings").hidden),
);
$("#settings-close").addEventListener("click", () => {
  setSettings(false);
  $("#settings-toggle").focus();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#settings, #settings-toggle")) setSettings(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#settings").hidden) {
    setSettings(false);
    $("#settings-toggle").focus();
  }
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
    !document.activeElement.isContentEditable
  ) {
    event.preventDefault();
    $("#hero-search").focus();
  }
  if (
    (event.key === "i" || event.key === "I" || event.key === "ш" || event.key === "Ш") &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
    !document.activeElement.isContentEditable &&
    $("#item-search")
  ) {
    event.preventDefault();
    $("#item-search").focus();
  }
});
function setTheme(theme) {
  if (!["forest", "ember", "void"].includes(theme)) theme = "forest";
  document.body.dataset.theme = theme;
  document
    .querySelectorAll("[data-theme-choice]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeChoice === theme),
      ),
    );
  try {
    localStorage.setItem("ancients-theme", theme);
  } catch {
    /* Storage can be blocked. */
  }
}
document
  .querySelectorAll("[data-theme-choice]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      setTheme(button.dataset.themeChoice),
    ),
  );
try {
  setTheme(localStorage.getItem("ancients-theme") || "forest");
} catch {
  setTheme("forest");
}
let backgroundURL;
let backgroundRequest = 0;
$("#background-upload").addEventListener("change", async (event) => {
  const request = ++backgroundRequest;
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
    $("#background-status").textContent =
      "Выберите изображение размером до 15 МБ.";
    return;
  }
  const url = URL.createObjectURL(file);
  const preview = new Image();
  preview.src = url;
  try {
    await preview.decode();
  } catch {
    URL.revokeObjectURL(url);
    if (request === backgroundRequest)
      $("#background-status").textContent =
        "Не удалось открыть изображение. Попробуйте PNG, JPG или WebP.";
    return;
  }
  if (request !== backgroundRequest) {
    URL.revokeObjectURL(url);
    return;
  }
  if (backgroundURL) URL.revokeObjectURL(backgroundURL);
  backgroundURL = url;
  document.body.style.setProperty("--custom-bg", 'url("' + url + '")');
  document.body.classList.add("custom-background");
  $("#background-status").textContent =
    "Фон установлен до закрытия страницы. Выбранная тема сохраняется.";
});
$("#background-reset").addEventListener("click", () => {
  backgroundRequest++;
  document.body.style.removeProperty("--custom-bg");
  document.body.classList.remove("custom-background");
  if (backgroundURL) URL.revokeObjectURL(backgroundURL);
  backgroundURL = undefined;
  $("#background-upload").value = "";
  $("#background-status").textContent = "Фон сброшен.";
});
document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.closest(".art-slot")) {
      image.closest(".art-slot").classList.add("image-failed");
      image.remove();
      return;
    }
    if (image.closest(".hero-logo")) {
      const box = image.closest(".hero-logo");
      box.classList.add("logo-failed");
      box.textContent = image.alt.replace(/^Лого\s*/, "").trim()[0] || "✧";
      return;
    }
    if (image.closest(".item-icon")) {
      const box = image.closest(".item-icon");
      box.classList.add("image-failed");
      image.remove();
      return;
    }
    if (image.closest(".item-modal-icon-frame")) {
      const box = image.closest(".item-modal-icon-frame");
      const fallback = box.querySelector(".item-icon-fallback");
      box.classList.add("image-failed");
      image.hidden = true;
      if (fallback) fallback.hidden = false;
      return;
    }
    image.hidden = true;
  },
  true,
);
updateScroll();
