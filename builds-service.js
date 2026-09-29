"use strict";
let buildsCache = null;
async function loadBuilds() {
  if (!buildsCache) {
    buildsCache = fetch('/data/builds-data.json').then(async (response) => {
      if (!response.ok) throw new Error('Builds unavailable');
      const data = await response.json();
      if (!data || typeof data.heroes !== 'object' || !data.heroes) throw new Error('Invalid builds');
      return data;
    }).catch((error) => { buildsCache = null; throw error; });
  }
  return buildsCache;
}
async function getHeroBuild(heroKey) {
  return (await loadBuilds()).heroes[heroKey] || null;
}

document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.createElement('dialog');
  dialog.className = 'item-dialog build-dialog';
  dialog.setAttribute('aria-labelledby', 'build-title');
  dialog.innerHTML = '<div class="item-dialog-inner"><div class="item-dialog-header"><div><p class="eyebrow">СБОРКА / OPENDOTA</p><h2 id="build-title"></h2></div><button class="dialog-close" type="button" aria-label="Закрыть сборку">×</button></div><div id="hero-build-tab" role="status" aria-live="polite"></div></div>';
  document.body.append(dialog);
  let request = 0;
  let trigger;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { request++; trigger?.focus(); });
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-build-hero]');
    if (!button) return;
    trigger = button;
    const current = ++request;
    const heroKey = button.dataset.buildHero;
    dialog.querySelector('h2').textContent = window.HEROES?.find((hero) => hero.key === heroKey)?.name || heroKey;
    const container = dialog.querySelector('#hero-build-tab');
    container.textContent = 'Загрузка сборки…';
    dialog.showModal();
    try {
      const data = await loadBuilds();
      if (current !== request) return;
      const build = data.heroes[heroKey];
      if (!build) { container.textContent = 'Сборка пока недоступна. Статическая база ещё не обновлена.'; return; }
      container.replaceChildren();
      const meta = document.createElement('p');
      meta.className = 'build-meta';
      meta.textContent = `Патч: ${data.patch || 'не указан'} · Обновлено: ${data.updated_at || 'не указано'} · OpenDota`;
      container.append(meta);
      for (const [key, title] of [['start_items', 'Стартовые предметы'], ['core_items', 'Основные предметы'], ['situational_items', 'Ситуативные предметы']]) {
        const section = document.createElement('section');
        const heading = document.createElement('h3');
        heading.textContent = title;
        const row = document.createElement('div');
        row.className = 'build-items';
        for (const entry of build[key] || []) {
          const item = (window.ITEMS || []).find((item) => item.key.replace(/^item_/, '').replace(/_\d+$/, '') === entry.item || String(item.id) === String(entry.item));
          const figure = document.createElement('figure');
          figure.title = `${item?.name || entry.item} · ${Number(entry.count).toLocaleString('ru-RU')} покупок`;
          if (item?.image && /^https:\/\//.test(item.image)) {
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.name;
            image.width = 56;
            image.height = 42;
            figure.append(image);
          }
          const caption = document.createElement('figcaption');
          caption.textContent = item?.name || entry.item;
          figure.append(caption);
          row.append(figure);
        }
        if (!row.children.length) row.textContent = 'Нет данных для этого этапа.';
        section.append(heading, row);
        container.append(section);
      }
      const note = document.createElement('p');
      note.className = 'build-meta';
      note.textContent = 'Популярность покупок, а не персональная рекомендация. Данные могут охватывать несколько патчей и ролей.';
      container.append(note);
    } catch {
      if (current === request) container.textContent = 'Не удалось загрузить сборки. Закройте окно и попробуйте снова.';
    }
  });
});
