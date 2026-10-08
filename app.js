const leagueData = {
  "1": [
    {name:"genzotto_"},{name:"L1b3rty"},{name:"pmp"},{name:"Turrutu"},
    {name:"Amilca"},{name:"NausicaaValle"},{name:"Alruhi"},{name:"Zaoras"}
  ],
  "2": [
    {name:"Membarak"},{name:"alcapa7"},{name:"Galadan_"},{name:"David-CT"},
    {name:"javi_onetti"},{name:"Jaime_2386"},{name:"Murciegalo100"},{name:"Mareal"}
  ],
  "3": [
    {name:"Kastiel"},{name:"Mitxelino"},{name:"alvarito_rip"},{name:"Cristian Alarcón"},
    {name:"Jersan"},{name:"Stoicakovic"},{name:"Belce84_"},{name:"SaKio"}
  ],
  "4": [
    {name:"riribar"},{name:"Azzipp"},{name:"DaniMassaro"},{name:"Rob Avi"},
    {name:"TonioBanana"},{name:"Sempresereno"},{name:"Serranito_Deluxe"},{name:"Jbcaturla"}
  ],
  "5": [
    {name:"Rob3r"},{name:"Pysic"},{name:"Calajan"},{name:"Datoro79"},
    {name:"Pocke11"},{name:"Santi21gc"},{name:"javimuzzic"},{name:"Radikalgyn"}
  ],
  "6": [
    {name:"Rafajam86"},{name:"Torcuatoonorato"},{name:"merifa"},{name:"Oreo1988"},{name:"Sergio_raijin"}
  ]
};

// Nombres de equipo vigentes (actualización 08/10/2026 · web v1.51).
const teamNamesRaw = {
  "pmp":"REAL SOCIEDAD",
  "genzotto_":"TOXIRIA",
  "Alruhi":"MODERNONIA FC",
  "David CT.":"REAL DREAMS",
  "David-CT":"REAL DREAMS",
  "javi_onetti":"HARITOS",
  "Zaoras":"ANTANASIO FC",
  "NausicaaValle":"CORLEONE FC",
  "Stoicakovic":"YOTSUGI FC",
  "Murciegalo100":"SAN FRANCIS",
  "Rafajam86":"UD DE COJOS",
  "Oreo1988":"Atl. carajillo",
  "TonioBanana":"Banana FC",
  "DaniMassaro":"Derry FC",
  "Galadan_":"Deportivo Valdevacas",
  "Jaime_2386":"La Raya Vallecana",
  "Sempresereno":"Katanazo FC",
  "Serranito_Deluxe":"SERRANITAZO TEAM",
  "Serranito_Deluxd":"SERRANITAZO TEAM",
  "Mitxelino":"Esteagua de Solares",
  "Calajan":"Furano FC",
  "Calajan777":"Furano FC",
  "Pysic":"Rápido de Bouzas FC",
  "Santi21gc":"Pío Pío Lpgc",
  "alcapa7":"Alcapas FC",
  "javimuzzic":"Muzzic FC",
  "L1b3rty":"Mark Liendres FC",
  "Torcuatoonorato":"Nothingan Miedo",
  "Belce84_":"Me Falla el Corazon",
  "Pocke11":"Piedrahíta",
  "Turrutu":"Tarupidos",
  "Javiblancosinger":"Wakabayashi's",
  "Amilca":"FC Barcino",
  "Avionsis":"Paketon",
  "Radikalgyn":"Var y a casa",
  "Rob Avi":"Paketón",
  "merifa":"Los Vulanicos",
  "Jersan":"San Lorenzo",
  "alvarito_rip":"Fantasy Team",
  "Azzipp":"Twisted Reality",
  "Jbcaturla":"FC Cat",
  "JBCat":"FC Cat",
  "SaKio":"Pacharan FC",
  "Mareal":"TFT",
  "riribar":"AMUNT VCF",
  "Membarak":"Ínter Mitente CF"
};

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const teamNames = new Map(
  Object.entries(teamNamesRaw).map(([name, team]) => [normalizeName(name), team])
);

const teamOf = name => teamNames.get(normalizeName(name)) || `FC ${name}`;

const divisions = Object.fromEntries(
  Object.keys(leagueData).map(k => [Number(k), {name:`${k}ª División`}])
);
divisions[1].name = "1ª División";
divisions[2].name = "2ª División";
divisions[3].name = "3ª División";

const WORKER_URL = "https://campeones-bga-api.luis-rosaperez.workers.dev";
const tournamentByDivision = {
  1: "608407",
  2: "608411",
  3: "608412",
  4: "608414",
  5: "608415",
  6: "608416"
};

const liveState = Object.fromEntries(
  Object.keys(tournamentByDivision).map(div => [Number(div), {
    loading: false,
    loaded: false,
    error: null,
    tournamentStarted: false,
    matches: new Map(),
    rounds: new Map(),
    eloByPlayer: new Map(),
    bgaDisplayRankByPlayer: new Map(),
    updatedAt: null
  }])
);

let activeDivision = 1;

function divisionPlayers(div) {
  return leagueData[String(div)].map(p => ({
    ...p, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0
  }));
}

