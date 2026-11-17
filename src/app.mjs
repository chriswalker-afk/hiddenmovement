import { MAP, MAPS, MONSTER_SPAWNS } from './map.mjs';
import { bearingBetween, formatBearing } from './geometry.mjs';
import { analyseClues, clueMathExplanation } from './deduction.mjs';
import { LESSONS, checkLesson } from './tutorial.mjs';
import { SCENARIOS, scenarioInstruction, eligibleMonsterStarts } from './scenarios.mjs';
import { renderScenery, renderTitleArt } from './scenery.mjs';
import { renderProtractor, normalizeBearing, bearingFromPointer } from './protractor.mjs';
import { persistSaved, readSaved, savedSummary, clearSaved } from './persistence.mjs';
import {
  SETTINGS, DIFFICULTIES, beginGame, createGame, endHunterTurn, hunterMove,
  useLantern,
  monsterMove, revealTurn, sealTurn, selectMonsterStart, viewForCurrentScreen
} from './engine.mjs';

const mount = document.getElementById('app');
const game = createGame();
let selectedSpawn = MONSTER_SPAWNS[0];
let plotClue = false;
let selectedClueIds = null;
const nodeMarks = new Map();
let fieldNotes = '';
let tutorialOpen = false;
let lessonStep = 0;
let lessonOutcome = null;
let showHowTo = false;
let difficultyPicker = false;
let scenarioPicker = false;
let pendingScenario = 'classic';
let mapZoom = 1;
let hudTab = 'clues';
let guidedSelection = false;
let protractorVisible = false;
let protractorBearing = 0;
let protractorPosition = null;
const storage = () => globalThis.localStorage || null;
const currentMap = () => MAPS[game.mapId] || MAP;
const esc = value => String(value).replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const nameOf = id => currentMap().nodes[id]?.name || 'Unknown';
const roundCaption = round => round === 0 ? 'at the beginning of the hunt' : 'at the end of round ' + round;

function start(mode = 'multi',difficulty = 'intro',scenario = 'classic') {
  const seed=((Date.now() ^ Math.floor(Math.random()*0xffffffff))>>>0)||1;
  Object.assign(game,createGame({mode,difficulty,scenario,guided:guidedSelection,seed}));
  const result=beginGame(game);
  if(result.ok) {
    plotClue=false;
    selectedClueIds=null;
    hudTab='clues';
    protractorVisible=false;
    protractorBearing=0;
    protractorPosition=null;
    nodeMarks.clear();
    fieldNotes='';
    tutorialOpen=false;
    lessonStep=0;
    lessonOutcome=null;
    difficultyPicker=false;
    scenarioPicker=false;
    pendingScenario='classic';
    mapZoom=1;
    selectedSpawn=eligibleMonsterStarts(game.map,game.scenario,game.objectives)[0] || MONSTER_SPAWNS[0];
  }
  render();
}

function persistNow() {
  const state={
    fieldNotes,marks:[...nodeMarks.entries()],plotClue,
    selectedClueIds:selectedClueIds===null?null:[...selectedClueIds]
  };
  return persistSaved(storage(),game,state);
}

function resumeHunt() {
  const restored=readSaved(storage());
  if(!restored)return;
  Object.assign(game,restored.game);
  fieldNotes=restored.ui.fieldNotes;
  nodeMarks.clear();
  for(const [id,mark] of restored.ui.marks)nodeMarks.set(id,mark);
  plotClue=restored.ui.plotClue && game.guided;
  guidedSelection=game.guided;
  hudTab='clues';
  protractorVisible=false;
  protractorPosition=null;
  protractorBearing=0;
  selectedClueIds=restored.ui.selectedClueIds===null?null:new Set(restored.ui.selectedClueIds);
  difficultyPicker=false;
  scenarioPicker=false;
  tutorialOpen=false;
  render();
}

function scenarioHtml() {
  return '<main class="scenario-shell"><div class="scenario-inner">'+
    '<button id="scenario-back" class="text-button back-button">← BACK TO MENU</button>'+
    '<span class="eyebrow">THREE STORIES · TWO WAYS TO PLAY</span>'+
    '<h1>CHOOSE YOUR <em>MISSION</em></h1>'+
    '<p>Each mission uses the same mathematical movement rules, but changes what the Monster is trying to achieve.</p>'+
    guidedChoiceHtml() +
    '<div class="scenario-grid">'+Object.values(SCENARIOS).map(mission=>
      '<article class="scenario-card scenario-'+esc(mission.id)+'">'+
      '<div class="scenario-card-symbol" aria-hidden="true">'+esc(mission.icon)+'</div>'+
      '<span class="eyebrow">'+esc(mission.tagline.toUpperCase())+'</span>'+
      '<h2>'+esc(mission.name)+'</h2>'+
      '<p>'+esc(mission.description)+'</p>'+
      '<div class="scenario-actions">'+
      '<button data-mission-solo="'+esc(mission.id)+'">SOLO HUNT</button>'+
      '<button data-mission-multi="'+esc(mission.id)+'">PASS &amp; PLAY</button>'+
      '</div></article>').join('')+'</div>'+
    '<p class="mission-note">The Veil and Signal Lantern are available in the two special missions. Both are limited to one use each.</p>'+
    '</div></main>';
}

