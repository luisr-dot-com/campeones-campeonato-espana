(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const player = (name,team) => ({name,team,key:name.toLowerCase()});
  const P = {
    liberty:player("L1b3rty","Mark Liendres FC"),pocke:player("Pocke11","Piedrahíta"),serranito:player("Serranito Deluxe","SERRANITAZO TEAM"),
    tonio:player("TonioBanana","Banana FC"),murciegalo:player("murciegalo100","SAN FRANCIS"),amilca:player("Amilca","FC Barcino"),
    calajan:player("Calajan777","Furano FC"),javimuzzic:player("javimuzzic","Muzzic FC"),galadan:player("Galadan_","Deportivo Valdevacas"),
    onetti:player("javi_onetti","HARITOS"),rafajam:player("Rafajam86","UD DE COJOS"),pmp:player("pmp","REAL SOCIEDAD"),
    belce:player("Belce84_","Me Falla el Corazon"),sempre:player("Sempresereno","Katanazo FC"),alruhi:player("alruhi","MODERNONIA FC"),
    robavi:player("Rob Avi","Paketón"),turrutu:player("Turrutu","Tarupidos"),pysic:player("Pysic","Rápido de Bouzas FC"),
    radikal:player("radikalgyn","Var y a casa"),alvarito:player("alvarito_rip","Fantasy Team"),azzipp:player("Azzipp","Twisted Reality"),
    genzotto:player("genzotto_","TOXIRIA"),mareal:player("Mareal","TFT"),datoro:player("Datoro79","FC Datoro79"),
    nausicaa:player("NausicaaValle","CORLEONE FC"),jaime:player("Jaime_2386","La Raya Vallecana"),david:player("David-CT","REAL DREAMS"),
    sakio:player("SaKio","Pacharan FC"),jbcat:player("JBCat","FC Cat"),alcapa:player("alcapa7","Alcapas FC"),
    santi:player("santi21gc","Pío Pío Lpgc"),javiblanco:player("javiblancosinger","Wakabayashi's"),stoic:player("Stoicakovic","YOTSUGI FC"),
    riribar:player("riribar","AMUNT VCF"),mitxelino:player("mitxelino","Esteagua de Solares"),sergio:player("Sergio_Raijin","FC Sergio_raijin"),
    zaoras:player("Zaoras","ANTANASIO FC"),garban:player("Garban","Garban FC"),merifa:player("merifa","Los Vulanicos"),
    membarak:player("Membarak","Ínter Mitente CF"),dani:player("DaniMassaro","Derry FC")
  };
  // ELO de Campeones guardado por el Worker el 01/11/2026, antes del inicio
  // de la Copa (03/11/2026). Es un dato histórico fijo: no se actualiza.
  const initialElo = {
    "pmp":351,"genzotto_":343,"l1b3rty":375,"zaoras":277,"nausicaavalle":207,"turrutu":287,"alruhi":227,"amilca":253,
    "david-ct":262,"membarak":245,"galadan_":261,"alcapa7":253,"murciegalo100":197,"javi_onetti":152,"jaime_2386":170,"mareal":124,
    "mitxelino":231,"alvarito_rip":216,"sakio":151,"stoicakovic":128,"belce84_":129,
    "toniobanana":211,"rob avi":154,"sempresereno":110,"azzipp":171,"danimassaro":160,"serranito deluxe":113,"jbcat":103,"riribar":110,
    "calajan777":147,"datoro79":113,"pysic":135,"pocke11":110,"santi21gc":137,"javimuzzic":110,"radikalgyn":100,
    "sergio_raijin":181,"javiblancosinger":362,"rafajam86":121,"garban":143,"merifa":103
  };
  Object.values(P).forEach(person => { person.initialElo = initialElo[person.name.toLowerCase()] ?? null; });
  const ph = label => ({name:"",team:label,key:`placeholder-${label}`,placeholder:true});
  const tie = (a,b,status="pending",table=null,progress=null,score=null,winner=null) => ({a,b,status,table,progress,score,winner});
  const currentRounds = [
    [
      tie(P.liberty,null,"bye"),tie(P.pocke,P.serranito,"live","942150838",14),tie(P.tonio,null,"bye"),tie(P.murciegalo,null,"bye"),
      tie(P.amilca,null,"bye"),tie(P.calajan,P.javimuzzic,"live","942151838",0),tie(P.galadan,null,"bye"),tie(P.onetti,P.rafajam,"live","942153838",14),
      tie(P.pmp,null,"bye"),tie(P.belce,P.sempre,"live","942154838",8),tie(P.alruhi,null,"bye"),tie(P.robavi,null,"bye"),
      tie(P.turrutu,null,"bye"),tie(P.pysic,P.radikal,"live","942156838",8),tie(P.alvarito,null,"bye"),tie(P.azzipp,null,"bye"),
      tie(P.genzotto,null,"bye"),tie(P.mareal,P.datoro,"live","942157838",8),tie(P.nausicaa,null,"bye"),tie(P.jaime,null,"bye"),
      tie(P.david,null,"bye"),tie(P.sakio,P.jbcat,"live","942158838",14),tie(P.alcapa,null,"bye"),tie(P.santi,null,"bye"),
      tie(P.javiblanco,null,"bye"),tie(P.stoic,P.riribar,"live","942151938",32),tie(P.mitxelino,null,"bye"),tie(P.sergio,null,"bye"),
      tie(P.zaoras,null,"bye"),tie(P.garban,P.merifa,"live","942152938",11),tie(P.membarak,null,"bye"),tie(P.dani,null,"bye")
    ],
    [
      tie(P.liberty,ph("…")),tie(P.tonio,P.murciegalo,"live","942153938",14),tie(P.amilca,ph("…")),tie(P.galadan,ph("…")),
      tie(P.pmp,ph("…")),tie(P.alruhi,P.robavi,"live","942157938",14),tie(P.turrutu,ph("…")),tie(P.alvarito,P.azzipp,"live","942150048",20),
      tie(P.genzotto,ph("…")),tie(P.nausicaa,P.jaime,"finished","942153048",null,[5,4],P.nausicaa),tie(P.david,ph("…")),tie(P.alcapa,P.santi,"live","942155048",17),
      tie(P.javiblanco,ph("…")),tie(P.mitxelino,P.sergio,"finished","942157048",null,[3,5],P.sergio),tie(P.zaoras,ph("…")),tie(P.membarak,P.dani,"live","942159048",20)
    ],
    [
      tie(ph("…"),ph("…")),tie(ph("…"),ph("…")),tie(ph("…"),ph("…")),tie(ph("…"),ph("…")),
      tie(ph("…"),P.nausicaa),tie(ph("…"),ph("…")),tie(ph("…"),P.sergio),tie(ph("…"),ph("…"))
    ],
    [tie(ph("…"),ph("…")),tie(ph("…"),ph("…")),tie(ph("…"),ph("…")),tie(ph("…"),ph("…"))],
    [tie(ph("…"),ph("…")),tie(ph("…"),ph("…"))],
    [tie(ph("…"),ph("…"))]
  ];
  const roundNames = ["Ronda preliminar","Dieciseisavos","Octavos","Cuartos","Semifinales","Final"];

  function decorate(rounds) {
    rounds.forEach((round,r) => round.forEach((match,i) => {match.r=r;match.i=i;match.id=`C${r}-${i}`;}));
    return rounds;
  }
  decorate(currentRounds);

  function archivedRounds() {
    const stored = window.CampeonesTemporadas?.selectedArchive()?.cup?.rounds;
    if (!Array.isArray(stored)) return null;
    return decorate(stored.map(round => (round.matches || round || []).map(item => {
      const normalizeParticipant = (value,fallback) => {
        if (!value) return ph("…");
        if (typeof value === "string") return player(value,value);
        return {...value,key:(value.key || value.name || value.team || fallback).toLowerCase()};
      };
      const a=normalizeParticipant(item.a || item.home,"…");
      const b=normalizeParticipant(item.b || item.away,"…");
      const winner=item.winner === "a" ? a : item.winner === "b" ? b : null;
      return tie(a,b,item.status || "finished",null,null,item.score || null,winner);
    })));
  }

  const state = match => match.status === "bye" ? "Pase directo" : match.status === "finished" ? "Finalizado" : match.status === "live" ? `En juego${match.progress === null ? "" : ` · ${match.progress}%`}` : "Por disputar";

  function participantRow(match,p) {
    const classes=["cup-team-row"];
    if (!p) classes.push("empty");
    if (p?.placeholder) classes.push("placeholder");
    if (resolvedWinner(match)?.key === p?.key) classes.push("winner");
    const inside=`<span class="cup-participant"><span class="cup-team-name">${esc(p?.team || "Plaza libre")}</span><span class="cup-player-name">${esc(p?.name || "")}</span></span>`;
    if (p && !p.placeholder) return `<button type="button" class="${classes.join(" ")}" data-cup-player="${esc(p.key)}" aria-label="Ver recorrido de ${esc(p.team)}">${inside}</button>`;
    return `<div class="${classes.join(" ")}">${inside}</div>`;
  }

  function scoreBox(match, archived=false) {
    const values=`<span>${match.score?.[0] ?? "—"}</span><span>${match.score?.[1] ?? "—"}</span>`;
    if (match.table && !archived) return `<a class="cup-score-stack" href="https://boardgamearena.com/table?table=${encodeURIComponent(match.table)}" target="_blank" rel="noopener" aria-label="Abrir el partido">${values}</a>`;
    return `<div class="cup-score-stack ${match.status === "bye" ? "bye" : "pending"}">${values}</div>`;
  }

  function card(match, archived=false) {
    const bye=match.status === "bye";
    const stateClass=match.status === "finished" ? "done" : match.status === "live" ? "live" : bye ? "bye" : "";
    // Los pases directos muestran solo equipo y jugador centrados. No son un partido ni tienen marcador.
    const contents=bye ? participantRow(match,match.a) : `${participantRow(match,match.a)}${scoreBox(match,archived)}${participantRow(match,match.b)}`;
    return `<article class="cup-tie${bye ? " cup-tie-bye" : ""}" data-cup-match="${match.id}"><div class="cup-tie-body"><div class="cup-team-list">${contents}</div></div><div class="cup-status ${stateClass}">${state(match)}</div></article>`;
  }

  function renderBoard(host, rounds, archived=false) {
    if (!host) return;
    if (!rounds.length) {host.innerHTML='<div class="cup-archive-empty">El cuadro histórico de esta temporada todavía no está disponible.</div>';return;}
    host.innerHTML=`<svg class="cup-connectors" aria-hidden="true"></svg>${rounds.map((round,r) => {const span=2**r;return `<section class="cup-round" data-cup-round="${r}"><div class="cup-round-title">${roundNames[r]}</div><div class="cup-round-slots">${round.map((match,i) => `<div class="cup-match-slot" style="grid-row:${1+i*span}/span ${span}">${card(match,archived)}</div>`).join("")}</div></section>`;}).join("")}`;
    requestAnimationFrame(() => drawLines(host));
  }

  function render() {
    renderBoard($("#cupBracket"), currentRounds, false);
  }

  function renderArchive(host=$("#historyCupBracket")) {
    renderBoard(host, archivedRounds() || [], true);
  }

  function renderParticipants(host=$("#allParticipants")) {
    if (!host) return;
    const rows = [...new Map(Object.values(P).map(person => [person.key, person])).values()]
      .sort((a,b) => Number.isFinite(b.initialElo) - Number.isFinite(a.initialElo) || (b.initialElo ?? -1) - (a.initialElo ?? -1) || a.team.localeCompare(b.team,"es"));
    host.innerHTML = `<p class="cup-elo-note">ELO de Campeones fijado antes del sorteo de la Copa · copia guardada el 1 de noviembre de 2026.</p>
      <div class="participants-table-wrap"><table class="participants-table cup-participants-table"><thead><tr><th>Equipo</th><th>Jugador</th><th>ELO en el sorteo</th></tr></thead><tbody>${rows.map(person => `<tr><td class="team-name">${esc(person.team)}</td><td>${esc(person.name)}</td><td class="participant-elo">${Number.isFinite(person.initialElo) ? person.initialElo : "—"}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function drawLines(board=$("#cupBracket")) {
    const svg=board?.querySelector(".cup-connectors");
    if (!board || !svg) return;
    svg.replaceChildren();
    if (window.innerWidth <= 760) return;
    const bounds=board.getBoundingClientRect();
    svg.setAttribute("viewBox",`0 0 ${bounds.width} ${board.offsetHeight}`);
    board.querySelectorAll("[data-cup-match]").forEach(node => {
      const parsed=node.dataset.cupMatch.match(/^C(\d+)-(\d+)$/);
      if (!parsed) return;
      const round=Number(parsed[1]),index=Number(parsed[2]);
      if (round === 5) return;
      const next=board.querySelector(`[data-cup-match="C${round+1}-${Math.floor(index/2)}"]`);
      if (!next) return;
      const a=node.getBoundingClientRect(),b=next.getBoundingClientRect();
      const x1=a.right-bounds.left,y1=a.top+a.height/2-bounds.top,x2=b.left-bounds.left,y2=b.top+b.height/2-bounds.top,middle=(x1+x2)/2;
      const path=document.createElementNS("http://www.w3.org/2000/svg","path");
      path.setAttribute("d",`M${x1},${y1}H${middle}V${y2}H${x2}`);svg.appendChild(path);
    });
  }

  function showTeam(key) {
    const archived = !$("#historyPage")?.hidden;
    const rounds = archived ? (archivedRounds() || []) : currentRounds;
    const matches=rounds.flat().filter(match => (match.a?.key === key || match.b?.key === key) && match.status !== "pending");
    const person=matches.flatMap(match => [match.a,match.b]).find(p => p?.key === key);
    if (!person) return;
    const cards=matches.map(match => {
      const own=match.a?.key === key ? 0 : 1,rival=own === 0 ? match.b : match.a;
      const winner=resolvedWinner(match);
      const result=match.status === "bye" ? "Pase directo" : match.status === "live" ? "En juego" : match.status !== "finished" ? "Por disputar" : !winner ? "Resultado por confirmar" : winner.key === key ? "Clasificado" : "Eliminado";
      const score=match.score ? `${match.score[own]} – ${match.score[1-own]}` : match.status === "bye" ? "—" : "En curso";
      const scoreView=match.table && !archived ? `<a class="cup-history-score" href="https://boardgamearena.com/table?table=${encodeURIComponent(match.table)}" target="_blank" rel="noopener" aria-label="Abrir el partido">${score}</a>` : `<strong class="cup-history-score static">${score}</strong>`;
      return `<section class="cup-history-round"><div class="cup-history-round-head"><span>${roundNames[match.r]}</span><b>${result}</b></div><div class="cup-history-opponent">${match.status === "bye" ? "Pase directo a la ronda siguiente" : `contra <strong>${esc(rival?.team || "…")}</strong><span>${esc(rival?.name || "")}</span>`}</div><div class="cup-history-result">${scoreView}</div></section>`;
    }).join("");
    const dialog=$("#cupTeamDialog");
    $("#cupTeamDialogContent").innerHTML=`<div class="cup-dialog-top"><div><h3 id="cupTeamDialogTitle">${esc(person.team)}</h3><p>${esc(person.name)}</p></div><button type="button" id="closeCupTeamDialog">Cerrar ×</button></div><p class="cup-history-summary">${matches.length} ${matches.length === 1 ? "eliminatoria registrada" : "eliminatorias registradas"}</p><div class="cup-history-list">${cards || "<p>Todavía no ha iniciado su participación.</p>"}</div>`;
    dialog.showModal();
  }

  document.addEventListener("click",event => {
    const playerButton=event.target.closest("[data-cup-player]");if (playerButton) showTeam(playerButton.dataset.cupPlayer);
    const jump=event.target.closest("[data-cup-jump]");
    if (jump) {
      const scroll=$("#cupBracketScroll");
      const finalCard=$("#cupBracket [data-cup-match=\"C5-0\"]");
      if (scroll) {
        const isFinal=jump.dataset.cupJump === "end";
        // Al seleccionar Fase final, centrar la tarjeta también en vertical.
        // No depender de un número de píxeles fijo: la altura es adaptable.
        const top=isFinal && finalCard
          ? finalCard.getBoundingClientRect().top-scroll.getBoundingClientRect().top+scroll.scrollTop
            - (scroll.clientHeight-finalCard.offsetHeight)/2
          : 0;
        scroll.scrollTo({left:isFinal ? scroll.scrollWidth-scroll.clientWidth : 0,
          top:Math.max(0,top),behavior:"smooth"});
      }
    }
    if (event.target.closest("#closeCupTeamDialog")) $("#cupTeamDialog")?.close();
  });
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(entries => entries.forEach(entry => drawLines(entry.target)));
    if ($("#cupBracket")) observer.observe($("#cupBracket"));
    if ($("#historyCupBracket")) observer.observe($("#historyCupBracket"));
  }
  // Actualizacion manual de Copa. Nunca se consulta BGA al abrir la pagina.
  // Un partido terminado solo se consolida tras disponer de dos goles por jugador.
  const CUP_WORKER = "https://campeones-bga-api.luis-rosaperez.workers.dev";
  const CUP_STORAGE = "campeones-copa-2.0.1-results";
  // Torneo de Copa acreditado por el organizador: https://es.boardgamearena.com/tournament?id=617974
  // Se permite una sobrescritura explicita para entornos de prueba.
  const CUP_TOURNAMENT_ID = "617974";
  const configuredTournamentId = () => {
    const value=String(window.CAMPEONES_COPA_TOURNAMENT_ID || CUP_TOURNAMENT_ID).trim();
    return /^\d+$/.test(value) ? value : null;
  };
  const normalized = value => String(value ?? "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const normalizedName = value => normalized(value);
  const knownPlayers = new Map(Object.values(P).map(person => [normalizedName(person.name),person]));
  // Alias acreditados entre BGA y la Copa. No se deducen equipos por orden.
  const aliases = new Map([
    ["serranitodeluxe",P.serranito],["calajan",P.calajan],
    ["murciegalo100",P.murciegalo],["jbcaturla",P.jbcat],
    ["radikalgyn",P.radikal]
  ].map(([name,person]) => [normalizedName(name),person]));
  const resolvePlayer = name => knownPlayers.get(normalizedName(name)) || aliases.get(normalizedName(name)) || null;
  const parseScore = value => value !== null && value !== undefined && /^\d+$/.test(String(value)) ? Number(value) : null;
  const hasScore = match => Array.isArray(match.score) && match.score.length === 2 && match.score.every(Number.isInteger);
  // No confundir «sin ganador almacenado» con «eliminado».
  // Un tanteo provisional no decide una eliminatoria: solo usar el resultado final.
  function resolvedWinner(match) {
    if(match.status === "bye") return match.a || null;
    if(match.status !== "finished") return null;
    if(hasScore(match) && match.score[0] !== match.score[1])
      return match.score[0] > match.score[1] ? match.a : match.b;
    return match.winner || null;
  }
  const matchLookup = () => new Map(currentRounds.flat().filter(m=>m.table).map(m=>[String(m.table),m]));

  function validatedPlayerScores(match, detail) {
    // La misma fuente que usa Liga: detail.players con goles vinculados
    // al jugador. Nunca emparejamos Nankatsu/Toho por orden ni por tanteo.
    const source=detail?.players ?? detail?.data?.players;
    const players=Array.isArray(source) ? source : source && typeof source === "object" ? Object.values(source) : [];
    const find=person => players.filter(p => normalizedName(p?.name) === normalizedName(person?.name));
    const a=find(match.a), b=find(match.b);
    if(a.length !== 1 || b.length !== 1) return null;
    const x=parseScore(a[0]?.score),y=parseScore(b[0]?.score);
    if(x !== null && y !== null) return [x,y];
    // Respaldo solo si el Worker acredita el equipo BGA de AMBOS jugadores.
    // Nunca asignar goles por el orden de la lista ni por quien va ganando.
    const teamA=String(a[0]?.team || ""),teamB=String(b[0]?.team || "");
    if(!["Nankatsu","Toho"].includes(teamA) ||
       !["Nankatsu","Toho"].includes(teamB) || teamA===teamB) return null;
    const scoreByTeam=detail?.score ?? detail?.data?.score;
    const first=parseScore(scoreByTeam?.[teamA]),second=parseScore(scoreByTeam?.[teamB]);
    return first !== null && second !== null ? [first,second] : null;
  }
  function applyValidatedDetail(match, detail) {
    const score=validatedPlayerScores(match,detail);
    if(!score) return false;
    match.score=score;
    if (match.status === "finished" && score[0] !== score[1]) match.winner=score[0] > score[1] ? match.a : match.b;
    return true;
  }
  function saveCupResults() {
    try {
      const matches=currentRounds.flat().filter(m=>m.table && (hasScore(m) || m.status === "finished"))
        .map(m=>({table:String(m.table),score:hasScore(m)?m.score:null,status:m.status,progress:m.progress,
          winner:m.winner?.key || null}));
      localStorage.setItem(CUP_STORAGE,JSON.stringify({version:2,time:new Date().toISOString(),matches}));
    }catch(error){console.warn("Copa: no se pudo almacenar el estado",error);}
  }
  function restoreCupResults() {
    try {
      const raw=JSON.parse(localStorage.getItem(CUP_STORAGE)||"null");
      const byTable=matchLookup();
      for(const item of raw?.matches || []) {
        const m=byTable.get(String(item.table));
        if(!m || m.status === "bye") continue;
        if(Array.isArray(item.score) && item.score.length === 2 && item.score.every(Number.isInteger) && item.score.every(n=>n>=0)) m.score=item.score;
        if(item.status === "finished" && hasScore(m)) m.status="finished";
        else if(m.status !== "finished" && item.status === "live") m.status="live";
        if(Number.isFinite(item.progress) && m.status !== "finished") m.progress=item.progress;
        if(m.status === "finished" && hasScore(m) && m.score[0] !== m.score[1]) m.winner=m.score[0]>m.score[1]?m.a:m.b;
      }
      // No reescribir la fecha de consulta cuando solo se muestran datos locales.
      if(raw?.time){const el=$("#cupSyncStatus");if(el)el.textContent=`Última consulta: ${new Date(raw.time).toLocaleString("es-ES")}`;}
    }catch(error){console.warn("Copa: no se pudo recuperar la copia local",error);}
  }
  function overviewRows(payload) {
    const data=payload?.data ?? payload;
    const players=new Map();
    const ps=data?.players || [];
    for(const [key,entry] of (Array.isArray(ps) ? ps.map((p,i)=>[String(i),p]) : Object.entries(ps))) {
      if(typeof entry === "string") players.set(key,entry);
      else if(entry && typeof entry === "object") {
        const id=entry.player_id ?? entry.id ?? key;
        const name=entry.name ?? entry.player_name ?? entry.playerName;
        if(name) players.set(String(id),String(name));
      }
    }
    const steps=data?.steps || [];
    const list=Array.isArray(steps) ? steps : Object.values(steps);
    const rows=[];
    for(const [round,step] of list.entries()) {
      const games=step?.matches ?? step?.matchs ?? step?.games ?? [];
      const gameList=Array.isArray(games) ? games : Object.values(games);
      for(const game of gameList){
        const source=game?.players ?? game?.player ?? game?.participants ?? [];
        const entries=Array.isArray(source) ? source.map((p,i)=>[String(i),p]) : Object.entries(source);
        let names=entries.map(([key,entry])=>{
          if(typeof entry === "string" || typeof entry === "number") return players.get(String(entry)) || (typeof entry === "string" && !/^\d+$/.test(entry) ? entry : null);
          const nested=entry?.player && typeof entry.player === "object" ? entry.player : null;
          const id=entry?.player_id ?? entry?.playerId ?? entry?.id ?? nested?.player_id ?? nested?.id ?? key;
          return entry?.player_name ?? entry?.playerName ?? entry?.name ?? entry?.fullname ?? nested?.name ?? players.get(String(id)) ?? null;
        }).filter(Boolean);
        // BGA tambien puede representar ambos jugadores como campos separados.
        if(names.length!==2){
          const ids=[game?.player1_id ?? game?.player1Id ?? game?.player_1_id ?? game?.player1,
            game?.player2_id ?? game?.player2Id ?? game?.player_2_id ?? game?.player2];
          if(ids.every(v=>v!==null && v!==undefined)){
            names=ids.map(v=> typeof v==="object" ?
              (v.player_name ?? v.playerName ?? v.name ?? players.get(String(v.player_id ?? v.id))) :
              (players.get(String(v)) || (typeof v==="string" && !/^\d+$/.test(v) ? v : null))).filter(Boolean);
          }
        }
        if(names.length!==2) continue;
        const a=resolvePlayer(names[0]),b=resolvePlayer(names[1]);
        if(!a || !b || a.key===b.key) continue;
        const table=game?.tableId ?? game?.table_id ?? game?.table;
        const statusText=String(game?.status ?? "").toLowerCase();
        const tableText=String(game?.tableStatus ?? game?.table_status ?? "").toLowerCase();
        const finished=/finished|complete|archive|ended/.test(`${statusText} ${tableText}`);
        const cancelled=/cancel|void/.test(`${statusText} ${tableText}`);
        const progression=Number(game?.tableProgression ?? game?.table_progression ?? game?.progression);
        rows.push({round,a,b,table:table ? String(table) : null,
          status:cancelled?"pending":finished?"finished":(table && Number.isFinite(progression) && progression>0)?"live":"pending",
          progress:Number.isFinite(progression) && progression>=0 ? progression : null});
      }
    }
    return rows;
  }
  function synchronizeOverview(rows) {
    // Actualizar solo una mesa o pareja univoca presente en el cuadro.
    // Sin la correspondencia del torneo no se inventan posiciones de ronda.
    let changed=0, unplaced=0;
    const lookup=matchLookup();
    for(const item of rows) {
      let match=item.table ? lookup.get(item.table) : null;
      if(!match){
        const possible=currentRounds.flat().filter(m=>m.status!=="bye" && m.a && m.b && !m.a.placeholder && !m.b.placeholder
          && [m.a.key,m.b.key].sort().join("|")===[item.a.key,item.b.key].sort().join("|"));
        if(possible.length===1) match=possible[0];
      }
      if(!match){unplaced++;continue;}
      if(item.table && match.table && String(match.table)!==item.table) {unplaced++;continue;}
      if(item.table){match.table=item.table;lookup.set(item.table,match);}
      if(match.status!=="finished" && item.status!=="pending") match.status=item.status;
      if(match.status!=="finished" && item.progress!==null) match.progress=item.progress;
      changed++;
    }
    return {changed,unplaced};
  }
  function propagateKnownWinners(){
    let added=0;
    for(let r=0;r<currentRounds.length-1;r++)for(const match of currentRounds[r]){
      const winner=resolvedWinner(match);
      if(match.status!=="finished" || !winner) continue;
      const next=currentRounds[r+1][Math.floor(match.i/2)];
      if(!next) continue;
      const side=match.i%2===0?"a":"b";
      if(next[side]?.placeholder){next[side]=winner;added++;}
    }
    return added;
  }
  async function cupFetch(url){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(url,{signal:controller.signal,cache:"no-store"});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const json=await response.json();
      if(String(json?.status)==="0") throw new Error(json?.error || "El Worker no ha podido recuperar datos");
      return json;
    }finally{clearTimeout(timer);}
  }
  async function refreshCup(){
    const button=$("#refreshCupButton"),status=$("#cupSyncStatus");
    if(button?.disabled) return;
    if(button){button.disabled=true;button.textContent="Actualizando…";}
    let fromOverview=0,unplaced=0,checked=0,valid=0,errors=0;
    try {
      const tournamentId=configuredTournamentId();
      if(tournamentId){
        try{
          const overview=await cupFetch(`${CUP_WORKER}/?id=${encodeURIComponent(tournamentId)}&includeElo=0&refresh=1`);
          const rows=overviewRows(overview);
          if(!rows.length) throw new Error("La respuesta no contiene eliminatorias identificables");
          const summary=synchronizeOverview(rows);
          fromOverview=summary.changed;unplaced=summary.unplaced;
        }catch(error){errors++;console.warn("Copa: fallo al obtener el cuadro del torneo",error);}
      }
      const matches=currentRounds.flat().filter(m=>m.table && m.status!=="bye" &&
        !(m.status==="finished" && hasScore(m)));
      // Dos mesas concurrentes, igual que Liga. No tocar resultados finalizados ya validados.
      for(let i=0;i<matches.length;i+=2){
        await Promise.all(matches.slice(i,i+2).map(async match=>{
          try{
            const detail=await cupFetch(`${CUP_WORKER}/?match=${encodeURIComponent(match.table)}${match.status==="finished"?"&archived=1":""}&refresh=1`);
            checked++;
            if(applyValidatedDetail(match,detail)) valid++;
          }catch(error){errors++;console.warn("Copa: error al consultar mesa",match.table,error);}
        }));
      }
      const propagated=propagateKnownWinners();
      if(valid || fromOverview || propagated){saveCupResults();render();}
      if(status) {
        const note=`${valid} marcador(es) verificados; ${fromOverview} partido(s) vinculados al cuadro`;
        const limitations=[];
        if(!tournamentId) limitations.push("sin ID de torneo configurado");
        if(unplaced) limitations.push(`${unplaced} emparejamiento(s) por ubicar`);
        if(errors) limitations.push(`${errors} consulta(s) fallidas`);
        if(!valid && !fromOverview) limitations.push("se conservan los datos anteriores");
        status.textContent=`${note} · ${new Date().toLocaleTimeString("es-ES")}${limitations.length?` · ${limitations.join("; ")}`:""}`;
      }
    }finally{if(button){button.disabled=false;button.textContent="Actualizar datos";}}
  }
  restoreCupResults();
  propagateKnownWinners();
  $("#refreshCupButton")?.addEventListener("click",refreshCup);
  window.CampeonesCopaDebug={overviewRows,validatedPlayerScores,synchronizeOverview,refreshCup};
  window.CampeonesCopa={render,renderArchive,renderParticipants};
  render();
})();
