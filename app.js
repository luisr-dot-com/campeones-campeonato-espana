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

// Nombres de equipo vigentes (actualización 01/10/2026).
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
    return `<div class="calendar-game match-card">
      <div class="match-team home">${teamOf(a)}</div>
      <div class="match-score">${p.score}</div>
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

function renderSyncStatus() {
  const box = ensureSyncBox();
  const tournamentId = tournamentByDivision[activeDivision];
  if (!tournamentId) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  const state = liveState[activeDivision];
  const time = state?.updatedAt
    ? state.updatedAt.toLocaleTimeString("es-ES", {hour:"2-digit", minute:"2-digit"})
    : "";

  const label = state?.loading ? "Actualizando…" : "Actualizar datos";
  const note = state?.error
    ? "No se pudo actualizar"
    : (time ? `actualizado ${time}` : "");

  box.innerHTML = `
    <button type="button" id="retryBga" ${state?.loading ? "disabled" : ""}>${label}</button>
    ${note ? `<small class="bga-updated">${note}</small>` : ""}
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

      let names = playerEntries.map(([entryKey, p]) => {
        if (typeof p === "string" || typeof p === "number") {
          return playerNameById.get(String(p)) || (typeof p === "string" ? p : null);
        }
        if (!p || typeof p !== "object") return null;

        const nested = p.player && typeof p.player === "object" ? p.player : null;
        const id = firstDefined(p, ["player_id","playerId","id"])
          ?? firstDefined(nested, ["player_id","playerId","id"])
          ?? (/^\d+$/.test(entryKey) ? entryKey : null);
        const directName = firstDefined(p, ["player_name","playerName","name","fullname","player_fullname"])
          ?? firstDefined(nested, ["player_name","playerName","name","fullname","player_fullname"]);
        return directName || (id !== null ? playerNameById.get(String(id)) : null);
      }).filter(Boolean);

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

      const parsedMatch = {
        a, b,
        tableId: tableId ? String(tableId) : null,
        status,
        phase: null,
        aScore: null,
        bScore: null,
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
      throw new Error(json?.error || `HTTP ${response.status}`);
    }
    return json;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Tiempo de espera agotado");
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

function matchCacheKey(tableId) {
  return `campeones-bga-match-v23-${tableId}`;
}

function readCachedMatch(tableId, finished) {
  try {
    const raw = sessionStorage.getItem(matchCacheKey(tableId));
    if (!raw) return null;
    const item = JSON.parse(raw);
    const maxAge = finished ? 24*60*60*1000 : 2*60*1000;
    if (Date.now() - item.savedAt > maxAge) return null;
    return item.data;
  } catch { return null; }
}