function canonicalLeaguePlayer(div, bgaName) {
  const wanted = normalizeName(bgaName);
  const direct = leagueData[String(div)]?.find(p => normalizeName(p.name) === wanted);
  if (direct) return direct.name;

  // Alias históricos / pequeñas diferencias detectadas en los nombres.
  const aliases = {
    serranitodeluxd: "Serranito_Deluxe",
    jbcat: "Jbcaturla",
    davidct: "David-CT"
  };
  const alias = aliases[wanted];
  if (!alias) return null;
  return leagueData[String(div)]?.find(p => normalizeName(p.name) === normalizeName(alias))?.name || null;
}

function schedule(players) {
  let arr = players.map(p => p.name);
  if (arr.length % 2) arr.push(null);
  const n = arr.length, rounds = [];
  for (let r=0; r<n-1; r++) {
    const games = [];
    for (let i=0; i<n/2; i++) {
      const a = arr[i], b = arr[n-1-i];
      if (a && b) games.push(r % 2 === 0 ? [a,b] : [b,a]);
    }
    rounds.push(games);
    arr = [arr[0], arr[n-1], ...arr.slice(1,n-1)];
  }
  return rounds;
}

function pairKey(a, b) {
  return [normalizeName(a), normalizeName(b)].sort().join("::");
}

function dynamicMatch(div, a, b) {
  return liveState[div]?.matches.get(pairKey(a,b)) || null;
}

function classificationResults(div) {
  const state = liveState[div];
  if (!state?.loaded) return [];

  // La clasificación es "en directo": incorpora tanto los partidos finalizados
  // como el marcador actual de los que siguen en juego.
  return [...state.matches.values()]
    .filter(m => ["finished", "live"].includes(m.status) && Number.isFinite(m.aScore) && Number.isFinite(m.bScore))
    .map(m => [m.a, m.b, m.aScore, m.bScore, m.status === "live"]);
}

function directResult(results, a, b) {
  return results.find(r =>
    (normalizeName(r[0]) === normalizeName(a) && normalizeName(r[1]) === normalizeName(b)) ||
    (normalizeName(r[0]) === normalizeName(b) && normalizeName(r[1]) === normalizeName(a))
  );
}

function standings(div) {
  const ps = divisionPlayers(div);
  const rs = classificationResults(div);
  const state = liveState[div];

  ps.forEach(p => {
    p.elo = state?.eloByPlayer?.get(normalizeName(p.name)) ?? null;
    p.bgaDisplayRank = state?.bgaDisplayRankByPlayer?.get(normalizeName(p.name)) ?? null;
  });

  rs.forEach(([home, away, hs, as, isLive]) => {
    const a = ps.find(p => normalizeName(p.name) === normalizeName(home));
    const b = ps.find(p => normalizeName(p.name) === normalizeName(away));
    if (!a || !b) return;

    a.pj++; b.pj++;
    a.gf += hs; a.gc += as;
    b.gf += as; b.gc += hs;

    if (isLive) {
      a.live = true;
      b.live = true;
    }

    if (hs > as) { a.pg++; b.pp++; a.pts += 3; }
    else if (hs < as) { b.pg++; a.pp++; b.pts += 3; }
    else { a.pe++; b.pe++; a.pts++; b.pts++; }
  });

  return ps.sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;

    // 1) Goal average particular cuando hay un partido directo finalizado.
    const direct = directResult(rs, a.name, b.name);
    if (direct && direct[2] !== direct[3]) {
      const aIsHome = normalizeName(direct[0]) === normalizeName(a.name);
      const aGoals = aIsHome ? direct[2] : direct[3];
      const bGoals = aIsHome ? direct[3] : direct[2];
      if (aGoals !== bGoals) return bGoals - aGoals;
    }

    // 2) Goal average general.
    const gd = (b.gf - b.gc) - (a.gf - a.gc);
    if (gd) return gd;

    // 3) Desempate que muestre BGA. Solo lo usamos cuando ambos ya han jugado,
    // para no convertir el orden inicial del torneo en un falso desempate.
    if (a.pj > 0 && b.pj > 0 && Number.isFinite(a.bgaDisplayRank) && Number.isFinite(b.bgaDisplayRank)) {
      if (a.bgaDisplayRank !== b.bgaDisplayRank) return a.bgaDisplayRank - b.bgaDisplayRank;
    }

    return a.name.localeCompare(b.name, "es");
  });
}

function renderDivisionTabs() {
  const host = document.querySelector("#divisionTabs");
  host.innerHTML = Object.keys(divisions).map(d =>
    `<button class="division-tab ${Number(d)===activeDivision?"active":""}" data-division="${d}">${divisions[d].name}</button>`
  ).join("");
  host.querySelectorAll(".division-tab").forEach(b => b.onclick = () => {
    activeDivision = Number(b.dataset.division);
    renderChampionship();
    maybeLoadLiveDivision(activeDivision);
  });
}

function renderStandings() {
  const rows = standings(activeDivision);
  const lastDivision = Object.keys(divisions).length;
  document.querySelector("#standingsTable tbody").innerHTML = rows.map((p,i) => {
    const promoted = activeDivision === 1 ? i === 0 : i < 2;
    const relegated = activeDivision < lastDivision && i >= rows.length - 2;
    return `<tr class="${promoted?"promoted":relegated?"relegated":""}">
      <td class="position">${i+1}</td>
      <td class="player-name"><div class="standings-team"><span>${teamOf(p.name)}</span>${p.live ? '<span class="in-play-badge">En juego</span>' : ''}</div></td>
      <td>${p.pj}</td><td>${p.pg}</td><td>${p.pe}</td><td>${p.pp}</td>
      <td>${p.gf}</td><td>${p.gc}</td><td>${p.gf-p.gc}</td><td class="points">${p.pts}</td>
    </tr>`;
  }).join("");
}

