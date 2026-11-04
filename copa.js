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
    if (match.winner === p) classes.push("winner");
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
    const second=match.status === "bye" ? ph("Pase directo") : match.b;
    const stateClass=match.status === "finished" ? "done" : match.status === "live" ? "live" : match.status === "bye" ? "bye" : "";
    return `<article class="cup-tie" data-cup-match="${match.id}"><div class="cup-tie-body"><div class="cup-team-list">${participantRow(match,match.a)}${participantRow(match,second)}</div>${scoreBox(match,archived)}</div><div class="cup-status ${stateClass}">${state(match)}</div></article>`;
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
      const result=match.status === "bye" ? "Pase directo" : match.status === "live" ? "En juego" : match.winner?.key === key ? "Clasificado" : "Eliminado";
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
    const jump=event.target.closest("[data-cup-jump]");if (jump) {const scroll=$("#cupBracketScroll");if (scroll) scroll.scrollTo({left:jump.dataset.cupJump === "end" ? scroll.scrollWidth-scroll.clientWidth : 0,behavior:"smooth"});}
    if (event.target.closest("#closeCupTeamDialog")) $("#cupTeamDialog")?.close();
  });
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(entries => entries.forEach(entry => drawLines(entry.target)));
    if ($("#cupBracket")) observer.observe($("#cupBracket"));
    if ($("#historyCupBracket")) observer.observe($("#historyCupBracket"));
  }
  window.CampeonesCopa={render,renderArchive,renderParticipants};
  render();
})();