function openTutorial() {
  lessonStep=0;
  lessonOutcome=null;
  tutorialOpen=true;
  render();
}
function selectedClues(view) {
  return selectedClueIds === null ? view.clues : view.clues.filter(c=>selectedClueIds.has(c.id));
}
function currentAnalysis(view) {
  if (view.phase!=='hunter' || !view.guided || !plotClue) return null;
  const clues=selectedClues(view);
  if(!clues.length) return null;
  return analyseClues(currentMap(), clues, view.round, {hunterLocation:view.hunter});
}
function toggleNodeMark(id) {
  const old=nodeMarks.get(id);
  if(!old) nodeMarks.set(id,'possible');
  else if(old==='possible') nodeMarks.set(id,'ruled');
  else nodeMarks.delete(id);
  render();
}
function tutorialHtml() {
  const lesson=LESSONS[lessonStep];
  const radians=lesson.bearing*Math.PI/180;
  const x=130+75*Math.sin(radians),y=130-75*Math.cos(radians);
  const compass='<svg class="lesson-compass" viewBox="0 0 260 260" role="img" aria-label="Compass with north at the top and a demonstration bearing">' +
    '<circle cx="130" cy="130" r="94" fill="#172e36" stroke="#7faba6" stroke-width="2"/>' +
    '<path d="M130 35 V225 M35 130 H225" stroke="#759b94" stroke-opacity=".34" stroke-width="1.5"/>' +
    '<text x="130" y="24" text-anchor="middle">N</text><text x="241" y="134" text-anchor="middle">E</text>' +
    '<text x="130" y="252" text-anchor="middle">S</text><text x="19" y="134" text-anchor="middle">W</text>' +
    '<circle cx="130" cy="130" r="6" fill="#e2c387"/>' +
    '<line x1="130" y1="130" x2="'+x+'" y2="'+y+'" stroke="#e7c58a" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="'+x+'" cy="'+y+'" r="7" fill="#f3dba5" stroke="#1a3539" stroke-width="2"/>' +
    '<text x="130" y="161" text-anchor="middle" class="lesson-compass-hint">CLOCKWISE FROM NORTH</text></svg>';
  return '<main class="tutorial-screen"><section class="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="lesson-title">' +
    '<div class="tutorial-header"><span class="eyebrow">BEARINGS FIELD TRAINING · '+(lessonStep+1)+' / '+LESSONS.length+'</span>' +
    '<button type="button" id="tutorial-close" class="tutorial-close" aria-label="Close bearings tutorial">✕ CLOSE</button></div>' +
    '<div class="tutorial-steps" aria-hidden="true">'+LESSONS.map((_,i)=>'<span class="'+(i<=lessonStep?'completed-step':'')+'"></span>').join('')+'</div>' +
    '<h1 id="lesson-title">'+esc(lesson.title)+'</h1><p class="tutorial-detail">'+esc(lesson.detail)+'</p>' +
    '<div class="tutorial-lesson">'+compass+
    '<div class="tutorial-task"><p class="eyebrow">YOUR TURN</p><h2>'+esc(lesson.prompt)+'</h2>' +
    '<form id="lesson-form"><label for="lesson-answer">Enter a three-figure bearing</label>' +
    '<div class="tutorial-answer"><input id="lesson-answer" type="text" maxlength="4" inputmode="numeric" autocomplete="off" placeholder="000" aria-describedby="lesson-feedback" />' +
    '<button type="submit" class="primary-button">CHECK</button></div></form>' +
    '<p id="lesson-feedback" class="lesson-feedback '+(lessonOutcome?.correct?'correct-feedback':'')+'" role="status">'+
      (lessonOutcome?esc(lessonOutcome.message):'Bearings are measured clockwise from north, using three figures.')+'</p>' +
    (lessonOutcome?.correct ? '<button type="button" class="primary-button tutorial-next" id="lesson-next">'+
      (lessonStep===LESSONS.length-1?'FINISH TRAINING':'NEXT CHALLENGE')+' →</button>' : '') +
    '</div></div></section></main>';
}
function bindTutorial() {
  document.getElementById('tutorial-close').addEventListener('click',()=>{tutorialOpen=false;render();});
  document.getElementById('lesson-form').addEventListener('submit',e=>{
    e.preventDefault();
    lessonOutcome=checkLesson(lessonStep,document.getElementById('lesson-answer').value);
    render();
  });
  document.getElementById('lesson-next')?.addEventListener('click',()=>{
    if(lessonStep===LESSONS.length-1) tutorialOpen=false;
    else lessonStep++;
    lessonOutcome=null;
    render();
  });
  if(!lessonOutcome?.correct) document.getElementById('lesson-answer')?.focus();
}


function guidedChoiceHtml() {
  return '<div class="guidance-choice" aria-label="Choose the amount of bearings assistance">' +
    '<div><strong>'+ (guidedSelection?'GUIDED / TUTORIAL MODE':'STANDARD PLAY') +'</strong>' +
    '<small>'+(guidedSelection
      ?'Periodic watcher clues, distance help, plotted deductions and bearing feedback'
      :'No free sightings or automatic answers. Measure with the optional protractor.')+
    '</small></div>' +
    '<button id="guided-toggle" type="button" aria-pressed="'+guidedSelection+'">'+
      (guidedSelection?'SWITCH TO STANDARD':'ENABLE TUTORIAL HELP')+'</button></div>';
}

function difficultyHtml() {
  const cards = Object.values(DIFFICULTIES).map((preset, i) =>
    '<button class="difficulty-card difficulty-' + esc(preset.id) + '" data-difficulty="' + esc(preset.id) + '">' +
    '<span class="difficulty-level">LEVEL 0' + (i + 1) + ' <span>· ' + esc(preset.nodes) + ' LOCATIONS</span></span>' +
    '<strong>' + esc(preset.name) + '</strong>' +
    '<span class="difficulty-tagline">' + esc(preset.tagline) + '</span>' +
    '<span class="difficulty-description">' + esc(preset.summary) + '</span>' +
    '<span class="mode-link">HUNT HERE →</span></button>'
  ).join('');
  return '<main class="difficulty-shell"><div class="difficulty-inner">' +
    '<button id="back-home" class="text-button back-button">← BACK TO MENU</button>' +
    '<span class="eyebrow">SOLO HUNT · '+esc(SCENARIOS[pendingScenario].name.toUpperCase())+'</span>' +
    '<h1>FOUR PATHS INTO <em>THE DARK</em></h1>' +
    '<p>Each level changes the size of the map, the monster’s instincts and the strength of the clues you uncover.</p>' +
    guidedChoiceHtml() +
    '<div class="difficulty-grid">' + cards + '</div>' +
    '<p class="difficulty-footer">The monster moves automatically after each Hunter turn. Its position is never shown.</p>' +
    '</div></main>';
}

function titleBar(mode, view) {
  return '<header class="app-header">' +
    '<a class="brand" href="#" id="brand-link" aria-label="Return to Shadow Bearings home">' +
    '<span class="brand-symbol" aria-hidden="true">✦</span><span>SHADOW <em>BEARINGS</em></span></a>' +
    '<div class="header-right"><span class="eyebrow">'+esc(currentMap().title.toUpperCase())+'</span>' +
    (mode ? '<span class="round-indicator">' + esc(view.round || 1) + ' <span>/ ' +
      esc(view.maxRounds || SETTINGS.maxRounds) + ' ROUNDS</span></span>' : '') +
    '</div></header>';
}