function matchPresentation(div, a, b) {
  const match = dynamicMatch(div, a, b);
  if (!match) {
    return {score:"— <span>–</span> —", status:"Sin comenzar", cls:"status-pending"};
  }

  const aIsStoredA = normalizeName(match.a) === normalizeName(a);
  const left = aIsStoredA ? match.aScore : match.bScore;
  const right = aIsStoredA ? match.bScore : match.aScore;
  const hasScore = Number.isFinite(left) && Number.isFinite(right);
  const score = hasScore ? `${left} <span>–</span> ${right}` : `— <span>–</span> —`;

  if (match.status === "finished") {
    return {score, status: hasScore ? "Finalizado" : "Finalizado · marcador pendiente", cls:"status-finished"};
  }
  if (match.status === "live") {
    if (!hasScore) {
      if (match.detailLoading) {
        return {score, status:"Actualizando…", cls:"status-pending"};
      }
      if (match.syncError) {
        return {score, status:"Marcador no disponible", cls:"status-pending"};
      }
      return {score, status:"Marcador pendiente", cls:"status-pending"};
    }
    return {score, status:`En juego${match.phase ? ` · ${match.phase}` : ""}`, cls:"status-live"};
  }
  return {score:"— <span>–</span> —", status:"Sin comenzar", cls:"status-pending"};
}

function renderCalendar() {
  const el = document.querySelector("#calendarRounds");
  const totalRounds = schedule(divisionPlayers(activeDivision)).length;
  const connected = Boolean(tournamentByDivision[activeDivision]);

  function renderGame(a, b) {
    const p = matchPresentation(activeDivision, a, b);
    const match = dynamicMatch(activeDivision, a, b);
    const scoreHtml = match?.tableId
      ? `<a class="match-score-link" href="https://boardgamearena.com/tableview?table=${encodeURIComponent(match.tableId)}" target="_blank" rel="noopener noreferrer" title="Ver partida en BGA">${p.score}</a>`
      : p.score;
    return `<div class="calendar-game match-card">
      <div class="match-team home">${teamOf(a)}</div>
      <div class="match-score">${scoreHtml}</div>
      <div class="match-team away">${teamOf(b)}</div>
      <div class="match-status ${p.cls}">${p.status}</div>
    </div>`;
  }

  // Las divisiones todavía no enlazadas a BGA mantienen el calendario local.
  if (!connected) {
    const rounds = schedule(divisionPlayers(activeDivision));
    el.innerHTML = rounds.map((games,ri) =>
      `<section class="calendar-round"><h3>Jornada ${ri+1}</h3><div class="calendar-games">${games.map(([a,b]) => renderGame(a,b)).join("")}</div></section>`
    ).join("");
    return;
  }

  const state = liveState[activeDivision];
  const sections = [];

  for (let roundNo = 1; roundNo <= totalRounds; roundNo++) {
    const generated = state?.rounds?.get(roundNo) || [];
    let body = "";

    if (generated.length) {
      body = generated.map(match => renderGame(match.a, match.b)).join("");
    } else if (state?.error) {
      body = `<div class="round-pending round-error">No se pudieron consultar los emparejamientos de BGA.</div>`;
    } else if (state?.loading && !state?.loaded && roundNo === 1) {
      body = `<div class="round-pending">Cargando emparejamientos de BGA…</div>`;
    } else {
      body = `<div class="round-pending">Pendiente de generación en BGA</div>`;
    }

    sections.push(
      `<section class="calendar-round ${generated.length ? "round-generated" : "round-awaiting"}"><h3>Jornada ${roundNo}</h3><div class="calendar-games">${body}</div></section>`
    );
  }

  el.innerHTML = sections.join("");
}

function updateDivisionBanner() {
  const banner = document.querySelector("#divisionBanner");
  banner.className = `division-banner division-theme-${activeDivision}`;
  const page = document.querySelector("#championshipPage");
  page.className = `app-page division-theme-${activeDivision}`;
  document.querySelector("#divisionBannerTitle").textContent = divisions[activeDivision].name;

  const lastDivision = Object.keys(divisions).length;
  const promotion = document.querySelector("#legendPromotion");
  const relegation = document.querySelector("#legendRelegation");
  if (promotion) promotion.innerHTML = `<i class="legend-dot champion"></i> ${activeDivision===1?"Campeón":"Ascenso"}`;
  if (relegation) relegation.hidden = activeDivision === lastDivision;
}

