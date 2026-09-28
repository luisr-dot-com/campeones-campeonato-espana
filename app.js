const leagueData = {"1": [{"name": "genzotto_"}, {"name": "l1b3rty"}, {"name": "pmp"}, {"name": "Turrutu"}, {"name": "amilca"}, {"name": "NausicaaValle"}, {"name": "Alruhi"}, {"name": "Zaoras"}], "2": [{"name": "Membarak"}, {"name": "alcapa7"}, {"name": "Galadan_"}, {"name": "David-CT"}, {"name": "javi_onetti"}, {"name": "Jaime_2386"}, {"name": "murciegalo100"}, {"name": "Mareal"}], "3": [{"name": "Kastiel"}, {"name": "mitxelino"}, {"name": "alvarito_rip"}, {"name": "Cristian Alarcón"}, {"name": "jersan"}, {"name": "Stoicakovic"}, {"name": "Belce84_"}, {"name": "SaKio"}], "4": [{"name": "riribar"}, {"name": "Azzipp"}, {"name": "DaniMassaro"}, {"name": "Rob Avi"}, {"name": "TonioBanana"}, {"name": "Sempresereno"}, {"name": "Serranito_Deluxd"}, {"name": "JBCat"}], "5": [{"name": "Rob3r"}, {"name": "Pysic"}, {"name": "Calajan"}, {"name": "Datoro79"}, {"name": "Pocke11"}, {"name": "Santi21gc"}, {"name": "javimuzzic"}, {"name": "Radikalgyn"}], "6": [{"name": "Rafajam86"}, {"name": "torcuatoonorato"}, {"name": "merifa"}, {"name": "oreo1988"}, {"name": "Sergio_raijin"}]};

const teamNames={
  "pmp":"REAL SOCIEDAD","genzotto_":"TOXIRIA","Alruhi":"MODERNONIA FC","David-CT":"REAL DREAMS",
  "javi_onetti":"HARITOS","Zaoras":"ANTANASIO FC","NausicaaValle":"CORLEONE FC","Stoicakovic":"YOTSUGI FC",
  "murciegalo100":"SAN FRANCIS","Rafajam86":"UD DE COJOS","oreo1988":"Atl. carajillo","TonioBanana":"Banana FC",
  "DaniMassaro":"Derry FC","Galadan_":"Deportivo Valdevacas","Jaime_2386":"La Raya Vallecana","Sempresereno":"Katanazo FC",
  "Serranito_Deluxd":"SERRANITAZO TEAM","mitxelino":"Esteagua de Solares","Calajan":"Furano FC","Pysic":"Rápido de Bouzas FC",
  "Santi21gc":"Unión deportiva","alcapa7":"Alcapas FC","javimuzzic":"Muzzic FC","l1b3rty":"Mark Liendres FC",
  "torcuatoonorato":"Nothingan Miedo","Belce84_":"Me Falla el Corazon","Pocke11":"Piedrahíta"
};
const teamOf=name=>teamNames[name]||`FC ${name}`;

const divisions = Object.fromEntries(
  Object.keys(leagueData).map(k => [Number(k), {name:`${k}ª División`}])
);
divisions[1].name="1ª División";
divisions[2].name="2ª División";
divisions[3].name="3ª División";

let activeDivision=1;
let activeChampView="clasificacion";

function divisionPlayers(div){
  return leagueData[String(div)].map(p=>({...p,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}));
}

const demoResults={};

function standings(div){
  const ps=divisionPlayers(div), rs=demoResults[String(div)]||[];
  rs.forEach(([home,away,hs,as])=>{
    const a=ps.find(p=>p.name===home), b=ps.find(p=>p.name===away); if(!a||!b)return;
    a.pj++;b.pj++;a.gf+=hs;a.gc+=as;b.gf+=as;b.gc+=hs;
    if(hs>as){a.pg++;b.pp++;a.pts+=3}
    else if(hs<as){b.pg++;a.pp++;b.pts+=3}
    else{a.pe++;b.pe++;a.pts++;b.pts++}
  });
  return ps.sort((a,b)=>b.pts-a.pts||((b.gf-b.gc)-(a.gf-a.gc))||b.gf-a.gf||a.name.localeCompare(b.name));
}