function homeHtml() {
  if(difficultyPicker)return difficultyHtml();
  if(scenarioPicker)return scenarioHtml();
  const saved=savedSummary(storage());
  const resume=saved?'<div class="resume-game"><span class="eyebrow">A HUNT IS SAVED ON THIS DEVICE</span>'+
    '<strong>'+esc(SCENARIOS[saved.scenario].name)+'</strong>'+
    '<p>'+esc(saved.mode==='solo'?'Solo':'Pass & Play')+' · Round '+saved.round+
    (saved.mode==='solo'?' · '+esc(saved.difficulty):'')+'</p>'+
    '<button id="resume-hunt" class="primary-button">RESUME SAFELY →</button>'+
    '<button id="delete-save" class="text-button">DISCARD SAVE</button></div>':'';
  return '<div class="home-shell">' +
    '<div class="home-glow" aria-hidden="true"></div>' +
    '<div class="home-content">' +
      renderTitleArt() +
      '<div class="home-topline"><span class="small-star">✧</span> A GAME OF DIRECTIONS AND DECEPTION <span class="small-star">✧</span></div>' +
      '<div class="home-crest" aria-hidden="true"><span>N</span><b>✦</b><span>S</span></div>' +
      '<h1>SHADOW<br><i>BEARINGS</i></h1>' +
      '<p class="home-subtitle">One hunter. One hidden monster. A trail of bearings through the Hollow Moor.</p>' +
      guidedChoiceHtml() +
      '<div class="mode-grid">' +
        '<button id="start-two" class="mode-card">' +
          '<span class="mode-icon" aria-hidden="true">⚔</span><strong>PASS &amp; PLAY</strong>' +
          '<span>Two players • One device</span><small>Take turns using the map in secret</small>' +
          '<span class="mode-link">BEGIN HUNT <span aria-hidden="true">→</span></span></button>' +
        '<button id="start-solo-select" class="mode-card">' +
          '<span class="mode-icon" aria-hidden="true">◈</span><strong>SOLO HUNT</strong>' +
          '<span>One player • Monster AI</span><small>Four escalating difficulties</small>' +
          '<span class="mode-link">SELECT DIFFICULTY →</span></button>' +
      '</div>' +
      '<button class="text-button" id="scenario-select">EXPLORE STORY MISSIONS ↗</button>' +
      resume +
      '<button class="text-button" id="how-toggle" aria-expanded="' + showHowTo + '">HOW TO PLAY <span aria-hidden="true">⌄</span></button>' +
      '<button class="text-button" id="open-tutorial">INTERACTIVE BEARINGS TRAINING ↗</button>' +
      (showHowTo ? howToHtml() : '') +
      '<p class="home-footer">SHADOW BEARINGS <span>◈</span> FOUR MAPS · THREE MISSIONS</p>' +
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
  const terrainNames = {
    moor: ['BLACKPINE WOODS','ASH RIDGE','HOLLOW MARSHES','THE STANDING STONES'],
    woodland: ['THORNWOOD FOREST','THE HILL TRAIL','FOXGLOVE MEADOW','THE OLD VALLEY'],
    marsh: ['SILVER WATER','NORTHERN DELTA','THE REED FIELDS','LOWLAND FOG'],
    eclipse: ['RUINED HIGHLANDS','ASHEN SKY','DARK CITADEL','THE ECLIPSE'],
  }[currentMap().theme];
  const isMonster=view.phase==='monster' || view.phase==='monster-setup';
  const actingNode=view.phase==='monster'?view.monster:view.hunter;
  const activeNode=currentMap().nodes[actingNode];
  const toolOrigin=protractorPosition || activeNode;
  const protractor=(protractorVisible && ['hunter','monster'].includes(view.phase) && toolOrigin)
    ?renderProtractor(toolOrigin.x,toolOrigin.y,protractorBearing):'';
  const isOver=view.phase==='over';
  const paths = currentMap().edges.map(([a,b]) => {
    const p=currentMap().nodes[a],q=currentMap().nodes[b];
    return '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" class="road-base"/>' +
      '<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" class="road-top"/>';
  }).join('');
  const trees = [[115,92],[280,90],[505,70],[675,110],[930,190],[125,510],[320,660],[515,535],[735,635],[885,675]]
    .map((pt,i)=>treeCluster(pt[0],pt[1],i)).join('');
  const clues = view.phase==='hunter' && view.guided && plotClue ? selectedClues(view) : [];
  const analysis = currentAnalysis(view);
  const candidateSet = new Set(analysis?.candidates || []);
  const plotted=clues.map(clue => {
    const p=currentMap().nodes[clue.place];
    if(clue.type==='beacon')
      return '<circle cx="'+p.x+'" cy="'+p.y+'" r="34" class="beacon-sighting-ring"/>';
    let direction;
    if (clue.halfWidth === 0) {
      const radians=clue.sectorCenter*Math.PI/180;
      direction='<line class="clue-ray" x1="'+p.x+'" y1="'+p.y+
        '" x2="'+(p.x+1300*Math.sin(radians))+'" y2="'+(p.y-1300*Math.cos(radians))+'"/>';
    } else {
      direction='<path class="clue-sector" d="'+sectorShape(p,clue.sectorCenter,clue.halfWidth)+'"/>';
    }
    return direction+'<circle cx="'+p.x+'" cy="'+p.y+'" r="24" class="clue-origin"/>';
  }).join('');
  const hunterTrail=(view.phase==='hunter'||isOver)?view.hunterTrail:[];
  const hunterPath=hunterTrail.length>1 ?
    '<polyline class="hunter-trail" points="'+hunterTrail.map(id=>currentMap().nodes[id].x+','+currentMap().nodes[id].y).join(' ')+'"/>' : '';
  const monsterTrail=(view.phase==='monster'||isOver)?view.trail:[];
  const monsterPath=monsterTrail.length>1 ?
    '<polyline class="monster-trail" points="'+monsterTrail.map(t=>currentMap().nodes[t.node].x+','+currentMap().nodes[t.node].y).join(' ')+'"/>' : '';
  const eligible=new Set(view.eligibleSpawns||[]);
  const monsterNeighbours = view.phase==='monster' && view.guided ? new Set(currentMap().adjacency[view.monster]) : new Set();
  const dots=Object.values(currentMap().nodes).map(n=>{
    const isHunter=view.hunter===n.id;
    const isMonsterHere=(view.phase==='monster'||isOver)&&view.monster===n.id;
    const possibleStart=view.phase==='monster-setup'&&eligible.has(n.id);
    const selected=view.phase==='monster-setup'&&selectedSpawn===n.id;
    const target=monsterNeighbours.has(n.id);
    const hasClue=view.phase==='hunter'&&view.clues.some(c=>c.place===n.id);
    const mark = view.phase==='hunter' ? nodeMarks.get(n.id) : null;
    const exit = view.scenario==='escape' && view.objectives?.exitNode===n.id;
    const beacon = view.scenario==='beacons' && view.objectives?.beacons?.includes(n.id);
    const dark = beacon && view.beaconVisits?.includes(n.id);
    const cls=['node'];
    if(exit)cls.push('escape-location');
    if(beacon)cls.push(dark?'beacon-dark':'beacon-lit');
    if(isHunter)cls.push('hunter-location');
    if(isMonsterHere)cls.push('monster-location');
    if(target)cls.push('monster-target');
    if(possibleStart)cls.push('spawnable');
    if(selected)cls.push('selected');
    if(hasClue)cls.push('has-clue');
    if(analysis?.constrained && candidateSet.has(n.id)) cls.push('candidate-location');
    if(mark) cls.push('marked-'+mark);
    const nodeBody='<title>'+esc(n.name)+(exit?' — Escape Gate':beacon?(dark?' — Extinguished beacon':' — Lit beacon'):'')+'</title>' +
      (exit?'<circle r="28" class="escape-goal-ring"/>':'') +
      (beacon?'<circle r="26" class="beacon-goal-ring"/>':'') +
      (analysis?.constrained && candidateSet.has(n.id)?'<circle r="25" class="candidate-halo"/>':'') +
      '<circle r="19" class="node-hit-area"/><circle r="15" class="node-ring"/><circle r="8" class="node-core"/>' +
      (isMonsterHere?'<text y="4" text-anchor="middle" class="person-symbol">◆</text>':
       isHunter?'<text y="4" text-anchor="middle" class="person-symbol">✦</text>':'')+
      '<text y="-23" class="node-label" text-anchor="middle">'+esc(Object.keys(currentMap().nodes).length > 18 ? (n.label || n.name) : n.name)+'</text>' +
      (exit?'<text x="25" y="8" class="goal-label">GATE</text>':'')+
      (beacon?'<text x="23" y="8" class="goal-label">'+(dark?'OUT':'BEACON')+'</text>':'')+
      (mark?'<text y="34" text-anchor="middle" class="mark-symbol">'+(mark==='possible'?'?':'×')+'</text>':'');
    if(possibleStart) return '<g role="button" tabindex="0" aria-label="Choose '+esc(n.name)+' as monster starting position" class="'+cls.join(' ')+'" data-spawn="'+n.id+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
    if(view.phase==='hunter') return '<g role="button" tabindex="0" aria-label="Mark '+esc(n.name)+' on your map, current mark '+esc(mark||'none')+'" class="'+cls.join(' ')+'" data-node-note="'+n.id+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
    return '<g class="'+cls.join(' ')+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
  }).join('');
  return '<svg class="world-svg theme-'+esc(currentMap().theme)+'" style="width:'+Math.round(mapZoom*100)+'%;height:'+Math.round(mapZoom*100)+'%;max-height:none" viewBox="0 0 1000 720" aria-label="Connected map of '+Object.keys(currentMap().nodes).length+' locations in '+esc(currentMap().title)+'. North is up." role="img" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="moor-bg" x2="1" y2="1"><stop stop-color="#1a353b"/><stop offset=".52" stop-color="#243e3d"/><stop offset="1" stop-color="#172b38"/></linearGradient>' +
      '<pattern id="moor-grain" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1" fill="#b7c8b7" opacity=".075"/><circle cx="25" cy="26" r="1" fill="#b7c8b7" opacity=".08"/></pattern>' +
      '<filter id="moor-glow"><feGaussianBlur stdDeviation="11"/></filter>' +
    '</defs>' +
    renderScenery(currentMap().theme) +
    '<text x="65" y="70" class="terrain-label">'+esc(terrainNames[0])+'</text>' +
    '<text x="633" y="53" class="terrain-label">'+esc(terrainNames[1])+'</text>' +
    '<text x="41" y="691" class="terrain-label">'+esc(terrainNames[2])+'</text>' +
    '<text x="691" y="691" class="terrain-label">'+esc(terrainNames[3])+'</text>' +
    '<g class="roads">'+paths+'</g>' +
    '<g>'+plotted+'</g>' +
    hunterPath+monsterPath+
    '<g class="nodes">'+dots+'</g>' +
    protractor+
    '<g transform="translate(945 73)" class="north-mark"><circle r="27" fill="#0b1b27" fill-opacity=".72" stroke="#8aafaa" stroke-opacity=".55"/><path d="M0-21L6 2 0-2-6 2Z" fill="#d0b47b"/><path d="M0 21L6 2 0 6-6 2Z" fill="#7c969a"/><text y="-34" text-anchor="middle">N</text></g>' +
    // Keep decorative borders and grain isolated so generic SVG rect styles
    // cannot accidentally paint an opaque layer over roads and game nodes.
    '<g class="map-finish" pointer-events="none" aria-hidden="true">' +
      '<rect x="10" y="10" width="980" height="700" rx="7" fill="none" stroke="#8b9989" stroke-opacity=".45" stroke-width="2"/>' +
      '<rect width="1000" height="720" fill="url(#moor-grain)"/>' +
    '</g>' +
    '</svg>';
}

