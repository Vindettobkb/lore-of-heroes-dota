"use strict";

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
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

function note(text, side) {
  return text ? `<div class="side-note">${escapeHTML(text)}</div>` : "";
}

const attributes = ["СИЛА", "ЛОВКОСТЬ", "ИНТЕЛЛЕКТ", "УНИВЕРСАЛЬНЫЙ"];
const heroes = [...(window.HEROES || [])].sort((a, b) =>
  a.name.localeCompare(b.name, "en"),
);
let heroEntries = [];
let heroAlphabet;

function renderHero(hero, index) {
  const lore = String(hero.lore || "")
    .split(/<br\s*\/?>(?:\s*<br\s*\/?>)?/i)
    .map(plainText)
    .filter(Boolean)
    .map((text) => `<p>${escapeHTML(text)}</p>`);
  const artSide = index % 2 === 0 ? "слева" : "справа";
  const textSide = index % 2 === 0 ? "справа" : "слева";
  const abilities = Array.isArray(hero.abilities) ? hero.abilities : [];
  return `<article id="hero-${escapeHTML(hero.key)}" class="hero-entry transition-all duration-700 motion-reduce:transition-none" data-name="${escapeHTML(hero.name.toLowerCase())}" data-letter="${escapeHTML(hero.name[0])}" aria-labelledby="name-${escapeHTML(hero.key)}">
    <div class="chapter"><span>${String(index + 1).padStart(3, "0")}</span><span>${attributes[hero.attribute] || "ГЕРОЙ"} / ${escapeHTML(hero.name[0])}</span></div>
    <div class="hero-layout"><div class="hero-art"><div class="art-slot"><span class="art-monogram" aria-hidden="true">${escapeHTML(hero.name[0])}</span>${hero.image ? `<img src="${safeImage(hero.image)}" alt="${escapeHTML(hero.name)}" loading="lazy">` : ""}<div class="art-caption"><b>${escapeHTML(hero.name)}</b>${hero.image ? "ИЛЛЮСТРАЦИЯ ГЕРОЯ" : "МЕСТО ДЛЯ ИЗОБРАЖЕНИЯ ГЕРОЯ"}</div></div>${note(artSide === "слева" ? hero.leftText : hero.rightText, artSide)}</div>
    <div class="hero-story"><div class="hero-title-row"><span class="hero-logo">${hero.logo ? `<img src="${safeImage(hero.logo)}" alt="Лого ${escapeHTML(hero.name)}" loading="lazy">` : "ЛОГО<br>ГЕРОЯ"}</span><h3 class="hero-name" id="name-${escapeHTML(hero.key)}">${escapeHTML(hero.name)}</h3></div><p class="hero-intro">${escapeHTML(plainText(hero.intro))}</p><p class="lore-label">ИСТОРИЯ ГЕРОЯ</p><div class="lore">${lore[0] || ""}${lore.length > 1 ? `<details class="lore-more"><summary>Читать полную историю</summary>${lore.slice(1).join("")}</details>` : ""}</div><div class="abilities-heading"><span>СПОСОБНОСТИ</span><span>НАЖМИТЕ НА ИКОНКУ ↙</span></div><div class="abilities">${abilities.map((ability) => `<details class="ability"><summary aria-label="${escapeHTML(ability.name)}" title="${escapeHTML(ability.name)}"><img src="${safeImage(ability.icon)}" alt="${escapeHTML(ability.name)}" loading="lazy" width="50" height="50"><span class="ability-name">${escapeHTML(ability.name)}</span></summary><p>${escapeHTML(plainText(ability.description))}</p></details>`).join("")}</div>${note(textSide === "слева" ? hero.leftText : hero.rightText, textSide)}</div></div></article>`;
}

