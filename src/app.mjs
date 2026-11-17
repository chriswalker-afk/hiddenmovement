import { MAP, MONSTER_SPAWNS } from './map.mjs';
import { bearingBetween, formatBearing, sectorBounds } from './geometry.mjs';
import {
  SETTINGS, beginGame, createGame, endHunterTurn, hunterMove,
  monsterMove, revealTurn, sealTurn, selectMonsterStart, viewForCurrentScreen
} from './engine.mjs';

const mount = document.getElementById('app');
const game = createGame();
let selectedSpawn = MONSTER_SPAWNS[0];
let plotClue = false;
let showHowTo = false;
const esc = value => String(value).replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const nameOf = id => MAP.nodes[id]?.name || 'Unknown';
const roundCaption = round => round === 0 ? 'at the beginning of the hunt' : 'at the end of round ' + round;

function start() {
  const result = beginGame(game);
  if (result.ok) {
    plotClue = false;
    selectedSpawn = MONSTER_SPAWNS[0];
  }
  render();
}

function titleBar(mode, view) {
  return '<header class="app-header">' +
    '<a class="brand" href="#" id="brand-link" aria-label="Return to Shadow Bearings home">' +
    '<span class="brand-symbol" aria-hidden="true">✦</span><span>SHADOW <em>BEARINGS</em></span></a>' +
    '<div class="header-right"><span class="eyebrow">THE HOLLOW MOOR</span>' +
    (mode ? '<span class="round-indicator">' + esc(view.round || 1) + ' <span>/ ' +
      esc(view.maxRounds || SETTINGS.maxRounds) + ' ROUNDS</span></span>' : '') +
    '</div></header>';
}

function homeHtml() {
  return '<div class="home-shell">' +
    '<div class="home-glow" aria-hidden="true"></div>' +
    '<div class="home-content">' +
      '<div class="home-topline"><span class="small-star">✧</span> A GAME OF DIRECTIONS AND DECEPTION <span class="small-star">✧</span></div>' +
      '<div class="home-crest" aria-hidden="true"><span>N</span><b>✦</b><span>S</span></div>' +
      '<h1>SHADOW<br><i>BEARINGS</i></h1>' +
      '<p class="home-subtitle">One hunter. One hidden monster. A trail of bearings through the Hollow Moor.</p>' +
      '<div class="mode-grid">' +
        '<button id="start-two" class="mode-card">' +
          '<span class="mode-icon" aria-hidden="true">⚔</span><strong>PASS &amp; PLAY</strong>' +
          '<span>Two players • One device</span><small>Take turns using the map in secret</small>' +
          '<span class="mode-link">BEGIN HUNT <span aria-hidden="true">→</span></span></button>' +
        '<div class="mode-card disabled-mode" aria-disabled="true">' +
          '<span class="mode-icon" aria-hidden="true">◈</span><strong>SOLO HUNT</strong>' +
          '<span>One player • Monster AI</span><small>Coming in the next build</small>' +
          '<span class="mode-link subdued">COMING SOON</span></div>' +
      '</div>' +
      '<button class="text-button" id="how-toggle" aria-expanded="' + showHowTo + '">HOW TO PLAY <span aria-hidden="true">⌄</span></button>' +
      (showHowTo ? howToHtml() : '') +
      '<p class="home-footer">CHAPTER I · THE HOLLOW MOOR <span>◈</span> FIRST PLAYABLE PROTOTYPE</p>' +
    '</div></div>';
}

function howToHtml() {
  return '<div class="how-panel"><div><b>01 — Navigate</b><p>Move along connected roads by entering a three-figure bearing, measured clockwise from north (for example 045°, 180°, 300°).</p></div>' +
    '<div><b>02 — Investigate</b><p>The hunter may travel two roads per turn. A recent monster trail at a location grants a clue about its last recorded bearing.</p></div>' +
    '<div><b>03 — Stay Hidden</b><p>The monster moves one road after the hunter. Pass the device and look away on every handoff screen. The hunter wins by reaching the monster; the monster wins by surviving the final round.</p></div></div>';
}