function mapFrame(view) {
  const map = currentMap();
  const large = Object.keys(map.nodes).length > 18;
  const index = large ? '<details class="location-index"><summary>LOCATION INDEX · TAP TO SEE NUMBERED PLACES</summary>' +
    '<div class="location-index-grid">' + Object.values(map.nodes).map(n =>
    '<span><b>' + esc(n.label) + '</b> ' + esc(n.name) + '</span>').join('') +
    '</div></details>' : '';
  return '<div class="map-section">' +
    '<div class="map-heading"><div><span class="eyebrow">THE HUNT · '+esc(map.title.toUpperCase())+'</span><h2>Map of ' + esc(map.title) + '</h2></div>' +
    '<div class="map-toolbar"><span class="map-chip"><span class="map-chip-dot"></span> NORTH IS UP</span>'+
      (['hunter','monster'].includes(view.phase)?
        '<button type="button" id="protractor-toggle" class="protractor-toggle" aria-pressed="'+protractorVisible+'">'+
        (protractorVisible?'◉ HIDE PROTRACTOR':'◉ PROTRACTOR')+'</button>'+
        (protractorVisible?
          '<div class="protractor-keys" aria-label="Fine-tune protractor bearing">'+
            '<button type="button" id="protractor-minus" aria-label="Rotate protractor counterclockwise one degree">−</button>'+
            '<output id="protractor-readout" aria-label="Measured bearing">'+formatBearing(protractorBearing)+'</output>'+
            '<button type="button" id="protractor-plus" aria-label="Rotate protractor clockwise one degree">+</button>'+
            '<button type="button" id="protractor-center" title="Reposition protractor over current location">CENTER</button>'+
          '</div>':''):'')+
      '<div class="map-zoom-controls" aria-label="Map zoom controls">'+
        '<button type="button" id="map-zoom-out" aria-label="Zoom out" '+(mapZoom<=1?'disabled':'')+'>−</button>'+
        '<output aria-label="Map zoom">'+Math.round(mapZoom*100)+'%</output>'+
        '<button type="button" id="map-zoom-in" aria-label="Zoom in" '+(mapZoom>=2?'disabled':'')+'>+</button>'+
      '</div></div></div>' +
    '<div class="map-frame">'+mapSvg(view)+'</div>' +
    '<div class="map-key">' +
      '<span><i class="key-spot key-hunter"></i> Hunter</span>' +
      ((view.phase==='monster'||view.phase==='over')?'<span><i class="key-spot key-monster"></i> Monster</span>':'') +
      '<span><i class="key-spot key-route"></i> Connected road</span>' +
      ((view.phase==='monster-setup')?'<span><i class="key-spot key-available"></i> Eligible start</span>':'')+
      ((view.scenario==='escape')?'<span><i class="key-spot key-goal"></i> Escape Gate</span>':'')+
      ((view.scenario==='beacons')?'<span><i class="key-spot key-beacon"></i> Signal beacon</span>':'')+
      ((view.phase==='hunter')?'<span><i class="key-spot key-available"></i> Candidate (analysis on)</span>' +
        '<span><i class="key-spot key-watch"></i> Your suspect</span><span><i class="key-spot key-ruled"></i> Your ruled-out mark</span>':'')+
    '</div>'+index+'</div>';
}