function renderParticipants() {
  const rows = [];

  Object.keys(divisions).forEach(d => {
    const div = Number(d);
    leagueData[d].forEach(p => {
      const elo = liveState[div]?.eloByPlayer?.get(normalizeName(p.name)) ?? null;
      rows.push({
        name: p.name,
        team: teamOf(p.name),
        division: divisions[d].name,
        elo
      });
    });
  });

  // ELO conocido de mayor a menor. Los jugadores cuya división todavía no
  // está conectada a BGA quedan al final hasta que incorporemos su torneo.
  rows.sort((a,b) => {
    const aHas = Number.isFinite(a.elo);
    const bHas = Number.isFinite(b.elo);
    if (aHas && bHas && b.elo !== a.elo) return b.elo - a.elo;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return a.team.localeCompare(b.team, "es");
  });

  document.querySelector("#allParticipants").innerHTML =
    `<div class="participants-table-wrap"><table class="participants-table"><thead><tr><th>Equipo</th><th>Jugador</th><th>ELO</th><th>División</th></tr></thead><tbody>${rows.map(r =>
      `<tr><td class="team-name">${r.team}</td><td>${r.name}</td><td class="participant-elo">${Number.isFinite(r.elo) ? r.elo : "—"}</td><td><span class="division-pill">${r.division}</span></td></tr>`
    ).join("")}</tbody></table></div>`;
}
function ensureSyncBox() {
  let box = document.querySelector("#bgaSyncStatus");
  if (!box) {
    box = document.createElement("div");
    box.id = "bgaSyncStatus";
    box.className = "bga-sync";
    const row = document.querySelector("#divisionControlsRow");
    if (row) row.appendChild(box);
    else document.querySelector("#divisionTabs")?.insertAdjacentElement("afterend", box);
  }
  return box;
}

function friendlySyncError(errorText) {
  const text = String(errorText || "");
  if (/sesion|sesi[oó]n|session|cookie|token|login|autent|identif/i.test(text)) return "sesión BGA caducada";
  if (/tiempo de espera|timeout/i.test(text)) return "BGA no respondió a tiempo";
  return "no se pudo actualizar";
}

function formatSavedTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-ES", {
    day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"
  });
}

function renderSyncStatus() {
  const box = ensureSyncBox();
  const tournamentId = tournamentByDivision[activeDivision];
  if (!tournamentId) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  const state = liveState[activeDivision];
  const time = formatSavedTime(state?.updatedAt);
  const label = state?.loading ? "Actualizando…" : "Actualizar datos";
  let note = time ? `datos guardados · ${time}` : "sin datos guardados";
  if (state?.error) {
    note = `${time ? `últimos datos · ${time} · ` : ""}${friendlySyncError(state.error)}`;
  }

  box.innerHTML = `
    <button type="button" id="retryBga" ${state?.loading ? "disabled" : ""}>${label}</button>
    <small class="bga-updated ${state?.error ? "sync-warning" : ""}">${note}</small>
  `;

  document.querySelector("#retryBga")?.addEventListener("click", () => {
    loadDivisionLiveData(activeDivision, true);
  });
}

function renderChampionship() {
  renderDivisionTabs();
  renderSyncStatus();
  renderStandings();
  renderCalendar();
  updateDivisionBanner();
}