function handoffHtml(phase) {
  const toMonster = phase !== 'pass-hunter';
  const message = toMonster
    ? 'Pass this device to the monster and look away'
    : 'Pass this device to the hunter and look away';
  // Only the handoff instruction and the necessary reveal control are visible.
  return '<main class="handoff-screen"><div class="handoff-content">' +
    '<h1>' + esc(message) + '</h1>' +
    '<button id="reveal" class="reveal-button">I am the ' +
    (toMonster ? 'Monster' : 'Hunter') + ' — reveal my turn</button>' +
    '</div></main>';
}

function treeCluster(cx,cy,index) {
  let html = '';
  for(let i=0;i<9;i++) {
    const x=cx + Math.sin(i*2.4+index) * (20+i*3);
    const y=cy + Math.cos(i*3.7+index) * (17+i*2);
    const r=10+(i%4)*3;
    html += '<path d="M'+x.toFixed(1)+' '+(y-r).toFixed(1)+' l'+(r*.72).toFixed(1)+' '+(r*1.6).toFixed(1)+' h-'+(r*1.44).toFixed(1)+' Z" fill="#28524e" opacity="'+(.16+(i%3)*.07)+'"/>';
  }
  return html;
}

function sectorShape(origin,center,half) {
  const r=1250, rad=Math.PI/180;
  const point=a=>[origin.x+r*Math.sin(a*rad),origin.y-r*Math.cos(a*rad)];
  const first=point(center-half);
  const last=point(center+half);
  return 'M '+origin.x+' '+origin.y+' L '+first[0]+' '+first[1]+' A '+r+' '+r+' 0 '+(half>90?1:0)+' 1 '+last[0]+' '+last[1]+' Z';
}