function cacheMatch(tableId, data) {
  try {
    sessionStorage.setItem(matchCacheKey(tableId), JSON.stringify({savedAt:Date.now(), data}));
  } catch {}
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enrichMatch(div, match, force=false) {
  if (!match.tableId) return match;

  const cached = force ? null : readCachedMatch(match.tableId, match.status === "finished");
  let detail = cached;

  if (!detail) {
    const archived = match.status === "finished" ? "&archived=1" : "";
    detail = await fetchJson(`${WORKER_URL}/?match=${encodeURIComponent(match.tableId)}${archived}`, 18000);
    cacheMatch(match.tableId, detail);
  }

  const scoreByLeaguePlayer = new Map();
  normalizeCollection(detail?.players).forEach(p => {
    const name = canonicalLeaguePlayer(div, p?.name);
    const score = finiteNumber(p?.score);
    if (name && score !== null) scoreByLeaguePlayer.set(normalizeName(name), score);
  });

  let aScore = scoreByLeaguePlayer.get(normalizeName(match.a));
  let bScore = scoreByLeaguePlayer.get(normalizeName(match.b));

  // Si BGA confirma que la mesa está en juego (progresión > 0), el marcador
  // mínimo válido es 0-0 aunque todavía no haya eventos de gol o suficientes
  // eventos para asociar ambos jugadores a Nankatsu/Toho.
  if (match.status === "live" && Number(match.progression) > 0) {
    if (!Number.isFinite(aScore)) aScore = 0;
    if (!Number.isFinite(bScore)) bScore = 0;
  }

  return {
    ...match,
    phase: detail?.phase || null,
    aScore: aScore ?? null,
    bScore: bScore ?? null
  };
}

async function loadDivisionLiveData(div, force=false) {
  const tournamentId = tournamentByDivision[div];
  const state = liveState[div];
  if (!tournamentId || !state || state.loading) return;
  if (state.loaded && !force) return;

  state.loading = true;
  state.error = null;
  if (activeDivision === div) {
    renderSyncStatus();
    renderCalendar();
  }

  try {
    const refreshElo = force ? "&refreshElo=1" : "";
    const overview = await fetchJson(`${WORKER_URL}/?id=${encodeURIComponent(tournamentId)}${refreshElo}`, 20000);
    const parsed = parseOverview(overview, div);
    const previousMatches = state.matches;

    // V20: el overview es la fuente de verdad de los emparejamientos y se
    // pinta inmediatamente. La consulta del marcador de una mesa no puede
    // bloquear ni hacer desaparecer el resto de partidos de la jornada.
    const baseMatches = parsed.matches.map(match => {
      const previous = previousMatches.get(pairKey(match.a, match.b));
      const needsDetail = Boolean(match.tableId && match.status !== "pending");
      return {
        ...match,
        aScore: previous?.aScore ?? match.aScore,
        bScore: previous?.bScore ?? match.bScore,
        phase: previous?.phase ?? match.phase,
        detailLoading: needsDetail,
        syncError: false
      };
    });

    const map = new Map();
    const roundMap = new Map();
    baseMatches.forEach(match => {
      map.set(pairKey(match.a, match.b), match);
      if (!roundMap.has(match.step)) roundMap.set(match.step, []);
      roundMap.get(match.step).push(match);
    });
    for (const games of roundMap.values()) {
      games.sort((a,b) => (a.position || 0) - (b.position || 0));
    }

    state.matches = map;
    state.rounds = roundMap;
    state.eloByPlayer = parsed.eloByPlayer;
    state.bgaDisplayRankByPlayer = parsed.bgaDisplayRankByPlayer;
    state.tournamentStarted = parsed.started;
    state.loaded = true;
    state.updatedAt = new Date();
    renderParticipants();

    if (activeDivision === div) {
      renderStandings();
      renderCalendar();
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

    // Dos mesas en paralelo es un término medio: evita la ráfaga de cuatro
    // peticiones que daba errores en V17, pero tampoco obliga a esperar a que
    // terminen las cuatro una detrás de otra como ocurría en V19.
    const toEnrich = baseMatches.filter(m => m.tableId && m.status !== "pending");
    await mapLimit(toEnrich, 2, async match => {
      let updated;
      try {
        updated = await enrichMatch(div, match, force);
        updated = {...updated, detailLoading:false, syncError:false};
      } catch (error) {
        console.warn("No se pudo actualizar el marcador de una mesa BGA", {
          div, tableId: match.tableId, error
        });
        updated = {...match, detailLoading:false, syncError:true};
      }
      replaceMatch(updated);
      return updated;
    });
  } catch (error) {
    console.error("BGA sync error", error);
    state.error = error?.message || String(error);
  } finally {
    state.loading = false;
    if (activeDivision === div) {
      renderSyncStatus();
      renderStandings();
      renderCalendar();
    }
  }
}

async function loadDivisionParticipantsData(div, force=false) {
  const tournamentId = tournamentByDivision[div];
  const state = liveState[div];
  if (!tournamentId || !state) return;

  try {
    const refreshElo = force ? "&refreshElo=1" : "";
    const overview = await fetchJson(`${WORKER_URL}/?id=${encodeURIComponent(tournamentId)}${refreshElo}`);
    const parsed = parseOverview(overview, div);
    state.eloByPlayer = parsed.eloByPlayer;
    state.bgaDisplayRankByPlayer = parsed.bgaDisplayRankByPlayer;
    renderParticipants();
  } catch (error) {
    console.warn("No se pudieron cargar los participantes/ELO de una división", {div, error});
  }
}

async function loadAllParticipantsData(force=false) {
  // Solo necesitamos overview + ELO. No reconstruimos aquí todos los
  // marcadores de las seis divisiones, porque eso saturaba BGA y provocaba
  // que desapareciesen partidos de forma aparentemente aleatoria.
  for (const div of Object.keys(tournamentByDivision).map(Number)) {
    await loadDivisionParticipantsData(div, force);
    await wait(150);
  }
}

function maybeLoadLiveDivision(div) {
  if (tournamentByDivision[div]) loadDivisionLiveData(div, false);
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
  loadAllParticipantsData(false);
};
document.querySelector("#rulesLink").onclick = e => { e.preventDefault(); showPage("rules"); };
document.querySelector("#brandHome")?.addEventListener("click", e => { e.preventDefault(); showPage("championship"); });

renderChampionship();
renderParticipants();
showPage("championship");
maybeLoadLiveDivision(activeDivision);
