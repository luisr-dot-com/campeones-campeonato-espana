(() => {
  "use strict";

  const INDEX_URL = "temporadas/index.json";
  let catalog = {currentSeason:1, seasons:[{id:1, status:"current", label:"Temporada 1"}]};
  let selected = 1;
  let historyCompetition = "league";
  let historyDivision = 1;
  const archives = new Map();

  const esc = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  function currentSeason() {
    return Number(catalog.currentSeason || 1);
  }

  function selectedSeason() {
    return selected;
  }

  function isArchiveSelected() {
    return selected !== currentSeason() && archives.has(selected);
  }

  function selectedArchive() {
    return archives.get(selected) || null;
  }

  function renderSelector() {
    const select = document.querySelector("#seasonSelect");
    if (!select) return;
    const seasons = [...(catalog.seasons || [])]
      .filter(season => Number(season.id) !== currentSeason() && season.status !== "current")
      .sort((a,b) => Number(b.id) - Number(a.id));
    select.innerHTML = seasons.map(season => {
      const id = Number(season.id);
      return `<option value="${id}" ${id === selected ? "selected" : ""}>Temporada ${id}</option>`;
    }).join("");
  }

  async function loadArchive(season) {
    if (archives.has(season)) return archives.get(season);
    const response = await fetch(`temporadas/temporada-${season}.json`, {cache:"no-store"});
    if (!response.ok) throw new Error(`No se pudo cargar la temporada ${season}`);
    const data = await response.json();
    archives.set(season, data);
    return data;
  }

  async function selectSeason(season) {
    const requested = Number(season);
    if (!Number.isFinite(requested) || requested === currentSeason()) return;
    const select = document.querySelector("#seasonSelect");
    if (select) select.disabled = true;
    try {
      if (requested !== currentSeason()) await loadArchive(requested);
      selected = requested;
      renderSelector();
      document.dispatchEvent(new CustomEvent("campeones:seasonchange", {detail:{season:selected, archived:isArchiveSelected()}}));
      renderHistory(historyCompetition);
    } catch (error) {
      console.warn("No se pudo abrir la temporada archivada", error);
      renderSelector();
    } finally {
      if (select) select.disabled = false;
    }
  }

  function archiveDivision(division) {
    const archive = selectedArchive();
    return archive?.league?.divisions?.[String(division)] || archive?.league?.divisions?.[division] || null;
  }

  function renderLeagueStandings(division) {
    const body = document.querySelector("#historyStandingsTable tbody");
    if (!body) return;
    const data = archiveDivision(division);
    const rows = data?.standings || [];
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="10" class="archive-empty">Clasificación histórica no disponible.</td></tr>`;
      return;
    }
    const lastDivision = 6;
    body.innerHTML = rows.map((p,i) => {
      const promoted = Number(division) === 1 ? i === 0 : i < 2;
      const relegated = Number(division) < lastDivision && i >= rows.length - 2;
      const dg = Number.isFinite(Number(p.dg)) ? Number(p.dg) : Number(p.gf || 0) - Number(p.gc || 0);
      return `<tr class="${promoted ? "promoted" : relegated ? "relegated" : ""}">
        <td class="position">${p.position || i+1}</td>
        <td class="player-name"><div class="standings-team"><span>${esc(p.team)}</span><span class="standings-player">${esc(p.player)}</span></div></td>
        <td>${p.pj ?? "—"}</td><td>${p.pg ?? "—"}</td><td>${p.pe ?? "—"}</td><td>${p.pp ?? "—"}</td>
        <td>${p.gf ?? "—"}</td><td>${p.gc ?? "—"}</td><td>${dg}</td><td class="points">${p.pts ?? "—"}</td>
      </tr>`;
    }).join("");
  }

  function archivedScore(game) {
    const score = `${game.homeScore ?? "—"} <span>–</span> ${game.awayScore ?? "—"}`;
    if (!game.chronicleId) return score;
    return `<a class="match-score-link chronicle-score-link" href="#cronica-${esc(game.chronicleId)}" data-cronica="${esc(game.chronicleId)}" title="Leer crónica del partido">${score}</a>`;
  }

  function renderLeagueCalendar(division) {
    const host = document.querySelector("#historyCalendarRounds");
    if (!host) return;
    const data = archiveDivision(division);
    const rounds = data?.rounds || [];
    if (!rounds.length) {
      host.innerHTML = `<div class="archive-empty">Calendario histórico no disponible.</div>`;
      return;
    }
    host.innerHTML = rounds.map((round,index) => `<section class="calendar-round round-generated">
      <h3>Jornada ${round.number || index+1}</h3>
      <div class="calendar-games">${(round.games || []).map(game => `<div class="calendar-game match-card">
        <div class="match-team home">${esc(game.homeTeam)}</div>
        <div class="match-score">${archivedScore(game)}</div>
        <div class="match-team away">${esc(game.awayTeam)}</div>
      </div>`).join("")}</div>
    </section>`).join("");
  }

  function renderHistoryDivisionTabs() {
    const host = document.querySelector("#historyDivisionTabs");
    if (!host) return;
    const archive = selectedArchive();
    const keys = Object.keys(archive?.league?.divisions || {}).map(Number).sort((a,b) => a-b);
    host.innerHTML = keys.map(division => `<button type="button" class="division-tab ${division === historyDivision ? "active" : ""}" data-history-division="${division}">${division}ª División</button>`).join("");
    host.querySelectorAll("[data-history-division]").forEach(button => button.addEventListener("click", () => {
      historyDivision = Number(button.dataset.historyDivision);
      renderHistoryDivisionTabs();
      renderLeagueStandings(historyDivision);
      renderLeagueCalendar(historyDivision);
    }));
  }

  async function renderHistory(competition="league") {
    historyCompetition = competition === "cup" ? "cup" : "league";
    const archived = [...(catalog.seasons || [])]
      .filter(season => Number(season.id) !== currentSeason() && season.status !== "current")
      .sort((a,b) => Number(b.id) - Number(a.id));
    const empty = document.querySelector("#historyEmpty");
    const controls = document.querySelector("#historySeasonControls");
    const league = document.querySelector("#historyLeagueContent");
    const cup = document.querySelector("#historyCupContent");
    const title = document.querySelector("#historyPageTitle");
    if (title) title.textContent = historyCompetition === "cup" ? "Histórico de Copa" : "Histórico de Liga";

    if (!archived.length) {
      if (empty) {empty.hidden = false; empty.textContent = `Todavía no hay temporadas archivadas de ${historyCompetition === "cup" ? "Copa" : "Liga"}.`;}
      if (controls) controls.hidden = true;
      if (league) league.hidden = true;
      if (cup) cup.hidden = true;
      return;
    }

    if (!archived.some(season => Number(season.id) === selected)) selected = Number(archived[0].id);
    try { await loadArchive(selected); }
    catch (error) {
      if (empty) {empty.hidden = false; empty.textContent = "No se pudo cargar esta temporada archivada.";}
      return;
    }
    renderSelector();
    if (empty) empty.hidden = true;
    if (controls) controls.hidden = false;
    if (league) league.hidden = historyCompetition !== "league";
    if (cup) cup.hidden = historyCompetition !== "cup";

    if (historyCompetition === "league") {
      const keys = Object.keys(selectedArchive()?.league?.divisions || {}).map(Number).sort((a,b) => a-b);
      if (!keys.includes(historyDivision)) historyDivision = keys[0] || 1;
      renderHistoryDivisionTabs();
      renderLeagueStandings(historyDivision);
      renderLeagueCalendar(historyDivision);
    } else {
      window.CampeonesCopa?.renderArchive(document.querySelector("#historyCupBracket"));
    }
  }

  async function init() {
    try {
      const response = await fetch(INDEX_URL, {cache:"no-store"});
      if (response.ok) {
        const loaded = await response.json();
        if (loaded && Array.isArray(loaded.seasons)) catalog = loaded;
      }
    } catch (error) {
      console.warn("Se usa el catálogo local de temporadas", error);
    }
    selected = currentSeason();
    renderSelector();
    document.querySelector("#seasonSelect")?.addEventListener("change", event => selectSeason(event.target.value));
  }

  window.CampeonesTemporadas = {
    init,
    currentSeason,
    selectedSeason,
    isArchiveSelected,
    selectedArchive,
    renderHistory,
    renderLeagueStandings,
    renderLeagueCalendar
  };

  init();
})();