function schedule(players){
  let arr=players.map(p=>p.name);
  if(arr.length%2) arr.push(null);
  const n=arr.length, rounds=[];
  for(let r=0;r<n-1;r++){
    const games=[];
    for(let i=0;i<n/2;i++){
      const a=arr[i],b=arr[n-1-i];
      if(a&&b) games.push(r%2===0?[a,b]:[b,a]);
    }
    rounds.push(games);
    arr=[arr[0],arr[n-1],...arr.slice(1,n-1)];
  }
  return rounds;
}

function renderDivisionTabs(){
  const host=document.querySelector("#divisionTabs");
  host.innerHTML=Object.keys(divisions).map(d=>`<button class="division-tab ${Number(d)===activeDivision?"active":""}" data-division="${d}">${divisions[d].name}</button>`).join("");
  host.querySelectorAll(".division-tab").forEach(b=>b.onclick=()=>{activeDivision=Number(b.dataset.division);renderChampionship();});
}

function renderStandings(){
  const rows=standings(activeDivision);
  const lastDivision=Object.keys(divisions).length;
  document.querySelector("#standingsTable tbody").innerHTML=rows.map((p,i)=>{
    const promoted = activeDivision===1 ? i===0 : i<2;
    const relegated = activeDivision<lastDivision && i>=rows.length-2;
    return `<tr class="${promoted?"promoted":relegated?"relegated":""}">
      <td class="position">${i+1}</td><td class="player-name">${teamOf(p.name)}</td>
      <td>${p.pj}</td><td>${p.pg}</td><td>${p.pe}</td><td>${p.pp}</td>
      <td>${p.gf}</td><td>${p.gc}</td><td>${p.gf-p.gc}</td><td class="points">${p.pts}</td>
    </tr>`;
  }).join("");
}

function renderCalendar(){
  const el=document.querySelector("#calendarRounds");
  const rounds=schedule(divisionPlayers(activeDivision));
  el.innerHTML=rounds.map((games,ri)=>`<section class="calendar-round"><h3>Jornada ${ri+1}</h3><div class="calendar-games">${games.map(([a,b])=>`<div class="calendar-game match-card"><div class="match-team home">${teamOf(a)}</div><div class="match-score">0 <span>–</span> 0</div><div class="match-team away">${teamOf(b)}</div><div class="match-status status-pending">Sin comenzar</div></div>`).join("")}</div></section>`).join("");
}

function updateDivisionBanner(){
  const banner=document.querySelector("#divisionBanner");
  banner.className=`division-banner division-theme-${activeDivision}`;
  const page=document.querySelector("#championshipPage");
  page.className=`app-page division-theme-${activeDivision}`;
  document.querySelector("#divisionBannerTitle").textContent=divisions[activeDivision].name;

  const lastDivision=Object.keys(divisions).length;
  const promotion=document.querySelector("#legendPromotion");
  const relegation=document.querySelector("#legendRelegation");
  if(promotion) promotion.innerHTML=`<i class="legend-dot champion"></i> ${activeDivision===1?"Campeón":"Ascenso"}`;
  if(relegation) relegation.hidden=activeDivision===lastDivision;
}

function renderParticipants(){

  const rows=[];
  Object.keys(divisions).forEach(d=>leagueData[d].forEach(p=>rows.push({name:p.name,team:teamOf(p.name),division:divisions[d].name})));
  document.querySelector("#allParticipants").innerHTML=`<div class="participants-table-wrap"><table class="participants-table"><thead><tr><th>Equipo</th><th>Jugador</th><th>División</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="team-name">${r.team}</td><td>${r.name}</td><td><span class="division-pill">${r.division}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function renderChampionship(){renderDivisionTabs();renderStandings();renderCalendar();updateDivisionBanner();}

function showPage(page){
  document.querySelectorAll(".app-page").forEach(p=>p.hidden=true);
  document.querySelector(`#${page}Page`).hidden=false;
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelector("#championshipLink").onclick=(e)=>{e.preventDefault();showPage("championship");};
document.querySelector("#participantsLink").onclick=(e)=>{e.preventDefault();showPage("participants");};
document.querySelector("#rulesLink").onclick=(e)=>{e.preventDefault();showPage("rules");};


renderChampionship();
renderParticipants();
showPage("championship");

document.querySelector("#brandHome")?.addEventListener("click",(e)=>{e.preventDefault();showPage("championship");});