function normalizeCollection(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function firstDefined(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return null;
}

function syncLeagueRosterFromOverview(data, div) {
  const collection = normalizeCollection(data?.players);
  const names = collection.map(p => {
    if (typeof p === "string") return p;
    return firstDefined(p, ["name", "player_name", "playerName"]);
  }).filter(Boolean).map(String);

  // El torneo BGA es la fuente de verdad de quién compite en cada división.
  // Conservamos el orden que devuelve BGA; los nombres de equipo se resuelven
  // aparte con teamNamesRaw.
  if (names.length >= 2) {
    leagueData[String(div)] = names.map(name => ({name}));
  }
}

function parseOverview(raw, div) {
  const data = raw?.data ?? raw ?? {};
  syncLeagueRosterFromOverview(data, div);
  const playerNameById = new Map();
  const eloByPlayer = new Map();
  const bgaDisplayRankByPlayer = new Map();

  if (Array.isArray(data.players)) {
    data.players.forEach(p => {
      const id = firstDefined(p, ["id","player_id","playerId"]);
      const name = firstDefined(p, ["name","player_name","playerName"]);
      if (id !== null && name) {
        playerNameById.set(String(id), String(name));
        const canonical = canonicalLeaguePlayer(div, String(name));
        const elo = finiteNumber(p?.elo);
        const displayRank = finiteNumber(p?.displayRank);
        if (canonical && elo !== null) eloByPlayer.set(normalizeName(canonical), elo);
        if (canonical && displayRank !== null) bgaDisplayRankByPlayer.set(normalizeName(canonical), displayRank);
      }
    });
  } else if (data.players && typeof data.players === "object") {
    Object.entries(data.players).forEach(([key,p]) => {
      if (typeof p === "string") {
        playerNameById.set(String(key), p);
      } else {
        const id = firstDefined(p, ["id","player_id","playerId"]) ?? key;
        const name = firstDefined(p, ["name","player_name","playerName"]);
        if (name) {
          playerNameById.set(String(id), String(name));
          const canonical = canonicalLeaguePlayer(div, String(name));
          const elo = finiteNumber(p?.elo);
          const displayRank = finiteNumber(p?.displayRank);
          if (canonical && elo !== null) eloByPlayer.set(normalizeName(canonical), elo);
          if (canonical && displayRank !== null) bgaDisplayRankByPlayer.set(normalizeName(canonical), displayRank);
        }
      }
    });
  }

  const steps = normalizeCollection(data.steps);
  const matches = [];
  const rounds = new Map();

  steps.forEach((step, stepIndex) => {
    const stepNoRaw = firstDefined(step, ["id","position","step"]);
    const stepNo = Number(stepNoRaw) || (stepIndex + 1);
    const stepMatches = [];

    normalizeCollection(step?.matches ?? step?.matchs ?? step?.games).forEach(match => {
      // BGA no siempre serializa los jugadores de un partido igual: en unos
      // torneos llegan como array con player_id y en otros como objeto cuyas
      // claves SON los player_id. No usamos Object.values aqui porque perder
      // esas claves hacia desaparecer partidos completos del calendario.
      const playersSource = match?.players ?? match?.player ?? match?.participants;
      const playerEntries = Array.isArray(playersSource)
        ? playersSource.map((p, i) => [String(i), p])
        : (playersSource && typeof playersSource === "object")
          ? Object.entries(playersSource)
          : [];

      const resolvedPlayerRows = playerEntries.map(([entryKey, p]) => {
        if (typeof p === "string" || typeof p === "number") {
          const resolvedName = playerNameById.get(String(p)) || (typeof p === "string" ? p : null);
          return resolvedName ? { name: resolvedName, result: null, points: null, tie: null } : null;
        }
        if (!p || typeof p !== "object") return null;

        const nested = p.player && typeof p.player === "object" ? p.player : null;
        const id = firstDefined(p, ["player_id","playerId","id"])
          ?? firstDefined(nested, ["player_id","playerId","id"])
          ?? (/^\d+$/.test(entryKey) ? entryKey : null);
        const directName = firstDefined(p, ["player_name","playerName","name","fullname","player_fullname"])
          ?? firstDefined(nested, ["player_name","playerName","name","fullname","player_fullname"]);
        const resolvedName = directName || (id !== null ? playerNameById.get(String(id)) : null);
        if (!resolvedName) return null;

        return {
          name: resolvedName,
          result: finiteNumber(firstDefined(p, ["result"])),
          points: finiteNumber(firstDefined(p, ["points"])),
          tie: finiteNumber(firstDefined(p, ["tie"]))
        };
      }).filter(Boolean);

      let names = resolvedPlayerRows.map(row => row.name);

      // Fallback para variantes de BGA que exponen los dos jugadores como
      // campos separados en lugar de dentro de match.players.
      if (names.length !== 2) {
        const fallbackIds = [
          firstDefined(match, ["player1_id","player1Id","player_1_id","player1"]),
          firstDefined(match, ["player2_id","player2Id","player_2_id","player2"])
        ].filter(v => v !== null && v !== undefined);
        if (fallbackIds.length === 2) {
          const fallbackNames = fallbackIds.map(v => {
            if (typeof v === "object") {
              return firstDefined(v, ["player_name","playerName","name","fullname"])
                || playerNameById.get(String(firstDefined(v, ["player_id","playerId","id"])));
            }
            return playerNameById.get(String(v)) || (typeof v === "string" && !/^\d+$/.test(v) ? v : null);
          }).filter(Boolean);
          if (fallbackNames.length === 2) names = fallbackNames;
        }
      }

      if (names.length !== 2) {
        console.warn("Partido BGA omitido: no se pudieron resolver exactamente 2 jugadores", {div, stepNo, match});
        return;
      }

      const a = canonicalLeaguePlayer(div, names[0]);
      const b = canonicalLeaguePlayer(div, names[1]);
      if (!a || !b) return;

      const tableId = firstDefined(match, ["tableId","table_id","table"]);
      const statusText = String(firstDefined(match, ["status"]) || "").toLowerCase();
      const tableStatusText = String(firstDefined(match, ["tableStatus","table_status"]) || "").toLowerCase();
      const progression = finiteNumber(firstDefined(match, ["tableProgression","table_progression","progression"]));
      const finished = [statusText, tableStatusText].some(s => /finished|complete|completed|archive|ended/.test(s));
      const cancelled = [statusText, tableStatusText].some(s => /cancel|void/.test(s));
      // BGA crea la mesa antes de que el partido empiece. Un tableId con
      // progresión 0 sigue siendo "Sin comenzar".
      const hasStarted = tableId && progression !== null && progression > 0;
      const status = cancelled ? "pending" : (finished ? "finished" : (hasStarted ? "live" : "pending"));

      const metaByPlayer = new Map();
      for (const row of resolvedPlayerRows) {
        const canonical = canonicalLeaguePlayer(div, row.name);
        if (canonical) metaByPlayer.set(normalizeName(canonical), row);
      }
      const aMeta = metaByPlayer.get(normalizeName(a)) || {};
      const bMeta = metaByPlayer.get(normalizeName(b)) || {};

      const parsedMatch = {
        a, b,
        tableId: tableId ? String(tableId) : null,
        status,
        phase: null,
        aScore: null,
        bScore: null,
        // Resultado oficial del torneo BGA. En partidas terminadas lo usamos
        // para asociar el marcador Nankatsu/Toho al jugador correcto, porque
        // las cartas de ambos equipos pueden hacer ambigua la inferencia por logs.
        aResult: aMeta.result ?? null,
        bResult: bMeta.result ?? null,
        aTournamentPoints: aMeta.points ?? null,
        bTournamentPoints: bMeta.points ?? null,
        step: stepNo,
        position: Number(firstDefined(match, ["position"])) || 0,
        progression
      };

      matches.push(parsedMatch);
      stepMatches.push(parsedMatch);
    });

    stepMatches.sort((a,b) => a.position - b.position);
    if (stepMatches.length) rounds.set(stepNo, stepMatches);
  });

  return {
    matches,
    rounds,
    eloByPlayer,
    bgaDisplayRankByPlayer,
    started: steps.length > 0 && matches.length > 0
  };
}

async function fetchJson(url, timeoutMs=20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {cache:"no-store", signal:controller.signal});
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); }
    catch { throw new Error(`Respuesta no JSON (${response.status})`); }
    if (!response.ok || String(json?.status) === "0") {
      const error = new Error(json?.error || `HTTP ${response.status}`);
      error.code = json?.code || (response.status === 401 || response.status === 403 ? "BGA_SESSION" : "HTTP_ERROR");
      throw error;
    }
    return json;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeout = new Error("Tiempo de espera agotado");
      timeout.code = "TIMEOUT";
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try { results[i] = await worker(items[i], i); }
      catch (error) { results[i] = {error}; }
    }
  }
  await Promise.all(Array.from({length:Math.min(limit, items.length)}, run));
  return results;
}

