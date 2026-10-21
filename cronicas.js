/* Crónicas publicadas: lectura independiente del Worker de resultados. */
(() => {
  'use strict';
  const SEASON = 1;
  const INDEX_URL = window.CAMPEONES_CRONICAS_URL || './cronicas/index.json';
  let published = new Map();
  let pending = null;
  let lastAttempt = 0;
  let dialog;
  let returnFocus = null;

  function normalizeIndex(payload) {
    if (payload?.schemaVersion !== 1 || !Array.isArray(payload.chronicles)) {
      throw new Error('Índice de crónicas incompatible');
    }
    const entries = new Map();
    const duplicates = new Set();
    for (const item of payload.chronicles) {
      if (!item || item.status !== 'published' || item.season !== SEASON) continue;
      const id = String(item.tableId ?? '');
      if (!/^\d+$/.test(id)) continue;
      const paragraphs = Array.isArray(item.paragraphs)
        ? item.paragraphs.filter(p => typeof p === 'string').map(p => p.trim()).filter(Boolean)
        : [];
      if (!paragraphs.length || paragraphs.length !== item.paragraphs.length) continue;
      if (entries.has(id)) duplicates.add(id);
      entries.set(id, {
        tableId: id, season: SEASON,
        title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Crónica del partido',
        division: Number.isInteger(item.division) ? item.division : null,
        round: Number.isInteger(item.round) ? item.round : null,
        paragraphs
      });
    }
    // Un índice ambiguo no debe abrir una crónica equivocada.
    for (const id of duplicates) entries.delete(id);
    return entries;
  }

  function forMatch(match, division) {
    if (match?.status !== 'finished' || !match.tableId) return null;
    const item = published.get(String(match.tableId));
    if (!item || (item.division !== null && item.division !== Number(division))) return null;
    if (item.round !== null && item.round !== Number(match.step)) return null;
    return item;
  }

  async function refresh(force = false) {
    if (pending) return pending;
    if (!force && Date.now() - lastAttempt < 60000) return;
    lastAttempt = Date.now();
    pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(INDEX_URL, {cache:'no-store', signal:controller.signal});
        if (!response.ok) throw new Error(`Crónicas: HTTP ${response.status}`);
        const next = normalizeIndex(await response.json());
        published = next;
        document.dispatchEvent(new CustomEvent('cronicas:updated'));
      } catch (error) {
        // Un fallo del índice no impide consultar el campeonato ni BGA.
        console.warn('No se pudo actualizar el índice de crónicas', error);
      } finally {
        clearTimeout(timeout);
        pending = null;
      }
    })();
    return pending;
  }

  function open(tableId, trigger = null) {
    const item = published.get(String(tableId));
    if (!item || !dialog) return false;
    returnFocus = trigger || document.activeElement;
    dialog.querySelector('#chronicleTitle').textContent = item.title;
    const details = [];
    if (item.division !== null) details.push(`${item.division}ª División`);
    details.push(`temporada ${item.season}`);
    if (item.round !== null) details.push(`Jornada ${item.round}`);
    dialog.querySelector('#chronicleContext').textContent = details.join(' · ');
    const body = dialog.querySelector('#chronicleBody');
    body.replaceChildren(...item.paragraphs.map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('#closeChronicle').focus();
    return true;
  }

  function init() {
    dialog = document.querySelector('#chronicleDialog');
    document.querySelector('#closeChronicle').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
      returnFocus = null;
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest?.('[data-cronica]');
      if (!trigger || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (open(trigger.dataset.cronica, trigger)) event.preventDefault();
    });
    const fromHash = () => {
      const id = /^#cronica-(\d+)$/.exec(location.hash)?.[1];
      if (id) open(id);
    };
    document.addEventListener('cronicas:updated', fromHash);
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('focus', () => refresh());
    refresh();
  }

  window.CampeonesCronicas = Object.freeze({forMatch, refresh, init, open, season:SEASON});
})();