function mapSvg(view) {
  const isMonster=view.phase==='monster' || view.phase==='monster-setup';
  const isOver=view.phase==='over';
  const paths = MAP.edges.map(([a,b]) => {
    const p=MAP.nodes[a],q=MAP.nodes[b];
    return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" class="road-base"/>' +
      '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" class="road-top"/>';
  }).join('');
  const trees = [[115,92],[280,90],[505,70],[675,110],[930,190],[125,510],[320,660],[515,535],[735,635],[885,675]]
    .map((pt,i)=>treeCluster(pt[0],pt[1],i)).join('');
  const clues= view.phase==='hunter' && plotClue ? view.clues.slice(0,1) : [];
  const plotted=clues.map(clue => {
    const p=MAP.nodes[clue.place];
    return '<path class="clue-sector" d="'+sectorShape(p,clue.sectorCenter,clue.halfWidth)+'"/>' +
      '<circle cx="'+p.x+'" cy="'+p.y+'" r="24" class="clue-origin"/>';
  }).join('');
  const hunterTrail=(view.phase==='hunter'||isOver)?view.hunterTrail:[];
  const hunterPath=hunterTrail.length>1 ?
    '<polyline class="hunter-trail" points="'+hunterTrail.map(id=>MAP.nodes[id].x+','+MAP.nodes[id].y).join(' ')+'"/>' : '';
  const monsterTrail=(view.phase==='monster'||isOver)?view.trail:[];
  const monsterPath=monsterTrail.length>1 ?
    '<polyline class="monster-trail" points="'+monsterTrail.map(t=>MAP.nodes[t.node].x+','+MAP.nodes[t.node].y).join(' ')+'"/>' : '';
  const eligible=new Set(view.eligibleSpawns||[]);
  const monsterNeighbours = view.phase==='monster' ? new Set(MAP.adjacency[view.monster]) : new Set();
  const dots=Object.values(MAP.nodes).map(n=>{
    const isHunter=view.hunter===n.id;
    const isMonsterHere=(view.phase==='monster'||isOver)&&view.monster===n.id;
    const possibleStart=view.phase==='monster-setup'&&eligible.has(n.id);
    const selected=view.phase==='monster-setup'&&selectedSpawn===n.id;
    const target=monsterNeighbours.has(n.id);
    const hasClue=view.phase==='hunter'&&view.clues.some(c=>c.place===n.id);
    const cls=['node'];
    if(isHunter)cls.push('hunter-location');
    if(isMonsterHere)cls.push('monster-location');
    if(target)cls.push('monster-target');
    if(possibleStart)cls.push('spawnable');
    if(selected)cls.push('selected');
    if(hasClue)cls.push('has-clue');
    const nodeBody='<circle r="15" class="node-ring"/><circle r="8" class="node-core"/>' +
      (isMonsterHere?'<text y="4" text-anchor="middle" class="person-symbol">◆</text>':
       isHunter?'<text y="4" text-anchor="middle" class="person-symbol">✦</text>':'')+
      '<text y="-23" class="node-label" text-anchor="middle">'+esc(n.name)+'</text>';
    if(possibleStart) return '<g role="button" tabindex="0" aria-label="Choose '+esc(n.name)+' as monster starting position" class="'+cls.join(' ')+'" data-spawn="'+n.id+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
    return '<g class="'+cls.join(' ')+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
  }).join('');
  return '<svg class="world-svg" viewBox="0 0 1000 720" aria-label="Connected map of fourteen locations in the Hollow Moor. North is up." role="img" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="moor-bg" x2="1" y2="1"><stop stop-color="#1a353b"/><stop offset=".52" stop-color="#243e3d"/><stop offset="1" stop-color="#172b38"/></linearGradient>' +
      '<pattern id="moor-grain" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1" fill="#b7c8b7" opacity=".075"/><circle cx="25" cy="26" r="1" fill="#b7c8b7" opacity=".08"/></pattern>' +
      '<filter id="moor-glow"><feGaussianBlur stdDeviation="11"/></filter>' +
    '</defs>' +
    '<rect x="0" y="0" width="1000" height="720" fill="url(#moor-bg)"/>' +
    '<path d="M0 60Q180 30 280 70T530 30T820 75T1000 42V0H0Z" fill="#284840" opacity=".5"/>' +
    '<path d="M0 570Q220 520 390 610T730 580T1000 530V720H0Z" fill="#34514a" opacity=".33"/>' +
    '<path d="M-60 140 C70 180 150 110 285 180 S520 260 600 315 S790 420 1060 360" stroke="#0c2633" stroke-width="76" fill="none" opacity=".75"/>' +
    '<path d="M-60 140 C70 180 150 110 285 180 S520 260 600 315 S790 420 1060 360" stroke="#356478" stroke-width="50" fill="none" opacity=".85"/>' +
    '<path d="M-60 140 C70 180 150 110 285 180 S520 260 600 315 S790 420 1060 360" stroke="#7aa7a9" stroke-width="2" stroke-dasharray="5 25" fill="none" opacity=".35"/>' +
    '<ellipse cx="110" cy="645" rx="140" ry="62" fill="#55766a" opacity=".24"/>' +
    '<ellipse cx="864" cy="588" rx="128" ry="70" fill="#547063" opacity=".27"/>' +
    '<g>'+trees+'</g>' +
    '<path d="M280 570L335 525L355 552L410 520L455 590" fill="none" stroke="#a0a995" stroke-width="2" opacity=".24"/>' +
    '<text x="65" y="70" class="terrain-label">BLACKPINE WOODS</text>' +
    '<text x="633" y="53" class="terrain-label">ASH RIDGE</text>' +
    '<text x="41" y="691" class="terrain-label">HOLLOW MARSHES</text>' +
    '<text x="691" y="691" class="terrain-label">THE STANDING STONES</text>' +
    '<g class="roads">'+paths+'</g>' +
    '<g>'+plotted+'</g>' +
    hunterPath+monsterPath+
    '<g class="nodes">'+dots+'</g>' +
    '<g transform="translate(945 73)" class="north-mark"><circle r="27" fill="#0b1b27" fill-opacity=".72" stroke="#8aafaa" stroke-opacity=".55"/><path d="M0-21L6 2 0-2-6 2Z" fill="#d0b47b"/><path d="M0 21L6 2 0 6-6 2Z" fill="#7c969a"/><text y="-34" text-anchor="middle">N</text></g>' +
    '<rect x="10" y="10" width="980" height="700" rx="7" fill="none" stroke="#8b9989" stroke-opacity=".45" stroke-width="2"/>' +
    '<rect width="1000" height="720" fill="url(#moor-grain)" pointer-events="none"/>' +
    '</svg>';
}