function initHeroes() {
  const heroRoot = $("#heroes");
  if (!heroRoot) return;
  heroRoot.innerHTML = heroes.map(renderHero).join("");
  document.querySelectorAll("[data-total]").forEach((element) => {
    element.textContent = heroes.length;
  });

  heroEntries = [...document.querySelectorAll(".hero-entry")];
  heroAlphabet = $("#alphabet");
  heroAlphabet.innerHTML = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
    .map(
      (letter) =>
        `<button type="button" data-letter="${letter}" aria-label="Герои на ${letter}">${letter}</button>`,
    )
    .join("");

  function filterHeroes() {
    const query = $("#hero-search").value.trim().toLowerCase();
    heroEntries.forEach((entry) => {
      entry.hidden = !entry.dataset.name.includes(query);
    });
    const visible = heroEntries.filter((entry) => !entry.hidden);
    $("#result-count").textContent = `${visible.length} из ${heroes.length} героев`;
    $("#empty-state").hidden = visible.length > 0;
    $("#clear-search").hidden = !query;
    heroAlphabet.querySelectorAll("button").forEach((button) => {
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
  heroAlphabet.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const entry = heroEntries.find(
      (candidate) =>
        !candidate.hidden && candidate.dataset.letter === button.dataset.letter,
    );
    if (entry) entry.scrollIntoView();
  });
  filterHeroes();
}

function formatItemCost(cost) {
  return typeof cost === "number" && cost > 0
    ? `${new Intl.NumberFormat("ru-RU").format(cost)} золота`
    : String(cost || "Стоимость неизвестна");
}

const ITEM_PARAMETER_LABELS = Object.freeze({
  all: "ко всем атрибутам",
  agi: "к ловкости",
  str: "к силе",
  int: "к интеллекту",
  health: "к здоровью",
  hp: "к здоровью",
  mana: "к мане",
  damage: "к урону",
  armor: "к броне",
  attack: "к скорости атаки",
  attack_speed: "к скорости атаки",
  hp_regen: "к восстановлению здоровья",
  health_regen: "к восстановлению здоровья",
  mana_regen: "к восстановлению маны",
  move_speed: "к скорости передвижения",
  movespeed: "к скорости передвижения",
  bonus_movement_speed: "к скорости передвижения",
  spell_resist: "к сопротивлению магии",
  magic_resist: "к сопротивлению магии",
  magic_resistance: "к сопротивлению магии",
  bonus_magic_resistance: "к сопротивлению магии",
  spell_amp: "к урону от заклинаний",
  bonus_spell_amp: "к урону от заклинаний",
  lifesteal: "к вампиризму",
  evasion: "к уклонению",
  cast_range: "к дальности применения",
  attack_range: "к дальности атаки",
  status_resist: "к сопротивлению эффектам",
  status_resistance: "к сопротивлению эффектам",
  cooldown_reduction: "к сокращению перезарядки",
  manacost_reduction: "к сокращению расхода маны",
  bonus_health: "к максимальному здоровью",
  bonus_mana: "к максимальной мане",
  radius: "Радиус",
  active_radius: "Радиус применения",
  abilitycastrange: "Дальность применения",
  abilitycastpoint: "Задержка применения",
  abilitycooldown: "Перезарядка",
  abilitychanneltime: "Время применения",
  abilitymanacost: "Расход маны",
  abilityhealthcost: "Расход здоровья",
  abilitycharges: "Заряды",
  abilitychargerestoretime: "Восстановление зарядов",
  abilityduration: "Длительность",
  blink_range: "Дальность перемещения",
  blink_range_clamp: "Максимальная дальность перемещения",
  tree_duration: "Длительность дерева",
  bonus_chance: "Шанс срабатывания",
  bonus_chance_damage: "Дополнительный магический урон",
  damage_bonus: "Бонус к урону",
  damage_bonus_ranged: "Бонус к урону дальнего боя",
  quelling_range_tooltip: "Дальность применения",
  health_restore: "Восстановление здоровья",
  mana_restore: "Восстановление маны",
  restore_per_charge: "Восстановление за заряд",
  max_charges: "Максимум зарядов",
  charge_radius: "Радиус получения зарядов",
  extra_spell_damage_percent: "Дополнительный магический урон",
  duration: "Длительность",
  bonus_magical_armor: "Сопротивление магии",
});

const ITEM_PARAMETER_ALIASES = Object.freeze({
  bonus_stat: ["selected_attrib"],
  bonus_health_regen: ["hp_regen", "health_regen"],
  scan_cooldown_reduction: ["ускорение перезарядки сканирования"],
});

const MISSING_PARAMETER_LABELS = Object.freeze({
  customval_team_tomes_used: "количество предыдущих применений",
});

const ITEM_CATEGORY_META = Object.freeze({
  "basic-consumables": { id: "basic-consumables", section: "Основные", label: "Расходники" },
  "basic-attributes": { id: "basic-attributes", section: "Основные", label: "Атрибуты" },
  "basic-equipment": { id: "basic-equipment", section: "Основные", label: "Снаряжение" },
  "basic-misc": { id: "basic-misc", section: "Основные", label: "Разное" },
  "basic-secret-shop": { id: "basic-secret-shop", section: "Основные", label: "Потайная лавка" },
  "upgrade-accessories": { id: "upgrade-accessories", section: "Улучшения", label: "Аксессуары" },
  "upgrade-support": { id: "upgrade-support", section: "Улучшения", label: "Поддержка" },
  "upgrade-magic": { id: "upgrade-magic", section: "Улучшения", label: "Магия" },
  "upgrade-armor": { id: "upgrade-armor", section: "Улучшения", label: "Броня" },
  "upgrade-weapons": { id: "upgrade-weapons", section: "Улучшения", label: "Оружие" },
  "upgrade-artifacts": { id: "upgrade-artifacts", section: "Улучшения", label: "Вооружение" },
});

const ITEM_CATEGORY_ORDER = Object.freeze([
  "basic-consumables",
  "basic-attributes",
  "basic-equipment",
  "basic-misc",
  "basic-secret-shop",
  "upgrade-accessories",
  "upgrade-support",
  "upgrade-magic",
  "upgrade-armor",
  "upgrade-weapons",
  "upgrade-artifacts",
  "tier-1",
  "tier-2",
  "tier-3",
  "tier-4",
  "tier-5",
]);

const BASIC_ATTRIBUTE_KEYS = new Set([
  "item_gauntlets_13",
  "item_slippers_14",
  "item_mantle_15",
  "item_belt_of_strength_17",
  "item_boots_of_elves_18",
  "item_robe_19",
  "item_circlet_20",
  "item_ogre_axe_21",
  "item_blade_of_alacrity_22",
  "item_staff_of_wizardry_23",
  "item_ultimate_orb_24",
  "item_crown_261",
  "item_diadem_1122",
]);

const BASIC_SECRET_SHOP_KEYS = new Set([
  "item_eagle_52",
  "item_reaver_53",
  "item_relic_54",
  "item_hyperstone_55",
  "item_ring_of_health_56",
  "item_void_stone_57",
  "item_mystic_staff_58",
  "item_energy_booster_59",
  "item_point_booster_60",
  "item_vitality_booster_61",
  "item_oblivion_staff_67",
  "item_blitz_knuckles_485",
  "item_cornucopia_1125",
]);

const BASIC_MISC_KEYS = new Set([
  "item_blink_1",
  "item_quelling_blade_11",
  "item_branches_16",
  "item_gem_30",
  "item_cheese_33",
  "item_magic_stick_34",
]);

const SUPPORT_KEYS = new Set([
  "item_magic_wand_36",
  "item_mekansm_79",
  "item_vladmir_81",
  "item_buckler_86",
  "item_ring_of_basilius_88",
  "item_pipe_90",
  "item_urn_of_shadows_92",
  "item_headdress_94",
  "item_medallion_of_courage_187",
  "item_wraith_pact_908",
  "item_pavise_1126",
]);

const ARTIFACT_KEYS = new Set([
  "item_black_king_bar_116",
  "item_aegis_117",
  "item_monkey_king_bar_135",
  "item_radiance_137",
  "item_manta_147",
  "item_heavens_halberd_210",
  "item_ring_of_aquila_212",
  "item_witch_blade_567",
  "item_revenants_brooch_911",
]);

function normalizeParameterKey(key) {
  return String(key ?? "")
    .trim()
    .replace(/:+$/, "")
    .replace(/^\+/, "")
    .replace(/^\$/, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ru");
}

function parseItemParameters(rawParameters) {
  const entries = [];
  if (rawParameters && typeof rawParameters === "object" && !Array.isArray(rawParameters)) {
    Object.entries(rawParameters).forEach(([key, value]) =>
      entries.push({ key: String(key), value: String(value ?? "").trim() }),
    );
  } else {
    String(rawParameters ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const separator = line.indexOf(":");
        if (separator < 0) {
          entries.push({ raw: line });
          return;
        }
        entries.push({
          key: line.slice(0, separator).trim(),
          value: line.slice(separator + 1).replace(/^:\s*/, "").trim(),
        });
      });
  }

  const values = Object.create(null);
  entries.forEach((entry) => {
    if (!entry.key) return;
    const key = normalizeParameterKey(entry.key);
    if (key) values[key] = entry.value;
  });
  return { entries, values };
}

function parameterCandidates(key) {
  const normalized = normalizeParameterKey(key);
  const canonical = Object.keys(ITEM_PARAMETER_ALIASES).find(
    (candidate) =>
      candidate === normalized || ITEM_PARAMETER_ALIASES[candidate].includes(normalized),
  );
  return [
    normalized,
    ...(canonical ? [canonical, ...ITEM_PARAMETER_ALIASES[canonical]] : []),
  ];
}

function parameterValue(parameterData, key) {
  return parameterCandidates(key)
    .map((candidate) => parameterData.values[candidate])
    .find((value) => value !== undefined);
}

function parametersMatch(left, right) {
  const rightCandidates = new Set(parameterCandidates(right));
  return parameterCandidates(left).some((candidate) => rightCandidates.has(candidate));
}

function referencedParameterKeys(description) {
  return new Set(
    [...String(description ?? "").matchAll(/%([a-z0-9_.-]+)%+/gi)].map((match) =>
      normalizeParameterKey(match[1]),
    ),
  );
}

function formatValveDescription(description, parameterData) {
  const parsed = parameterData?.values ? parameterData : parseItemParameters(parameterData);
  return String(description ?? "").replace(
    /%([a-z0-9_.-]+)(%{1,3})/gi,
    (placeholder, key, closingPercentSigns) => {
      const value = parameterValue(parsed, key);
      if (value === undefined) {
        return `${MISSING_PARAMETER_LABELS[normalizeParameterKey(key)] || "значение не указано"}${closingPercentSigns.length > 1 ? "%" : ""}`;
      }
      const percentSuffix = closingPercentSigns.length > 1 && !String(value).endsWith("%") ? "%" : "";
      return `${value}${percentSuffix}`;
    },
  );
}

function capitalize(value) {
  return value ? `${value[0].toLocaleUpperCase("ru")}${value.slice(1)}` : value;
}

function formatItemParameter(entry) {
  if (!entry.key) return String(entry.raw || "").replace(/\$/g, "");
  const cleanKey = entry.key.replace(/\$/g, "").trim();
  const normalizedKey = normalizeParameterKey(entry.key);
  const label = ITEM_PARAMETER_LABELS[normalizedKey];
  const value = String(entry.value ?? "").trim();
  if (label && cleanKey.startsWith("+")) return `+${value} ${label}`;
  if (label) return `${capitalize(label)}: ${value}`;
  return `${cleanKey}: ${value}`;
}

function formatItemParameters(rawParameters, effect) {
  const parsed = rawParameters?.entries ? rawParameters : parseItemParameters(rawParameters);
  const referenced = referencedParameterKeys(effect);
  const formatted = parsed.entries
    .filter((entry) => {
      if (!entry.key) return true;
      const normalizedKey = normalizeParameterKey(entry.key);
      if ([...referenced].some((key) => parametersMatch(normalizedKey, key))) return false;
      if (ITEM_PARAMETER_LABELS[normalizedKey]) return true;
      return /[^a-z0-9_.-]/i.test(entry.key.replace(/^\+?\$/, ""));
    })
    .map(formatItemParameter)
    .filter(Boolean);
  return formatted.length ? formatted.join("\n") : "Дополнительные характеристики не указаны.";
}

function getItemCatalogCategory(item) {
  if (item.category === "нейтральные" || item.tier) {
    return {
      id: `tier-${item.tier}`,
      section: "Нейтральные",
      label: `Разряд ${item.tier}`,
    };
  }

  if (item.group === "расходники") return ITEM_CATEGORY_META["basic-consumables"];
  if (BASIC_ATTRIBUTE_KEYS.has(item.key)) return ITEM_CATEGORY_META["basic-attributes"];
  if (BASIC_SECRET_SHOP_KEYS.has(item.key)) return ITEM_CATEGORY_META["basic-secret-shop"];
  if (BASIC_MISC_KEYS.has(item.key)) return ITEM_CATEGORY_META["basic-misc"];
  if (item.group === "магия") return ITEM_CATEGORY_META["upgrade-magic"];
  if (item.group === "защита") return ITEM_CATEGORY_META["upgrade-armor"];
  if (item.group === "атака") {
    return ARTIFACT_KEYS.has(item.key)
      ? ITEM_CATEGORY_META["upgrade-artifacts"]
      : ITEM_CATEGORY_META["upgrade-weapons"];
  }
  if (SUPPORT_KEYS.has(item.key)) return ITEM_CATEGORY_META["upgrade-support"];
  if (ARTIFACT_KEYS.has(item.key)) return ITEM_CATEGORY_META["upgrade-artifacts"];
  if (item.group === "компоненты") return ITEM_CATEGORY_META["basic-equipment"];
  return ITEM_CATEGORY_META["upgrade-accessories"];
}

function itemIconMarkup(item, large = false) {
  const initial = escapeHTML(item.name?.charAt(0) || "✧");
  const hasImage = Boolean(item.image && safeImage(item.image));
  return `<span class="item-icon-frame${hasImage ? "" : " image-failed"}"><span class="item-icon-fallback" aria-hidden="true">${initial}</span><span class="item-image-status">ИЗОБРАЖЕНИЕ<br>НЕДОСТУПНО</span>${hasImage ? `<img src="${safeImage(item.image)}" alt="${escapeHTML(item.name)}" loading="lazy" decoding="async"${large ? ' width="300" height="300"' : ' width="76" height="76"'}>` : ""}</span>`;
}

function initItems() {
  const itemGrid = $("#item-grid");
  if (!itemGrid) return;
  const items = [...(window.ITEMS || [])].map((item) => ({
    ...item,
    catalogCategory: getItemCatalogCategory(item),
  })).sort((a, b) => {
    const categoryDifference =
      ITEM_CATEGORY_ORDER.indexOf(a.catalogCategory.id) -
      ITEM_CATEGORY_ORDER.indexOf(b.catalogCategory.id);
    return categoryDifference || a.name.localeCompare(b.name, "en");
  });
  const itemSearch = $("#item-search");
  const itemCount = $("#item-count");
  const itemEmptyState = $("#item-empty-state");
  const itemFilters = $("#item-filters");
  const clearItemSearch = $("#clear-item-search");
  const itemDialog = $("#item-dialog");
  let selectedItemFilter = "all";
  let lastItemTrigger;

  function renderItem(item, index) {
    const tier = item.tier ? `Разряд ${item.tier}` : "";
    return `<button class="item-card" type="button" data-item-key="${escapeHTML(item.key)}" data-item-category="${escapeHTML(item.catalogCategory.id)}" aria-label="Открыть подробности: ${escapeHTML(item.name)}"><span class="item-card-index">${String(index + 1).padStart(3, "0")}</span>${itemIconMarkup(item)}<span class="item-card-kind">${escapeHTML(item.kind)}</span><span class="item-card-name">${escapeHTML(item.name)}</span><span class="item-card-meta"><span>${escapeHTML(item.catalogCategory.label)}</span><span>${escapeHTML(tier || formatItemCost(item.cost))}</span></span></button>`;
  }

  let previousCategory;
  itemGrid.innerHTML = items
    .map((item, index) => {
      const category = item.catalogCategory;
      const heading = category.id === previousCategory
        ? ""
        : `<div class="item-category-divider" data-item-category-heading="${escapeHTML(category.id)}"><span>${escapeHTML(category.section)}</span><strong>${escapeHTML(category.label)}</strong></div>`;
      previousCategory = category.id;
      return `${heading}${renderItem(item, index)}`;
    })
    .join("");
  const itemCards = [...itemGrid.querySelectorAll(".item-card")];
  const itemCategoryHeadings = [
    ...itemGrid.querySelectorAll("[data-item-category-heading]"),
  ];

  function filterItems() {
    const query = itemSearch.value.trim().toLocaleLowerCase("ru");
    let visible = 0;
    itemCards.forEach((card) => {
      const item = items.find((entry) => entry.key === card.dataset.itemKey);
      const haystack = [
        item?.name,
        item?.category,
        item?.kind,
        item?.group,
        item?.tier,
        item?.catalogCategory?.section,
        item?.catalogCategory?.label,
        item?.effect,
        item?.parameters,
        item?.lore,
      ]
        .join(" ")
        .toLocaleLowerCase("ru");
      const filterMatches =
        selectedItemFilter === "all" ||
        item?.category === selectedItemFilter ||
        item?.catalogCategory?.id === selectedItemFilter ||
        (selectedItemFilter.startsWith("tier-") &&
          item?.tier === Number(selectedItemFilter.slice(5)));
      const matches = (!query || haystack.includes(query)) && filterMatches;
      card.hidden = !matches;
      if (matches) visible++;
    });
    itemCategoryHeadings.forEach((heading) => {
      heading.hidden = !itemCards.some(
        (card) =>
          !card.hidden && card.dataset.itemCategory === heading.dataset.itemCategoryHeading,
      );
    });
    itemCount.textContent = `${visible} из ${items.length} предметов`;
    itemEmptyState.hidden = visible > 0;
    clearItemSearch.hidden = !query;
  }

  function openItemDetails(item) {
    const parameterData = parseItemParameters(item.parameters);
    $("#item-dialog-icon").innerHTML = itemIconMarkup(item, true);
    $("#item-dialog-kind").textContent = item.kind;
    $("#item-dialog-category").textContent = `${item.catalogCategory.section} · ${item.catalogCategory.label}`.toUpperCase();
    $("#item-dialog-title").textContent = item.name;
    $("#item-dialog-cost").textContent = item.tier
      ? `Разряд ${item.tier} · Нейтральный предмет`
      : formatItemCost(item.cost);
    $("#item-dialog-effect").textContent = formatValveDescription(item.effect, parameterData);
    $("#item-dialog-parameters").textContent = formatItemParameters(parameterData, item.effect);
    $("#item-dialog-lore").textContent = plainText(item.lore);
    itemDialog.showModal();
  }

  itemSearch.addEventListener("input", filterItems);
  clearItemSearch.addEventListener("click", () => {
    itemSearch.value = "";
    filterItems();
    itemSearch.focus();
  });
  itemFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-item-filter]");
    if (!button) return;
    selectedItemFilter = button.dataset.itemFilter;
    itemFilters.querySelectorAll("button").forEach((filter) => {
      filter.setAttribute(
        "aria-pressed",
        String(filter.dataset.itemFilter === selectedItemFilter),
      );
    });
    filterItems();
  });
  itemGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".item-card");
    if (!card) return;
    const item = items.find((entry) => entry.key === card.dataset.itemKey);
    if (!item) return;
    lastItemTrigger = card;
    openItemDetails(item);
  });
  $("#item-dialog-close").addEventListener("click", () => itemDialog.close());
  itemDialog.addEventListener("click", (event) => {
    if (event.target === itemDialog) itemDialog.close();
  });
  itemDialog.addEventListener("close", () => {
    if (lastItemTrigger && document.contains(lastItemTrigger)) lastItemTrigger.focus();
    lastItemTrigger = undefined;
  });
  filterItems();
}