// =====================================================
// v1.51 · ESTADO PERSISTENTE EN EL NAVEGADOR
// =====================================================
const LOCAL_SNAPSHOT_KEY = "campeones-state-v29";
let clientSnapshot = {
  schemaVersion: 1,
  savedAt: null,
  divisions: {},
  elo: {}
};
let participantsLoading = false;
let participantsError = null;
let eloUpdatedAt = null;

function snapshotDivision(div) {
  const key = String(div);
  if (!clientSnapshot.divisions[key]) {
    clientSnapshot.divisions[key] = {overview:null, updatedAt:null, matches:{}};
  }
  if (!clientSnapshot.divisions[key].matches) clientSnapshot.divisions[key].matches = {};
  return clientSnapshot.divisions[key];
}

function snapshotEloDivision(div) {
  const key = String(div);
  if (!clientSnapshot.elo[key]) clientSnapshot.elo[key] = {data:null, updatedAt:null};
  return clientSnapshot.elo[key];
}

function normalizeSnapshotMatchEntry(entry) {
  if (!entry) return null;
  return entry.data ?? entry;
}

function persistLocalSnapshot() {
  try {
    clientSnapshot.savedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(clientSnapshot));
  } catch (error) {
    console.warn("No se pudo guardar el estado local", error);
  }
}