function movementForm(view) {
  const monster=view.phase==='monster';
  const location=monster?view.monster:view.hunter;
  const left=monster?1:view.stepsLeft;
  const adjacent=currentMap().adjacency[location].map(id=>nameOf(id)).join(' · ');
  return '<section class="panel move-panel hud-move-panel">' +
    '<div class="panel-top"><span class="eyebrow">'+(monster?'MONSTER NAVIGATION':'HUNTER NAVIGATION')+'</span>'+
      '<span class="steps-badge">'+left+' '+(left===1?'MOVE':'MOVES')+' LEFT</span></div>'+
    '<div class="hud-from"><span>FROM</span><h3>'+esc(nameOf(location))+'</h3></div>'+
    (view.guided ? '<p class="muted compact guided-route-help">Roads lead to: '+esc(adjacent)+'</p>' : '')+
    '<form id="move-form" class="bearing-form">'+
      '<label for="bearing-input">Enter a three-figure bearing</label>'+
      '<div class="bearing-entry"><input id="bearing-input" name="bearing" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" maxlength="4" placeholder="000" pattern="[0-9]{3}°?" '+
      (left===0?'disabled':'')+' aria-describedby="bearing-help"/><span aria-hidden="true">°</span>'+
      '<button type="submit" '+(left===0?'disabled':'')+'>MOVE →</button></div>'+
      '<small id="bearing-help">Clockwise from north · 000°–359°</small>'+
      (monster&&view.powers?.veilCharges>0?
        '<label class="veil-option"><input id="veil-move" type="checkbox" /> USE VEIL · CONCEAL THIS TRAIL</label>':'')+
    '</form>'+
    (!monster ? '<div class="hud-move-actions">'+
      '<button id="end-turn" class="secondary-button">'+
        (view.mode==='solo'?'END TURN · MONSTER MOVES':'FINISH HUNTER TURN')+' →</button>'+
      (view.powers?.lanternCharges>0?'<button id="use-lantern" class="lantern-button" '+
        (left===0?'disabled':'')+'>✧ SIGNAL LANTERN · USE 1 MOVE</button>':'')+
      '</div>' : '')+
    '<button id="open-tutorial-game" class="field-guide-link" type="button">BEARINGS FIELD TRAINING ↗</button>'+
    '</section>';
}

function clueSentence(clue) {
  const place=nameOf(clue.place);
  const observation=esc(roundCaption(clue.observedRound));
  if(clue.type==='beacon')
    return 'A beacon fell at <strong>'+esc(nameOf(clue.pointNode))+'</strong> at the end of round '+
      clue.observedRound+'. The Monster was at this exact location <b>then</b>, but may have moved since.';
  const precise=clue.halfWidth===0;
  const range=precise?
    'was exactly <strong>'+esc(clue.bounds[0])+'</strong>.':
    'was between <strong>'+esc(clue.bounds[0])+'</strong> and <strong>'+esc(clue.bounds[1])+'</strong>.';
  if(clue.type==='sighting'){
    const source=clue.source==='lantern'?'Your Signal Lantern detected':'A watcher reports';
    return source+': the bearing of the <b>monster</b> from <b>'+esc(place)+
      '</b> '+observation+' '+range;
  }
  const orientation=clue.kind==='reverse'?
    'Bearing of <b>'+esc(place)+'</b> from the <b>monster</b>':
    'Bearing of the <b>monster</b> from <b>'+esc(place)+'</b>';
  return orientation+' '+observation+' '+range;
}