initHeroes();
initItems();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (observations) =>
      observations.forEach((observation) => {
        if (observation.isIntersecting) {
          observation.target.classList.remove("reveal-pending");
          observer.unobserve(observation.target);
        }
      }),
    { rootMargin: "100px" },
  );
  heroEntries.forEach((entry) => {
    entry.classList.add("reveal-pending");
    observer.observe(entry);
  });
}

let scheduled = false;
function updateScroll() {
  scheduled = false;
  const progress = $(".reading-progress");
  if (progress) {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }
  if (!heroAlphabet || !heroEntries.length) return;
  const current = heroEntries.find(
    (entry) => !entry.hidden && entry.getBoundingClientRect().bottom > 120,
  );
  heroAlphabet.querySelectorAll("button").forEach((button) => {
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
  const settings = $("#settings");
  const toggle = $("#settings-toggle");
  if (!settings || !toggle) return;
  settings.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
}

$("#settings-toggle")?.addEventListener("click", () =>
  setSettings($("#settings").hidden),
);
$("#settings-close")?.addEventListener("click", () => {
  setSettings(false);
  $("#settings-toggle")?.focus();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest("#settings, #settings-toggle")) setSettings(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("#settings") && !$("#settings").hidden) {
    setSettings(false);
    $("#settings-toggle")?.focus();
  }
  if (
    event.key === "/" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
    !document.activeElement.isContentEditable
  ) {
    event.preventDefault();
    $("#hero-search")?.focus() || $("#item-search")?.focus();
  }
});

function setTheme(theme) {
  if (!["forest", "ember", "void"].includes(theme)) theme = "forest";
  document.body.dataset.theme = theme;
  document.querySelectorAll("[data-theme-choice]").forEach((button) =>
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

document.querySelectorAll("[data-theme-choice]").forEach((button) =>
  button.addEventListener("click", () => setTheme(button.dataset.themeChoice)),
);
try {
  setTheme(localStorage.getItem("ancients-theme") || "forest");
} catch {
  setTheme("forest");
}

let backgroundURL;
let backgroundRequest = 0;
$("#background-upload")?.addEventListener("change", async (event) => {
  const request = ++backgroundRequest;
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
    $("#background-status").textContent = "Выберите изображение размером до 15 МБ.";
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
      $("#background-status").textContent = "Не удалось открыть изображение. Попробуйте PNG, JPG или WebP.";
    return;
  }
  if (request !== backgroundRequest) {
    URL.revokeObjectURL(url);
    return;
  }
  if (backgroundURL) URL.revokeObjectURL(backgroundURL);
  backgroundURL = url;
  document.body.style.setProperty("--custom-bg", `url("${url}")`);
  document.body.classList.add("custom-background");
  $("#background-status").textContent = "Фон установлен до закрытия страницы. Выбранная тема сохраняется.";
});

$("#background-reset")?.addEventListener("click", () => {
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
    if (image.closest(".item-icon-frame")) {
      image.closest(".item-icon-frame").classList.add("image-failed");
      image.hidden = true;
      return;
    }
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
    image.hidden = true;
  },
  true,
);

updateScroll();