function readLocalSnapshot() {
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Number(parsed.schemaVersion) !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

function snapshotHasUsefulData(snapshot) {
  if (!snapshot) return false;
  return Object.values(snapshot.divisions || {}).some(d => d?.overview) ||
    Object.values(snapshot.elo || {}).some(d => d?.data);
}

function buildMatchCollections(matches) {
  const map = new Map();
  const rounds = new Map();
  for (const match of matches) {
    map.set(pairKey(match.a, match.b), match);
    if (!rounds.has(match.step)) rounds.set(match.step, []);
    rounds.get(match.step).push(match);
  }
  for (const games of rounds.values()) {
    games.sort((a,b) => (a.position || 0) - (b.position || 0));
  }
  return {map, rounds};
}

function applyDetailToMatch(div, match, detail) {
  if (!detail) return {...match};

  const scoreByLeaguePlayer = new Map();
  normalizeCollection(detail?.players).forEach(p => {
    const name = canonicalLeaguePlayer(div, p?.name);
    const score = finiteNumber(p?.score);
    if (name && score !== null) scoreByLeaguePlayer.set(normalizeName(name), score);
  });

  let aScore = scoreByLeaguePlayer.get(normalizeName(match.a));
  let bScore = scoreByLeaguePlayer.get(normalizeName(match.b));

  // Respaldo para archivos antiguos guardados antes de que BGA devolviera
  // el marcador final directamente por jugador.
  if (match.status === "finished" && (aScore === undefined || bScore === undefined)) {
    const nankatsu = finiteNumber(detail?.score?.Nankatsu);
    const toho = finiteNumber(detail?.score?.Toho);
    if (nankatsu !== null && toho !== null) {
      const high = Math.max(nankatsu, toho);
      const low = Math.min(nankatsu, toho);
      if (high === low) {
        aScore = high;
        bScore = low;
      } else {
        const ar = finiteNumber(match.aResult);
        const br = finiteNumber(match.bResult);
        const ap = finiteNumber(match.aTournamentPoints);
        const bp = finiteNumber(match.bTournamentPoints);
        let aWon = null;
        if (ar !== null && br !== null && ar !== br) aWon = ar < br;
        else if (ap !== null && bp !== null && ap !== bp) aWon = ap > bp;
        if (aWon !== null) {
          aScore = aWon ? high : low;
          bScore = aWon ? low : high;
        }
      }
    }
  }

  return {
    ...match,
    phase: detail?.phase || match.phase || null,
    aScore: aScore ?? match.aScore ?? null,
    bScore: bScore ?? match.bScore ?? null
  };
}

function matchHasCompleteScore(match) {
  return Number.isFinite(match?.aScore) && Number.isFinite(match?.bScore);
}

function hydrateEloPayload(div, payload, updatedAt=null) {
  if (!payload) return;
  const state = liveState[div];
  const players = normalizeCollection(payload?.data?.players ?? payload?.players);
  for (const player of players) {
    const name = canonicalLeaguePlayer(div, player?.name);
    const elo = finiteNumber(player?.elo);
    if (name && elo !== null) state.eloByPlayer.set(normalizeName(name), elo);
  }
  if (updatedAt) eloUpdatedAt = new Date(updatedAt);
}

function hydrateDivisionFromSnapshot(div, entry) {
  if (!entry?.overview) return;
  const state = liveState[div];
  const parsed = parseOverview(entry.overview, div);
  const storedMatches = entry.matches || {};
  const matches = parsed.matches.map(match => {
    const detail = normalizeSnapshotMatchEntry(storedMatches[String(match.tableId)]);
    const hydrated = detail ? applyDetailToMatch(div, match, detail) : match;
    return {...hydrated, detailLoading:false, syncError:false};
  });
  const collections = buildMatchCollections(matches);
  state.matches = collections.map;
  state.rounds = collections.rounds;
  state.bgaDisplayRankByPlayer = parsed.bgaDisplayRankByPlayer;
  state.tournamentStarted = parsed.started;
  state.loaded = true;
  state.error = null;
  state.updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : null;
}

function hydrateSnapshot(snapshot) {
  if (!snapshot) return;
  clientSnapshot = {
    schemaVersion: 1,
    savedAt: snapshot.savedAt || snapshot.generatedAt || null,
    divisions: snapshot.divisions || {},
    elo: snapshot.elo || {}
  };

  for (const div of Object.keys(tournamentByDivision).map(Number)) {
    hydrateDivisionFromSnapshot(div, clientSnapshot.divisions[String(div)]);
    const eloEntry = clientSnapshot.elo[String(div)];
    if (eloEntry?.data) hydrateEloPayload(div, eloEntry.data, eloEntry.updatedAt);
  }
}

function saveOverviewToSnapshot(div, overview, updatedAt) {
  const entry = snapshotDivision(div);
  entry.overview = overview;
  entry.updatedAt = updatedAt;
}

function saveMatchDetailToSnapshot(div, match, detail, finalFlag) {
  if (!match?.tableId || !detail) return;
  const entry = snapshotDivision(div);
  const key = String(match.tableId);
  const existing = entry.matches[key];
  // Un resultado definitivo validado no se degrada después a un estado vivo.
  if (existing?.final && !finalFlag) return;
  entry.matches[key] = {
    savedAt: new Date().toISOString(),
    final: Boolean(finalFlag),
    data: detail
  };
}

function saveEloToSnapshot(div, payload, updatedAt) {
  const entry = snapshotEloDivision(div);
  entry.data = payload;
  entry.updatedAt = updatedAt;
}

async function bootstrapSavedData() {
  const local = readLocalSnapshot();
  if (snapshotHasUsefulData(local)) {
    hydrateSnapshot(local);
    renderChampionship();
    renderParticipants();
    renderEloSyncStatus();
    return;
  }

  // Excepción aprobada: un navegador nuevo recibe la última copia compartida
  // de Cloudflare. Esta llamada NO consulta BGA.
  try {
    const cloud = await fetchJson(`${WORKER_URL}/?snapshot=1`, 12000);
    if (snapshotHasUsefulData(cloud)) {
      hydrateSnapshot(cloud);
      persistLocalSnapshot();
    }
  } catch (error) {
    console.warn("No se pudo recuperar el último estado compartido", error);
  }

  renderChampionship();
  renderParticipants();
  renderEloSyncStatus();
}

function renderEloSyncStatus() {
  const box = document.querySelector("#eloSyncStatus");
  if (!box) return;
  const time = formatSavedTime(eloUpdatedAt);
  let note = time ? `ELO guardado · ${time}` : "sin ELO guardado";
  if (participantsError) note = `${time ? `último ELO · ${time} · ` : ""}${friendlySyncError(participantsError)}`;
  box.innerHTML = `
    <button type="button" id="refreshEloButton" ${participantsLoading ? "disabled" : ""}>${participantsLoading ? "Actualizando ELO…" : "Actualizar ELO"}</button>
    <small class="bga-updated ${participantsError ? "sync-warning" : ""}">${note}</small>
  `;
  document.querySelector("#refreshEloButton")?.addEventListener("click", () => loadAllParticipantsData(true));
}

async function fetchMatchDetail(div, match) {
  const archived = match.status === "finished" ? "&archived=1" : "";
  const primaryUrl = `${WORKER_URL}/?match=${encodeURIComponent(match.tableId)}${archived}&refresh=1`;
  let detail;
  try {
    detail = await fetchJson(primaryUrl, 20000);
  } catch (error) {
    // Reintento único. El Worker ya evita consultas duplicadas simultáneas.
    await wait(400);
    detail = await fetchJson(`${primaryUrl}&retry=1`, 20000);
  }
  saveMatchDetailToSnapshot(div, match, detail, match.status === "finished");
  persistLocalSnapshot();
  return detail;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadDivisionLiveData(div, force=false) {
  const tournamentId = tournamentByDivision[div];
  const state = liveState[div];
  if (!tournamentId || !state || state.loading) return;
  // Nunca actualizamos BGA automáticamente. Sin force solo mostramos lo guardado.
  if (!force) return;

  state.loading = true;
  state.error = null;
  if (activeDivision === div) renderSyncStatus();

  try {
    // Campeonato y ELO quedan separados: esta consulta no pide perfiles ELO.
    const overview = await fetchJson(
      `${WORKER_URL}/?id=${encodeURIComponent(tournamentId)}&includeElo=0&refresh=1`,
      20000
    );
    const parsed = parseOverview(overview, div);
    const previousMatches = state.matches;
    const stored = snapshotDivision(div);

    const baseMatches = parsed.matches.map(match => {
      const previous = previousMatches.get(pairKey(match.a, match.b));
      const storedDetail = normalizeSnapshotMatchEntry(stored.matches?.[String(match.tableId)]);
      let current = {
        ...match,
        aScore: previous?.aScore ?? match.aScore,
        bScore: previous?.bScore ?? match.bScore,
        phase: previous?.phase ?? match.phase,
        detailLoading:false,
        syncError:false
      };
      if (storedDetail) current = applyDetailToMatch(div, current, storedDetail);
      return current;
    });

    const collections = buildMatchCollections(baseMatches);
    state.matches = collections.map;
    state.rounds = collections.rounds;
    state.bgaDisplayRankByPlayer = parsed.bgaDisplayRankByPlayer;
    state.tournamentStarted = parsed.started;
    state.loaded = true;

    const overviewTime = new Date().toISOString();
    state.updatedAt = new Date(overviewTime);
    saveOverviewToSnapshot(div, overview, overviewTime);
    persistLocalSnapshot();

    if (activeDivision === div) {
      renderStandings();
      renderCalendar();
      renderSyncStatus();
    }

    function replaceMatch(updated) {
      const key = pairKey(updated.a, updated.b);
      state.matches.set(key, updated);
      const games = state.rounds.get(updated.step) || [];
      const idx = games.findIndex(m => pairKey(m.a, m.b) === key);
      if (idx >= 0) games[idx] = updated;
      else games.push(updated);
      games.sort((a,b) => (a.position || 0) - (b.position || 0));
      state.rounds.set(updated.step, games);
      if (activeDivision === div) {
        renderStandings();
        renderCalendar();
      }
    }

    const toEnrich = baseMatches.filter(match => {
      if (!match.tableId || match.status === "pending") return false;
      const entry = stored.matches?.[String(match.tableId)];
      // Partido finalizado + resultado validado: queda fijo para siempre.
      if (match.status === "finished" && entry?.final && matchHasCompleteScore(match)) return false;
      return true;
    });

    // Dos mesas simultáneas como máximo. El Worker añade además una caché corta
    // compartida para amortiguar visitas concurrentes de distintos usuarios.
    await mapLimit(toEnrich, 2, async match => {
      let updated = {...match, detailLoading:true};
      replaceMatch(updated);
      try {
        const detail = await fetchMatchDetail(div, match);
        updated = applyDetailToMatch(div, match, detail);
        updated = {...updated, detailLoading:false, syncError:false};
      } catch (error) {
        console.warn("No se pudo actualizar el marcador", {div, tableId:match.tableId, error});
        updated = {...match, detailLoading:false, syncError:true};
      }
      replaceMatch(updated);
      return updated;
    });

    state.updatedAt = new Date();
    snapshotDivision(div).updatedAt = state.updatedAt.toISOString();
    persistLocalSnapshot();
  } catch (error) {
    console.error("BGA sync error", error);
    state.error = error?.message || String(error);
    // No borramos nada: la última información válida permanece visible.
  } finally {
    state.loading = false;
    if (activeDivision === div) {
      renderSyncStatus();
      renderStandings();
      renderCalendar();
    }
  }
}

async function loadDivisionParticipantsData(div) {
  const tournamentId = tournamentByDivision[div];
  if (!tournamentId) return;
  const payload = await fetchJson(
    `${WORKER_URL}/?id=${encodeURIComponent(tournamentId)}&eloOnly=1&refreshElo=1`,
    25000
  );
  const updatedAt = new Date().toISOString();
  hydrateEloPayload(div, payload, updatedAt);
  saveEloToSnapshot(div, payload, updatedAt);
  persistLocalSnapshot();
  renderParticipants();
}

async function loadAllParticipantsData(force=false) {
  if (!force || participantsLoading) return;
  participantsLoading = true;
  participantsError = null;
  renderEloSyncStatus();
  try {
    for (const div of Object.keys(tournamentByDivision).map(Number)) {
      await loadDivisionParticipantsData(div);
      await wait(120);
    }
    eloUpdatedAt = new Date();
  } catch (error) {
    participantsError = error?.message || String(error);
    console.warn("No se pudo actualizar el ELO", error);
  } finally {
    participantsLoading = false;
    renderParticipants();
    renderEloSyncStatus();
  }
}

function showPage(page) {
  document.querySelectorAll(".app-page").forEach(p => p.hidden = true);
  document.querySelector(`#${page}Page`).hidden = false;
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelector("#championshipLink").onclick = e => { e.preventDefault(); showPage("championship"); };
document.querySelector("#participantsLink").onclick = e => {
  e.preventDefault();
  showPage("participants");
  renderParticipants();
  renderEloSyncStatus();
};
document.querySelector("#rulesLink").onclick = e => { e.preventDefault(); showPage("rules"); };
document.querySelector("#brandHome")?.addEventListener("click", e => { e.preventDefault(); showPage("championship"); });

renderChampionship();
renderParticipants();
renderEloSyncStatus();
showPage("championship");
bootstrapSavedData();