function mapFrame(view) {
  return '<div class="map-section">' +
    '<div class="map-heading"><div><span class="eyebrow">CHAPTER I · THE HOLLOW MOOR</span><h2>Map of the moor</h2></div>' +
    '<span class="map-chip"><span class="map-chip-dot"></span> NORTH IS UP</span></div>' +
    '<div class="map-frame">'+mapSvg(view)+'</div>' +
    '<div class="map-key">' +
      '<span><i class="key-spot key-hunter"></i> Hunter</span>' +
      ((view.phase==='monster'||view.phase==='over')?'<span><i class="key-spot key-monster"></i> Monster</span>':'') +
      '<span><i class="key-spot key-route"></i> Connected route</span>' +
      ((view.phase==='monster-setup')?'<span><i class="key-spot key-available"></i> Eligible start</span>':'')+
    '</div></div>';
}

function movementForm(view) {
  const monster = view.phase === 'monster';
  const location=monster?view.monster:view.hunter;
  const place=nameOf(location);
  const left=monster?1:view.stepsLeft;
  const adjacent=MAP.adjacency[location].map(id=>nameOf(id)).join(' · ');
  return '<section class="panel move-panel">' +
    '<div class="panel-top"><span class="eyebrow">'+(monster?'MONSTER NAVIGATION':'HUNTER NAVIGATION')+'</span>' +
      '<span class="steps-badge">'+left+' '+(left===1?'MOVE':'MOVES')+' LEFT</span></div>' +
    '<div class="you-are">Current location</div><h3>'+esc(place)+'</h3>' +
    '<p class="muted compact">Roads lead to: '+esc(adjacent)+'</p>' +
    '<form id="move-form" class="bearing-form">' +
      '<label for="bearing-input">Your next three-figure bearing</label>' +
      '<div class="bearing-entry"><input id="bearing-input" name="bearing" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="4" placeholder="045" pattern="[0-9]{3}°?" '+(left===0?'disabled':'')+' aria-describedby="bearing-help"/><span aria-hidden="true">°</span><button type="submit" '+(left===0?'disabled':'')+'>MOVE →</button></div>' +
      '<small id="bearing-help">Clockwise from north · within ±6° of a connected road</small>' +
    '</form>' +
    (!monster ? '<button id="end-turn" class="secondary-button">FINISH HUNTER TURN <span aria-hidden="true">→</span></button>' : '') +
    '</section>';
}

function clueSentence(clue) {
  const place=nameOf(clue.place);
  const orientation=clue.kind==='reverse' ?
    'Bearing of <b>'+esc(place)+'</b> from the <b>monster</b>' :
    'Bearing of the <b>monster</b> from <b>'+esc(place)+'</b>';
  return orientation + ' ' + esc(roundCaption(clue.observedRound)) + ' was between ' +
    '<strong>'+esc(clue.bounds[0])+'</strong> and <strong>'+esc(clue.bounds[1])+'</strong>.';
}

function notebook(view) {
  return '<section class="panel notebook-panel">' +
    '<div class="panel-top"><span class="eyebrow">YOUR EVIDENCE</span><span class="steps-badge">'+view.clues.length+' '+(view.clues.length===1?'CLUE':'CLUES')+'</span></div>' +
    '<h3>Field notebook</h3>' +
    (view.clues.length ? '<button id="plot-toggle" class="plot-toggle" aria-pressed="'+plotClue+'">'+(plotClue?'HIDE':'PLOT')+' NEWEST CLUE ON MAP <span aria-hidden="true">↗</span></button>' +
      '<div class="clue-list">'+view.clues.map((c,i)=>
        '<article class="clue-card"><div class="clue-meta"><span>CLUE '+(view.clues.length-i)+'</span><span>TRACE LEFT '+(c.visitRound===0?'AT SETUP':'ROUND '+c.visitRound)+'</span></div>' +
        '<p>'+clueSentence(c)+'</p>' +
        '<small>Discovered round '+c.foundRound+(c.kind==='reverse'?' · Consider the reverse bearing':' · Bearing from the trace')+'</small></article>').join('')+'</div>' :
      '<p class="muted empty-evidence">No traces yet. Follow the old roads and search locations where the monster may have been.</p>')+
    '</section>';
}