function notebook(view) {
  const active = selectedClues(view);
  const analysis = currentAnalysis(view);
  const locationText=analysis?.constrained
    ? analysis.candidates.map(id=>nameOf(id)).join(' · ') : '';
  const overview=analysis?.constrained ?
    '<div class="analysis-summary"><strong>'+analysis.candidates.length+' possible locations</strong>' +
      '<span>'+analysis.eliminated+' of '+analysis.total+' locations ruled out by '+analysis.cluesUsed+
      ' selected clue'+(analysis.cluesUsed===1?'':'s')+'</span>' +
      '<details><summary>Which locations remain?</summary><p>'+esc(locationText || 'No locations satisfy these clues.')+'</p></details>' +
      '<p class="muted compact">These are possible locations, not guaranteed positions. Older clues allow the monster one road of movement per elapsed round.</p></div>'
    : plotClue ? '<p class="muted compact">Select at least one clue to check possible locations.</p>' : '';
  const cards=view.clues.map((c,i)=>{
    const chosen=active.some(a=>a.id===c.id);
    const visit=c.type==='beacon'?'PUBLIC BEACON REPORT':c.type==='sighting'?'PUBLIC SIGNAL':
      (c.ageLabel ? esc(c.ageLabel) : 'TRACE LEFT '+(c.visitRound===0?'AT SETUP':'ROUND '+c.visitRound));
    const routeDistance=Number.isInteger(c.distanceMin) ?
      '<p class="distance-hint">Road distance at observation: '+
      (c.distanceMin===c.distanceMax?'exactly '+c.distanceMin:
        c.distanceMin+'–'+c.distanceMax)+' connected roads</p>' : '';
    const label=c.type==='beacon'?'BEACON EXTINGUISHED':
      c.source==='lantern'?'SIGNAL LANTERN':
      c.type==='sighting'?'WATCHER SIGHTING':'TRACK CLUE '+(view.clues.length-i);
    return '<article class="clue-card '+(c.type==='sighting'?'sighting-card':c.type==='beacon'?'beacon-card':'')+'">' +
      '<div class="clue-meta"><span>'+label+'</span><span>'+visit+'</span></div>' +
      (view.guided && plotClue?'<label class="clue-check"><input type="checkbox" data-clue-toggle="'+esc(c.id)+
        '" '+(chosen?'checked':'')+'/> INCLUDE IN DEDUCTION</label>':'') +
      '<p>'+clueSentence(c)+'</p>'+routeDistance+
      '<small>Discovered round '+c.foundRound+
      (c.kind==='reverse'?' · Reverse the direction by 180°':' · Bearing starts at the stated location')+'</small>' +
      '<details class="clue-explanation"><summary>Explain the maths</summary><p>'+
        esc(clueMathExplanation(c,view.round))+'</p></details>' +
      '</article>';
  }).join('');
  return '<section class="panel notebook-panel">' +
    '<div class="panel-top"><span class="eyebrow">YOUR EVIDENCE</span><span class="steps-badge">'+
      view.clues.length+' '+(view.clues.length===1?'CLUE':'CLUES')+'</span></div>' +
    '<h3>Field notebook</h3>' +
    (view.guided && view.clues.length ? '<button id="plot-toggle" class="plot-toggle" aria-pressed="'+plotClue+'">'+
      (plotClue?'HIDE DEDUCTION OVERLAY':'COMBINE CLUES ON THE MAP')+
      ' <span aria-hidden="true">↗</span></button>' +
      overview+'<div class="clue-list">'+cards+'</div>' :
      (view.clues.length ? '<div class="clue-list">'+cards+'</div>' :
      '<p class="muted empty-evidence">No clues yet. Search the Monster’s recent trail.</p>'))+
    '</section>';
}

function annotationsPanel() {
  const options = Object.values(currentMap().nodes).map(node =>
    '<option value="'+esc(node.id)+'">'+esc(node.name)+'</option>').join('');
  const marked=[...nodeMarks.entries()];
  const markLegend = marked.length ?
    marked.map(([id,mark])=>'<span>'+esc(nameOf(id))+': '+(mark==='possible'?'suspected':'ruled out')+'</span>').join(' · ') :
    'No locations marked yet';
  return '<section class="panel annotations-panel"><span class="eyebrow">YOUR OWN NOTES</span><h3>Mark the map</h3>' +
    '<p class="muted compact">Tap any location on the map to cycle between <b>suspect</b>, <b>ruled out</b> and unmarked. '+
    'Your marks are personal ideas, not answers confirmed by the game.</p>' +
    '<div class="annotation-controls"><label for="mark-location">Keyboard and touch alternative</label>' +
    '<select id="mark-location">'+options+'</select><button id="mark-selected" class="plot-toggle">CYCLE MARK</button>' +
    '<button id="clear-marks" class="secondary-button">CLEAR ALL MARKS</button></div>' +
    '<p class="mark-legend" aria-live="polite">'+markLegend+'</p>' +
    '<label class="notes-label" for="field-notes">Working and deductions (private to the Hunter screen)</label>' +
    '<textarea id="field-notes" rows="3" maxlength="400" placeholder="What do the clues tell you?">'+esc(fieldNotes)+'</textarea></section>';
}