function monsterTrailPanel(view) {
  const recent=view.trail.slice(-6).reverse();
  return '<section class="panel notebook-panel">' +
    '<div class="panel-top"><span class="eyebrow">PRIVATE INFORMATION</span><span class="steps-badge">MONSTER ONLY</span></div>' +
    '<h3>Your hidden trail</h3>' +
    '<p class="muted compact">The hunter cannot see this trail unless they reach a location you visited recently.</p>' +
    '<div class="trail-list">'+recent.map(t=>
      '<div class="trail-row"><span class="trail-round">'+(t.round===0?'SETUP':'ROUND '+t.round)+'</span><strong>'+esc(nameOf(t.node))+'</strong></div>').join('')+'</div>' +
    '<p class="warning-note">Avoid stepping onto the Hunter’s location, or you will be captured immediately.</p>' +
    '</section>';
}

function playHtml(view) {
  const isMonster = view.phase==='monster';
  return '<div class="app-shell '+(isMonster?'monster-mode':'hunter-mode')+'">' + titleBar(true,view) +
    '<main class="play-content">' +
      '<div class="status-row"><div><span class="role-tag">'+(isMonster?'◆ THE MONSTER':'✦ THE HUNTER')+'</span>' +
        '<h1>'+(isMonster?'Travel unseen':'Follow the trail')+'</h1>' +
        '<p>'+(isMonster?'The Hunter is at '+esc(nameOf(view.hunter))+'. Your position is secret.' :
          'Move up to two roads. Gather clues where the monster has passed.')+'</p></div>' +
        '<div class="turn-marker"><small>ROUND</small><strong>'+view.round+' <span>/ '+view.maxRounds+'</span></strong></div></div>' +
      '<div class="game-grid">'+mapFrame(view)+
        '<aside class="sidebar">'+movementForm(view) +
        (isMonster?monsterTrailPanel(view):notebook(view)) +
        '<p id="game-feedback" class="feedback" role="status" aria-live="polite">'+esc(view.feedback||'Use the map to work out your bearing.')+'</p>' +
        '</aside></div>' +
    '</main></div>';
}

function setupHtml(view) {
  const spawnOptions=view.eligibleSpawns.map(id=>
    '<option value="'+id+'" '+(id===selectedSpawn?'selected':'')+'>'+esc(nameOf(id))+'</option>').join('');
  return '<div class="app-shell monster-mode">' + titleBar(false,view) +
    '<main class="play-content">' +
      '<div class="status-row"><div><span class="role-tag">◆ MONSTER SETUP</span>' +
      '<h1>Choose your hiding place</h1>' +
      '<p>The hunter starts at the Watchtower. Only locations at least three roads away are available.</p></div></div>' +
      '<div class="game-grid">'+mapFrame(view) +
      '<aside class="sidebar"><section class="panel move-panel"><span class="eyebrow">SECRET LOCATION</span>' +
      '<h3>Begin in the shadows</h3><p class="muted">Choose a purple location on the map, or use the list below. Keep this location hidden.</p>' +
      '<label class="setup-label" for="spawn-select">Your secret starting location</label>' +
      '<select id="spawn-select">'+spawnOptions+'</select>' +
      '<button id="confirm-spawn" class="primary-button">CONFIRM SECRET START →</button>' +
      '<p class="warning-note">Once confirmed, the screen will be completely hidden before it passes to the Hunter.</p>' +
      '</section></aside></div></main></div>';
}

function overHtml(view) {
  const hunterWin=view.winner==='hunter';
  const route=view.trail.map(t=>nameOf(t.node)).join(' → ');
  return '<div class="app-shell end-mode">'+titleBar(false,view) +
    '<main class="play-content"><div class="end-header">' +
      '<span class="eyebrow">THE HUNT HAS ENDED</span><div class="result-symbol">'+(hunterWin?'✦':'◆')+'</div>' +
      '<h1>'+(hunterWin?'THE HUNTER PREVAILS':'THE MONSTER ESCAPES')+'</h1>' +
      '<p>'+(hunterWin?'The monster has been found before the final lantern went dark.':'The monster survived every round without being captured.')+'</p>' +
      '<div class="end-stats"><span>ROUND '+view.round+' / '+view.maxRounds+'</span><span>'+view.clues.length+' CLUES FOUND</span></div></div>' +
      '<div class="end-map">'+mapFrame(view)+'</div>' +
      '<div class="final-route"><h3>Monster route revealed</h3><p>'+esc(route)+'</p></div>' +
      '<div class="end-actions"><button id="play-again" class="primary-button">PLAY AGAIN →</button><button id="main-menu" class="secondary-button">RETURN TO MENU</button></div>' +
    '</main></div>';
}

function bindCommon() {
  document.getElementById('brand-link')?.addEventListener('click',event=>{
    event.preventDefault();
    if (confirm('Leave this game and return to the menu? Progress will be lost.')) {
      Object.assign(game, createGame());
      render();
    }
  });
}

function render() {
  const view=viewForCurrentScreen(game);
  // Critical privacy boundary: handoff markup is generated without map, role, logs or secret data.
  if(view.phase.startsWith('pass-')) {
    mount.innerHTML=handoffHtml(view.phase);
    document.getElementById('reveal').addEventListener('click',()=>{
      revealTurn(game);
      render();
    });
    return;
  }
  if(view.phase==='home') {
    mount.innerHTML=homeHtml();
    document.getElementById('start-two').addEventListener('click',start);
    document.getElementById('how-toggle').addEventListener('click',()=>{
      showHowTo=!showHowTo;
      render();
    });
    return;
  }
  if(view.phase==='monster-setup') {
    mount.innerHTML=setupHtml(view);
    bindCommon();
    const select=document.getElementById('spawn-select');
    select.addEventListener('change',()=>{
      selectedSpawn=select.value;
      render();
    });
    document.querySelectorAll('[data-spawn]').forEach(el=>{
      const pick=()=>{selectedSpawn=el.dataset.spawn;render();};
      el.addEventListener('click',pick);
      el.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}
      });
    });
    document.getElementById('confirm-spawn').addEventListener('click',()=>{
      selectMonsterStart(game,selectedSpawn);
      render();
    });
    return;
  }
  if(view.phase==='over') {
    mount.innerHTML=overHtml(view);
    bindCommon();
    document.getElementById('play-again').addEventListener('click',start);
    document.getElementById('main-menu').addEventListener('click',()=>{
      Object.assign(game,createGame());
      render();
    });
    return;
  }
  mount.innerHTML=playHtml(view);
  bindCommon();
  document.getElementById('move-form').addEventListener('submit',event=>{
    event.preventDefault();
    const value=document.getElementById('bearing-input').value;
    if(view.phase==='hunter') hunterMove(game,value);
    else monsterMove(game,value);
    render();
  });
  document.getElementById('end-turn')?.addEventListener('click',()=>{
    endHunterTurn(game);
    render();
  });
  document.getElementById('plot-toggle')?.addEventListener('click',()=>{
    plotClue=!plotClue;
    render();
  });
  if(view.phase==='hunter' && view.stepsLeft===0) document.getElementById('end-turn')?.focus();
}

/** Re-seal when hidden so app-switch / returning to a tab cannot reveal a private view. */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    const phase=game.phase;
    sealTurn(game);
    if(phase!==game.phase) render();
  }
});

render();