function progressPanel(view) {
  const stats=view.stats;
  const avg=stats.meanAngularError===null?'—':stats.meanAngularError.toFixed(1)+'°';
  return '<section class="panel maths-progress-panel"><span class="eyebrow">MATHS FEEDBACK</span><h3>Your bearings</h3>'+
    '<div class="maths-metrics"><div><strong>'+stats.successful+'</strong><span>correct routes</span></div>'+
    '<div><strong>'+stats.errors+'</strong><span>bearings to retry</span></div>'+
    '<div><strong>'+avg+'</strong><span>average angle error</span></div></div>'+
    '<p class="muted compact">Angle error compares your entered bearing with the actual road direction. '+
    'Getting a bearing wrong never uses up a move.</p></section>';
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

function missionPanel(view) {
  if(view.scenario==='classic')return '';
  const mission=SCENARIOS[view.scenario];
  const events=(view.publicEvents||[]).slice(-4).reverse();
  const line=event=>{
    if(event.type==='beacon')return 'Round '+event.round+': '+esc(nameOf(event.node))+' fell dark';
    if(event.type==='veil')return 'Round '+event.round+': the Monster used its Veil';
    if(event.type==='lantern')return 'Round '+event.round+': the Hunter lit a Signal Lantern';
    return '';
  };
  const progress=view.scenario==='escape'?
    '<p class="mission-highlight">Gate: <b>'+esc(nameOf(view.objectives.exitNode))+'</b> · Opens round 5</p>':
    '<p class="mission-highlight">Beacons extinguished: <b>'+view.beaconVisits.length+' / '+
      view.objectives.beacons.length+'</b></p>';
  return '<section class="panel mission-panel"><span class="eyebrow">STORY MISSION</span>'+
    '<h3>'+esc(mission.name)+'</h3>'+
    '<p class="muted compact">'+esc(mission.short)+'.</p>'+progress+
    (events.length?'<div class="mission-events">'+events.map(e=>
      '<span>'+line(e)+'</span>').join('')+'</div>':'')+
    '<p class="muted compact">The Monster has one Veil to hide a new trail. The Hunter can spend one move on a Signal Lantern.</p>'+
    '</section>';
}

function savePanel() {
  return '<section class="save-panel"><button type="button" id="save-exit" class="secondary-button">SAVE &amp; RETURN TO MENU</button>'+
    '<p class="muted compact">Saved only on this device. In Pass &amp; Play, resuming always shows the handoff screen.</p></section>';
}

function hudMissionSummary(view) {
  if(view.scenario==='escape')
    return 'ESCAPE GATE: '+nameOf(view.objectives.exitNode)+' · OPENS ROUND 5';
  if(view.scenario==='beacons')
    return 'BEACONS '+view.beaconVisits.length+'/'+view.objectives.beacons.length+' EXTINGUISHED';
  return 'FIND THE MONSTER BEFORE ROUND '+view.maxRounds;
}

function hudTabsHtml(view) {
  const isMonster=view.phase==='monster';
  const tabs=isMonster
    ? [['trail','TRAIL'],['mission','MISSION']]
    : [['clues','CLUES ('+view.clues.length+')'],['notes','NOTES'],['mission','MISSION'],
       ...(view.guided?[['stats','FEEDBACK']]:[])];
  const chosen=tabs.some(([id])=>id===hudTab)?hudTab:tabs[0][0];
  const tabBar=tabs.map(([id,label])=>'<button type="button" role="tab" id="hud-tab-'+id+
    '" data-hud-tab="'+id+'" aria-controls="hud-tab-panel" aria-selected="'+(chosen===id)+
    '" tabindex="'+(chosen===id?'0':'-1')+'">'+label+'</button>').join('');
  const panels={
    trail:()=>monsterTrailPanel(view),
    clues:()=>notebook(view),
    notes:()=>annotationsPanel(),
    mission:()=>view.scenario==='classic'
      ?'<section class="panel mission-panel"><span class="eyebrow">THE LONG HUNT</span>'+
        '<h3>Find the monster</h3><p class="muted compact">Collect trail clues and intercept the Monster before the final round.</p></section>'
      :missionPanel(view),
    stats:()=>progressPanel(view)
  };
  return '<section class="hud-details" aria-label="Investigation information">'+
    '<div class="hud-tabs" role="tablist" aria-label="Game information">'+tabBar+'</div>'+
    '<div id="hud-tab-panel" class="hud-tab-panel" role="tabpanel" aria-labelledby="hud-tab-'+chosen+'">'+
      panels[chosen]()+'</div></section>';
}

function playHtml(view) {
  const isMonster=view.phase==='monster';
  const mission=esc(hudMissionSummary(view));
  return '<div class="app-shell hud-screen '+(isMonster?'monster-mode':'hunter-mode')+'">'+
    titleBar(true,view)+
    '<main class="play-content hud-content">'+
      '<div class="status-row hud-status"><div class="hud-status-main">'+
        '<span class="role-tag">'+(isMonster?'◆ THE MONSTER':view.mode==='solo'?
          '✦ SOLO HUNT · '+esc(view.difficulty.toUpperCase()):'✦ THE HUNTER')+'</span>'+
        '<h1>'+(isMonster?'Travel unseen':'Follow the trail')+'</h1></div>'+
        '<p class="hud-mission-summary" title="'+mission+'">'+mission+'</p>'+
        '<div class="turn-marker"><small>ROUND</small><strong>'+view.round+
          ' <span>/ '+view.maxRounds+'</span></strong></div></div>'+
      '<div class="game-grid hud-grid">'+mapFrame(view)+
        '<aside class="sidebar hud-sidebar">'+
          movementForm(view)+
          hudTabsHtml(view)+
          '<div class="hud-footer"><p id="game-feedback" class="feedback" role="status" aria-live="polite">'+
            esc(view.feedback||'Use the map and measure your next bearing.')+'</p>'+
            '<button type="button" id="save-exit" class="hud-save" title="Save and return to the menu">SAVE</button>'+
          '</div></aside></div>'+
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
      '</section>'+savePanel()+'</aside></div></main></div>';
}

function overHtml(view) {
  const hunterWin=view.winner==='hunter';
  const route=view.trail.map(t=>nameOf(t.node)).join(' → ');
  return '<div class="app-shell end-mode">'+titleBar(false,view) +
    '<main class="play-content"><div class="end-header">' +
      '<span class="eyebrow">THE HUNT HAS ENDED</span><div class="result-symbol">'+(hunterWin?'✦':'◆')+'</div>' +
      '<h1>'+(hunterWin?'THE HUNTER PREVAILS':'THE MONSTER ESCAPES')+'</h1>' +
      '<p>'+(hunterWin?'The monster has been found before the final lantern went dark.':
        view.finishReason==='escape'?'The Monster slipped through the open Escape Gate.':
        view.finishReason==='beacons'?'Both signal beacons were extinguished.':
        'The Monster survived every round without being captured.')+'</p>' +
      '<div class="end-stats"><span>ROUND '+view.round+' / '+view.maxRounds+'</span><span>'+view.clues.length+' CLUES FOUND</span>' +
      (view.stats?'<span>'+view.stats.successful+' ACCURATE ROUTES</span><span>'+
        (view.stats.meanAngularError===null?'NO ROUTES':view.stats.meanAngularError.toFixed(1)+'° MEAN ERROR')+'</span>':'')+
      '</div></div>' +
      '<div class="end-map">'+mapFrame(view)+'</div>' +
      '<div class="final-route"><h3>Monster route revealed</h3><p>'+esc(route)+'</p></div>' +
      '<div class="end-actions"><button id="play-again" class="primary-button">PLAY AGAIN →</button><button id="main-menu" class="secondary-button">RETURN TO MENU</button></div>' +
    '</main></div>';
}

function bindMapZoom() {
  document.getElementById('map-zoom-in')?.addEventListener('click',()=>{
    mapZoom=Math.min(2,Math.round((mapZoom+0.25)*100)/100);
    render();
  });
  document.getElementById('map-zoom-out')?.addEventListener('click',()=>{
    mapZoom=Math.max(1,Math.round((mapZoom-0.25)*100)/100);
    render();
  });
}

function bindCommon() {
  document.getElementById('brand-link')?.addEventListener('click',event=>{
    event.preventDefault();
    if (confirm('Leave this game and return to the menu? Progress will be lost.')) {
      Object.assign(game, createGame());
      nodeMarks.clear(); fieldNotes=''; selectedClueIds=null; plotClue=false; tutorialOpen=false;
      render();
    }
  });
}

function saveAndExit() {
  if(!persistNow()) {
    game.feedback='Saving is unavailable in this browser. Keep the game open to avoid losing progress.';
    render();
    return;
  }
  Object.assign(game,createGame());
  nodeMarks.clear();fieldNotes='';selectedClueIds=null;plotClue=false;tutorialOpen=false;
  difficultyPicker=false;scenarioPicker=false;
  render();
}

function render() {
  const view=viewForCurrentScreen(game);
  // Keep saved games on the home screen; clear completed games.
  if(view.phase==='over')clearSaved(storage());
  else if(view.phase!=='home')persistNow();
  // Critical privacy boundary: handoff markup is generated without map, role, logs or secret data.
  if(view.phase.startsWith('pass-')) {
    mount.innerHTML=handoffHtml(view.phase);
    document.getElementById('reveal').addEventListener('click',()=>{
      revealTurn(game);
      render();
    });
    return;
  }
  if(tutorialOpen && (view.phase==='home' || view.phase==='hunter')) {
    mount.innerHTML=tutorialHtml();
    bindTutorial();
    return;
  }
  if(view.phase==='home') {
    mount.innerHTML=homeHtml();
    document.getElementById('guided-toggle')?.addEventListener('click',()=>{
      guidedSelection=!guidedSelection;
      render();
    });
    if(scenarioPicker) {
      document.getElementById('scenario-back').addEventListener('click',()=>{
        scenarioPicker=false;render();
      });
      document.querySelectorAll('[data-mission-multi]').forEach(el=>{
        el.addEventListener('click',()=>start('multi','intro',el.dataset.missionMulti));
      });
      document.querySelectorAll('[data-mission-solo]').forEach(el=>{
        el.addEventListener('click',()=>{
          pendingScenario=el.dataset.missionSolo;
          scenarioPicker=false;difficultyPicker=true;render();
        });
      });
    } else if (difficultyPicker) {
      document.getElementById('back-home').addEventListener('click',()=>{
        difficultyPicker = false;
        pendingScenario='classic';
        render();
      });
      document.querySelectorAll('[data-difficulty]').forEach(button=>{
        button.addEventListener('click',()=> start('solo', button.dataset.difficulty,pendingScenario));
      });
    } else {
      document.getElementById('resume-hunt')?.addEventListener('click',resumeHunt);
      document.getElementById('delete-save')?.addEventListener('click',()=>{
        clearSaved(storage());render();
      });
      document.getElementById('scenario-select').addEventListener('click',()=>{
        scenarioPicker=true;render();
      });
      document.getElementById('open-tutorial').addEventListener('click',openTutorial);
      document.getElementById('start-two').addEventListener('click',()=>start('multi'));
      document.getElementById('start-solo-select').addEventListener('click',()=>{
        pendingScenario='classic';
        difficultyPicker = true;
        render();
      });
      document.getElementById('how-toggle').addEventListener('click',()=>{
        showHowTo=!showHowTo;
        render();
      });
    }
    return;
  }
  if(view.phase==='monster-setup') {
    mount.innerHTML=setupHtml(view);
    bindCommon();
    bindMapZoom();
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
    document.getElementById('save-exit')?.addEventListener('click',saveAndExit);
    return;
  }
  if(view.phase==='over') {
    mount.innerHTML=overHtml(view);
    bindCommon();
    bindMapZoom();
    document.getElementById('play-again').addEventListener('click',()=>start(game.mode,game.difficulty,game.scenario));
    document.getElementById('main-menu').addEventListener('click',()=>{
      Object.assign(game,createGame());
      nodeMarks.clear(); fieldNotes=''; selectedClueIds=null; plotClue=false; tutorialOpen=false;
      difficultyPicker = false;
      render();
    });
    return;
  }
  mount.innerHTML=playHtml(view);
  bindCommon();
  bindMapZoom();
  document.getElementById('move-form').addEventListener('submit',event=>{
    event.preventDefault();
    const value=document.getElementById('bearing-input').value;
    if(view.phase==='hunter') hunterMove(game,value);
    else monsterMove(game,value,{veil:document.getElementById('veil-move')?.checked===true});
    render();
  });
  document.getElementById('end-turn')?.addEventListener('click',()=>{
    endHunterTurn(game);
    render();
  });
  document.getElementById('use-lantern')?.addEventListener('click',()=>{
    useLantern(game);
    render();
  });
  document.getElementById('save-exit')?.addEventListener('click',saveAndExit);
  document.getElementById('plot-toggle')?.addEventListener('click',()=>{
    plotClue=!plotClue;
    render();
  });
  if(view.phase==='hunter') {
    document.getElementById('open-tutorial-game')?.addEventListener('click',openTutorial);
    document.querySelectorAll('[data-clue-toggle]').forEach(el=>{
      el.addEventListener('change',e=>{
        if(selectedClueIds===null) selectedClueIds=new Set(view.clues.map(c=>c.id));
        if(e.target.checked) selectedClueIds.add(el.dataset.clueToggle);
        else selectedClueIds.delete(el.dataset.clueToggle);
        render();
      });
    });
    document.querySelectorAll('[data-node-note]').forEach(el=>{
      const toggle=()=>toggleNodeMark(el.dataset.nodeNote);
      el.addEventListener('click',toggle);
      el.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' ') {event.preventDefault();toggle();}
      });
    });
    document.getElementById('mark-selected')?.addEventListener('click',()=>{
      toggleNodeMark(document.getElementById('mark-location').value);
    });
    document.getElementById('clear-marks')?.addEventListener('click',()=>{
      nodeMarks.clear();
      render();
    });
    document.getElementById('field-notes')?.addEventListener('input',event=>{
      fieldNotes=event.target.value;
      persistNow();
    });
  }
  if(view.phase==='hunter' && view.stepsLeft===0) document.getElementById('end-turn')?.focus();
}

/** Re-seal when hidden so app-switch / returning to a tab cannot reveal a private view. */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    const phase=game.phase;
    sealTurn(game);
    if(phase!==game.phase) {
      tutorialOpen=false;
      render();
    } else if(game.phase!=='home'&&game.phase!=='over')persistNow();
  }
});

render();


/** An abrupt page close still saves a sealed multi-player view. */
globalThis.addEventListener?.('pagehide',()=>{
  if(game.phase!=='home'&&game.phase!=='over') {
    sealTurn(game);
    persistNow();
  }
});
