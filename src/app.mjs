import { MAP, MAPS, MONSTER_SPAWNS } from './map.mjs';
import { bearingBetween, formatBearing } from './geometry.mjs';
import { analyseClues, clueMathExplanation } from './deduction.mjs';
import { LESSONS, checkLesson } from './tutorial.mjs';
import { SCENARIOS, scenarioInstruction, eligibleMonsterStarts } from './scenarios.mjs';
import { renderScenery, renderTitleArt } from './scenery.mjs';
import { MONSTERS, monsterFor } from './monsters.mjs';
import { GUIDE_STEPS, hunterBriefing, guidedCoach } from './hunter-guide.mjs';
import { buildHuntReplay, replayMapView, replayFrameCaption } from './hunt-replay.mjs';
import { FORGE_CHOICES, FORGE_PALETTES, FORGE_COMPLEXIONS,
  DEFAULT_HUNTER, normalizeHunter, randomHunter, loadHunter, saveHunter,
  renderHunterSvg, renderHunterBoardPiece } from './hunter-forge.mjs';
import { riverRoadCrossings } from './waterways.mjs';
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
let tutorialStage = 'guide';
let guideStep = 0;
let coachAnswerVisible = false;
let showHowTo = false;
let difficultyPicker = false;
let scenarioPicker = false;
let forgeOpen = false;
let hunterAppearance = normalizeHunter(null);
let forgeDraft = normalizeHunter(null);
let forgeNotice = '';
let pendingScenario = 'classic';
let mapZoom = 1;
// A real successful Hunter movement can animate once after its search report closes.
let pendingHunterMotion = null;
let hudTab = 'clues';
let guidedSelection = false;
let protractorVisible = false;
let protractorBearing = 0;
let protractorPosition = null;
let monsterIntroOpen = false;
let searchReportOpen = false;
// Replay exists only on the ended-game screen; it is never restored into a
// live role-specific or pass-and-play handoff view.
let replayState = null;
let replayTimeout = null;
const storage = () => {
  try{return globalThis.localStorage || null;}
  catch{return null;}
};
hunterAppearance=loadHunter(storage());
const currentMap = () => MAPS[game.mapId] || MAP;
const esc = value => String(value).replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const nameOf = id => currentMap().nodes[id]?.name || 'Unknown';
const roundCaption = round => round === 0 ? 'at the beginning of the hunt' : 'at the end of round ' + round;

function resetReplay(){
  pendingHunterMotion=null;
  if(replayTimeout!==null)clearTimeout(replayTimeout);
  replayTimeout=null;
  replayState=null;
}

function start(mode = 'multi',difficulty = 'intro',scenario = 'classic') {
  const seed=((Date.now() ^ Math.floor(Math.random()*0xffffffff))>>>0)||1;
  Object.assign(game,createGame({mode,difficulty,scenario,guided:guidedSelection,seed}));
  const result=beginGame(game);
  if(result.ok) {
    resetReplay();
    plotClue=false;
    selectedClueIds=null;
    monsterIntroOpen=mode==='solo';
    searchReportOpen=false;
    hudTab=guidedSelection?'coach':'clues';
    coachAnswerVisible=false;
    protractorVisible=false;
    protractorBearing=0;
    protractorPosition=null;
    nodeMarks.clear();
    fieldNotes='';
    tutorialOpen=false;
    lessonStep=0;
    lessonOutcome=null;
    tutorialStage='guide';
    guideStep=0;
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
    selectedClueIds:selectedClueIds===null?null:[...selectedClueIds],
    introSeen:!monsterIntroOpen,reportSeen:!searchReportOpen
  };
  return persistSaved(storage(),game,state);
}

function resumeHunt() {
  const restored=readSaved(storage());
  if(!restored)return;
  Object.assign(game,restored.game);
  pendingHunterMotion=null;
  monsterIntroOpen=game.mode==='solo' && !restored.ui.introSeen;
  searchReportOpen=!!game.hunterOutcome && !restored.ui.reportSeen &&
    ['hunter','over'].includes(game.phase);
  fieldNotes=restored.ui.fieldNotes;
  nodeMarks.clear();
  for(const [id,mark] of restored.ui.marks)nodeMarks.set(id,mark);
  plotClue=restored.ui.plotClue && game.guided;
  guidedSelection=game.guided;
  hudTab=game.guided?'coach':'clues';
  coachAnswerVisible=false;
  protractorVisible=false;
  protractorPosition=null;
  protractorBearing=0;
  selectedClueIds=restored.ui.selectedClueIds===null?null:new Set(restored.ui.selectedClueIds);
  difficultyPicker=false;
  scenarioPicker=false;
  tutorialOpen=false;
  render();
}


function forgeLaunchHtml(){
  return '<div class="forge-launch" aria-label="Your personalised hunter">'+
    '<span class="forge-launch-portrait">'+
      renderHunterSvg(hunterAppearance,{bust:true,className:'forge-launch-art'})+'</span>'+
    '<span class="forge-launch-copy"><strong>YOUR HUNTER</strong>'+
      '<small>Choose your own look before the hunt.</small></span>'+
    '<button id="forge-open" type="button" class="forge-launch-button">⚒ HUNTER FORGE →</button>'+
    '</div>';
}
function openForge(){
  forgeDraft=normalizeHunter(hunterAppearance);
  forgeNotice='';
  forgeOpen=true;
  render();
}
function renderForgeWithScroll(){
  const before=document.querySelector('.forge-choices-scroll')?.scrollTop||0;
  render();
  const next=document.querySelector('.forge-choices-scroll');
  if(next)next.scrollTop=before;
}
function forgeHtml(){
  const groups=[
    ['head','HEAD / HEADWEAR','A silhouette to recognise at a glance'],
    ['torso','COAT / ARMOUR','Tools and clothing for your hunt'],
    ['legs','BOOTS / LEGS','Equipment for the road'],
    ['palette','COLOUR SCHEME','A coordinated set of inked colours'],
    ['complexion','COMPLEXION','Choose the face beneath the headwear']
  ];
  const choose=groups.map(([part,label,hint])=>
    '<section class="forge-choice-section" role="group" aria-labelledby="forge-label-'+part+'">'+
      '<div class="forge-section-head"><h2 id="forge-label-'+part+'">'+label+'</h2>'+
      '<small>'+hint+'</small></div>'+
      '<div class="forge-option-grid">'+FORGE_CHOICES[part].map(option=>{
        const selected=forgeDraft[part]===option.id;
        const swatch=part==='palette'
          ?'<span class="forge-colour-chip" style="--chip-1:'+option.cloth+
            ';--chip-2:'+option.dark+';--chip-3:'+option.metal+'"></span>'
          :part==='complexion'
            ?'<span class="forge-skin-chip" style="background:'+option.skin+'"></span>'
            :'<span class="forge-choice-mark" aria-hidden="true">'+
              ({head:'◈',torso:'◆',legs:'▲'})[part]+'</span>';
        return '<button type="button" class="forge-option" data-forge-part="'+part+
          '" data-forge-value="'+option.id+'" aria-pressed="'+selected+'">'+
          swatch+'<span>'+option.label+'</span></button>';
      }).join('')+'</div></section>'
  ).join('');
  const chosenPalette=FORGE_PALETTES.find(x=>x.id===forgeDraft.palette);
  return '<main class="forge-shell"><div class="forge-inner">'+
    '<header class="forge-header"><div><span class="eyebrow">MONSTER HUNTER OUTFITTERS</span>'+
      '<h1 id="forge-title">HUNTER <em>FORGE</em></h1>'+
      '<p>Every hunter has a story. Assemble yours in our original, inked gothic-fantasy style.</p>'+
      '</div><button id="forge-cancel" type="button" class="forge-back">← BACK WITHOUT SAVING</button></header>'+
    '<div class="forge-workspace">'+
      '<section class="forge-display" aria-label="Live hunter preview">'+
        '<div class="forge-art-stage">'+renderHunterSvg(forgeDraft,{className:'forge-preview-portrait'})+'</div>'+
        '<div class="forge-display-footer"><span class="eyebrow">CURRENT OUTFIT</span>'+
          '<strong>'+chosenPalette.label+'</strong>'+
          '<small>Head + torso + legs + colours combine into one character.</small></div>'+
        '<div class="forge-preview-actions">'+
          '<button id="forge-randomise" type="button">✧ RANDOMISE</button>'+
          '<button id="forge-reset" type="button">RESET TO DEFAULT</button>'+
        '</div>'+
      '</section>'+
      '<section class="forge-settings" aria-label="Customise your hunter">'+
        '<div class="forge-settings-header"><strong>CHOOSE YOUR EQUIPMENT</strong>'+
        '<span>All choices are cosmetic — no gameplay advantage.</span></div>'+
        '<div class="forge-choices-scroll">'+choose+'</div>'+
        '<div class="forge-bottom"><p class="forge-saving-note" role="status">'+
          (forgeNotice||'Save to keep this outfit for future hunts on this device.')+'</p>'+
          '<button id="forge-save" type="button" class="primary-button">SAVE MY HUNTER →</button>'+
          (forgeNotice?'<button id="forge-use-session" class="forge-session-button" type="button">USE THIS HUNTER FOR THIS SESSION →</button>':'')+
        '</div>'+
      '</section>'+
    '</div>'+
    '<p class="forge-future-note">Your design appears in introductions, training and the game HUD. The matching moving board piece is planned for a future Hunter Forge update.</p>'+
  '</div></main>';
}
function bindForge(){
  document.getElementById('forge-cancel').addEventListener('click',()=>{forgeOpen=false;forgeNotice='';render();});
  document.querySelectorAll('[data-forge-part]').forEach(button=>{
    button.addEventListener('click',()=>{
      const part=button.dataset.forgePart;
      if(!Object.hasOwn(FORGE_CHOICES,part))return;
      const value=button.dataset.forgeValue;
      if(!FORGE_CHOICES[part].some(option=>option.id===value))return;
      forgeDraft=normalizeHunter({...forgeDraft,[part]:value});
      forgeNotice='';
      renderForgeWithScroll();
    });
  });
  document.getElementById('forge-randomise').addEventListener('click',()=>{
    forgeDraft=randomHunter();forgeNotice='';renderForgeWithScroll();
  });
  document.getElementById('forge-reset').addEventListener('click',()=>{
    forgeDraft=normalizeHunter(DEFAULT_HUNTER);forgeNotice='';renderForgeWithScroll();
  });
  document.getElementById('forge-save').addEventListener('click',()=>{
    if(saveHunter(storage(),forgeDraft)){
      hunterAppearance=normalizeHunter(forgeDraft);
      forgeOpen=false;forgeNotice='';render();
    }else{
      forgeNotice='Browser storage is blocked or full. You can still use this outfit for this session, but it will not survive a reload.';
      renderForgeWithScroll();
    }
  });
  document.getElementById('forge-use-session')?.addEventListener('click',()=>{
    hunterAppearance=normalizeHunter(forgeDraft);
    forgeOpen=false;forgeNotice='';render();
  });
}

function scenarioHtml() {
  return '<main class="scenario-shell"><div class="scenario-inner">'+
    '<button id="scenario-back" class="text-button back-button">← BACK TO MENU</button>'+
    '<span class="eyebrow">THREE STORIES · TWO WAYS TO PLAY</span>'+
    '<h1>CHOOSE YOUR <em>MISSION</em></h1>'+
    '<p>Each mission uses the same mathematical movement rules, but changes what the Monster is trying to achieve.</p>'+
    forgeLaunchHtml() +
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
  tutorialStage='guide';
  guideStep=0;
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
  return analyseClues(currentMap(),clues,view.round,{
    hunterLocation:view.hunter,publicEvents:view.publicEvents
  });
}
function toggleNodeMark(id) {
  const old=nodeMarks.get(id);
  if(!old) nodeMarks.set(id,'possible');
  else if(old==='possible') nodeMarks.set(id,'ruled');
  else nodeMarks.delete(id);
  render();
}
function guideArtwork(step) {
  if(step.visual==='hunter') return renderHunterSvg(hunterAppearance,{className:'guide-character-art'});
  const heading='<svg class="guide-diagram" viewBox="0 0 360 300" role="img" aria-label="Illustrated bearings and deduction teaching example">';
  const end='</svg>';
  const compass='<circle cx="175" cy="147" r="109" fill="#213a40" stroke="#d5b987" stroke-width="3"/>'+
    '<path d="M175 36V259M64 147H286" stroke="#b0c7b2" stroke-opacity=".5" stroke-width="2"/>'+
    '<text x="175" y="29" text-anchor="middle">N · 000°</text>'+
    '<text x="306" y="152" text-anchor="middle">E</text>'+
    '<text x="175" y="285" text-anchor="middle">S</text>'+
    '<text x="50" y="152" text-anchor="middle">W</text>'+
    '<line x1="175" y1="147" x2="251" y2="71" stroke="#e7c37d" stroke-width="6" stroke-linecap="round"/>'+
    '<circle cx="175" cy="147" r="8" fill="#f4d99e"/><circle cx="251" cy="71" r="7" fill="#f4d99e"/>'+
    '<text x="248" y="55" text-anchor="middle" class="guide-angle">045°</text>';
  const trail='<path d="M61 205L163 164L257 87L315 176" stroke="#91a9a2" stroke-width="13" fill="none" stroke-linecap="round"/>'+
    '<path d="M61 205L163 164L257 87L315 176" stroke="#d1b784" stroke-width="4" stroke-dasharray="5 10" fill="none"/>'+
    '<g fill="#284b51" stroke="#d7c79c" stroke-width="4"><circle cx="61" cy="205" r="19"/><circle cx="163" cy="164" r="19"/><circle cx="257" cy="87" r="19"/><circle cx="315" cy="176" r="19"/></g>'+
    '<circle cx="163" cy="164" r="29" fill="none" stroke="#e9d29e" stroke-width="3" stroke-dasharray="5 4"/>'+
    '<text x="163" y="129" text-anchor="middle">TRAIL FOUND</text>'+
    '<text x="163" y="170" text-anchor="middle" class="guide-map-mark">✧</text>'+
    '<text x="61" y="242" text-anchor="middle">HUNTER</text>'+
    '<text x="257" y="52" text-anchor="middle">CLUE</text>';
  const timeline='<g fill="#263e44" stroke="#abc4b6" stroke-width="3">'+
    '<rect x="20" y="112" width="95" height="65" rx="6"/>'+
    '<rect x="131" y="112" width="95" height="65" rx="6"/>'+
    '<rect x="242" y="112" width="95" height="65" rx="6"/></g>'+
    '<path d="M116 146H130M227 146H241" stroke="#e7cc98" stroke-width="4"/>'+
    '<g fill="#e7d3a6" text-anchor="middle"><text x="67" y="100">ROUND 2</text>'+
    '<text x="178" y="100">ROUND 3</text><text x="290" y="100">ROUND 4</text>'+
    '<text x="67" y="151" class="guide-symbol">✧</text>'+
    '<text x="178" y="151" class="guide-symbol">?</text>'+
    '<text x="290" y="151" class="guide-symbol">?</text>'+
    '<text x="179" y="218">The Monster can move between clues</text></g>';
  const powers='<g fill="none" stroke="#b5d0c3" stroke-width="4">'+
    '<circle cx="91" cy="125" r="48"/><circle cx="268" cy="125" r="48"/>'+
    '<path d="M139 125H217M203 111L217 125L203 139" stroke="#f4cf92" stroke-width="5"/></g>'+
    '<text x="91" y="135" text-anchor="middle" class="guide-symbol">✧</text>'+
    '<text x="268" y="135" text-anchor="middle" class="guide-symbol">?</text>'+
    '<g text-anchor="middle"><text x="91" y="206">TELEPORT</text>'+
    '<text x="268" y="206">UNCONFIRMED</text><text x="180" y="253">An announced move is not a live sighting</text></g>';
  const checklist='<g text-anchor="start">'+[0,1,2,3,4,5].map(i=>{
    const x=i%2===0?24:190,y=57+Math.floor(i/2)*89;
    return '<circle cx="'+(x+15)+'" cy="'+(y+7)+'" r="16" fill="#e0c28d"/>'+
      '<text x="'+(x+15)+'" y="'+(y+13)+'" text-anchor="middle" class="guide-count">'+(i+1)+'</text>'+
      '<text x="'+(x+37)+'" y="'+(y+12)+'">'+
        ['READ','PLAN','MEASURE','SEARCH','DEDUCE','END TURN'][i]+'</text>';
  }).join('')+'</g>';
  let picture=step.visual==='compass'?compass:
    step.visual==='trail'?trail:
    step.visual==='timeline'?timeline:
    step.visual==='powers'?powers:checklist;
  return heading+picture+end;
}

function guideHtml() {
  const step=GUIDE_STEPS[guideStep];
  return '<main class="tutorial-screen tutorial-screen-guide">'+
    '<section class="tutorial-card guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title">'+
      '<div class="tutorial-header">'+
        '<span class="eyebrow">HOW TO HUNT · STEP '+(guideStep+1)+' OF '+GUIDE_STEPS.length+'</span>'+
        '<button id="tutorial-close" type="button" class="tutorial-close" aria-label="Close tutorial">✕ CLOSE</button>'+
      '</div>'+
      '<div class="tutorial-steps" aria-label="Tutorial progress">'+
        GUIDE_STEPS.map((_,i)=>'<span class="'+(i<=guideStep?'completed-step':'')+'"></span>').join('')+
      '</div>'+
      '<div class="guide-layout">'+
        '<div class="guide-art">'+guideArtwork(step)+'</div>'+
        '<div class="guide-copy">'+
          '<span class="encounter-kicker">'+esc(step.heading)+'</span>'+
          '<h1 id="guide-title">'+esc(step.title)+'</h1>'+
          '<p class="guide-main-text">'+esc(step.detail)+'</p>'+
          '<div class="guide-example"><strong>EXAMPLE / REMEMBER</strong><p>'+esc(step.example)+'</p></div>'+
          '<div class="guide-actions">'+
            (guideStep>0?'<button id="guide-back" type="button" class="secondary-button">← PREVIOUS</button>':'')+
            (guideStep===GUIDE_STEPS.length-1
              ?'<button id="guide-practice" type="button" class="primary-button">PRACTISE BEARINGS →</button>'
              :'<button id="guide-next" type="button" class="primary-button">NEXT: '+esc(GUIDE_STEPS[guideStep+1].heading)+' →</button>')+
          '</div>'+
          (guideStep!==GUIDE_STEPS.length-1?'<button id="guide-skip" class="guide-skip" type="button">SKIP TO BEARINGS PRACTICE</button>':'')+
        '</div>'+
      '</div>'+
    '</section></main>';
}

function tutorialHtml() {
  if(tutorialStage==='guide')return guideHtml();
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
  document.getElementById('tutorial-close').addEventListener('click',()=>{
    tutorialOpen=false;render();
  });
  if(tutorialStage==='guide'){
    document.getElementById('guide-next')?.addEventListener('click',()=>{
      guideStep=Math.min(GUIDE_STEPS.length-1,guideStep+1);render();
    });
    document.getElementById('guide-back')?.addEventListener('click',()=>{
      guideStep=Math.max(0,guideStep-1);render();
    });
    const practise=()=>{
      tutorialStage='practice';lessonStep=0;lessonOutcome=null;render();
    };
    document.getElementById('guide-skip')?.addEventListener('click',practise);
    document.getElementById('guide-practice')?.addEventListener('click',practise);
    document.getElementById('guide-next')?.focus?.();
    return;
  }
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
  return '<div class="guidance-choice" aria-label="Optional step-by-step gameplay coaching">' +
    '<div><strong>'+ (guidedSelection?'GUIDED / TUTORIAL MODE':'STANDARD PLAY') +'</strong>' +
    '<small>'+(guidedSelection
      ?'Step-by-step Coach tab, worked bearing examples on request and optional clue plotting. All original clues stay.'
      :'All original clues and sightings remain. Measure the bearings yourself; no clue rays are drawn automatically.')+
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
    '<img class="difficulty-monster-art" src="'+monsterFor(preset.id).art+
      '" alt="Portrait of '+esc(monsterFor(preset.id).name)+'" loading="lazy"/>' +
    '<span class="difficulty-monster-name">'+esc(monsterFor(preset.id).name)+'</span>' +
    '<span class="difficulty-monster-power">'+esc(monsterFor(preset.id).powerTitle)+'</span>' +
    '<span class="difficulty-description">' + esc(preset.summary) + '</span>' +
    '<span class="mode-link">HUNT HERE →</span></button>'
  ).join('');
  return '<main class="difficulty-shell"><div class="difficulty-inner">' +
    '<button id="back-home" class="text-button back-button">← BACK TO MENU</button>' +
    '<span class="eyebrow">SOLO HUNT · '+esc(SCENARIOS[pendingScenario].name.toUpperCase())+'</span>' +
    '<h1>FOUR PATHS INTO <em>THE DARK</em></h1>' +
    '<p>Each level changes the size of the map, the monster’s instincts and the strength of the clues you uncover.</p>' +
    forgeLaunchHtml() +
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
      forgeLaunchHtml() +
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
  const bridgeDecks=riverRoadCrossings(currentMap()).map(bridge=>{
    const half=bridge.span/2;
    const lo=(-half).toFixed(1),hi=half.toFixed(1);
    // A muted stone/wood footbridge spans the actual painted water,
    // using the bearing of the existing road (not a second game route).
    return '<g class="river-bridge" aria-hidden="true" transform="translate('+
      bridge.x+' '+bridge.y+') rotate('+bridge.angle+')">'+
      '<line x1="'+lo+'" y1="0" x2="'+hi+'" y2="0" class="bridge-shadow"/>'+
      '<line x1="'+lo+'" y1="0" x2="'+hi+'" y2="0" class="bridge-deck"/>'+
      '<line x1="'+lo+'" y1="-8.5" x2="'+hi+'" y2="-8.5" class="bridge-rail"/>'+
      '<line x1="'+lo+'" y1="8.5" x2="'+hi+'" y2="8.5" class="bridge-rail"/>'+
      '<line x1="'+lo+'" y1="0" x2="'+hi+'" y2="0" class="bridge-walkway"/>'+
      '</g>';
  }).join('');
  const trees = [[115,92],[280,90],[505,70],[675,110],[930,190],[125,510],[320,660],[515,535],[735,635],[885,675]]
    .map((pt,i)=>treeCluster(pt[0],pt[1],i)).join('');
  const clues = view.phase==='hunter' && view.guided && plotClue ? selectedClues(view) : [];
  const analysis = currentAnalysis(view);
  const candidateSet = new Set(analysis?.candidates || []);
  const plotted=clues.map(clue => {
    const p=currentMap().nodes[clue.place];
    if(['beacon','teleport-origin'].includes(clue.type))
      return '<circle cx="'+p.x+'" cy="'+p.y+'" r="34" class="beacon-sighting-ring"/>';
    if(clue.type==='rumour')return '';
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
  const monsterPath=(view.replay && Array.isArray(view.replaySegments))
    ?view.replaySegments.map(edge=>{
      const a=currentMap().nodes[edge.from],b=currentMap().nodes[edge.to];
      if(!a||!b)return '';
      const kind=edge.movement==='teleport'?'replay-teleport-line':
        edge.movement==='veil'?'replay-veil-line':'replay-ordinary-line';
      return '<line class="monster-trail '+kind+'" x1="'+a.x+'" y1="'+a.y+
        '" x2="'+b.x+'" y2="'+b.y+'"/>';
    }).join('')
    :monsterTrail.length>1 ?
      '<polyline class="monster-trail" points="'+monsterTrail.map(t=>
        currentMap().nodes[t.node].x+','+currentMap().nodes[t.node].y).join(' ')+'"/>' : '';
  const eligible=new Set(view.eligibleSpawns||[]);
  const monsterNeighbours = view.phase==='monster' ? new Set(currentMap().adjacency[view.monster]) : new Set();
  const mapNodeCount=Object.keys(currentMap().nodes).length;
  const labelDensity=mapNodeCount>=30?'expert':mapNodeCount>=24?'tracker':
    mapNodeCount>=18?'apprentice':'intro';
  const dots=Object.values(currentMap().nodes).map(n=>{
    const isHunter=view.hunter===n.id;
    const isMonsterHere=(view.phase==='monster'||isOver)&&view.monster===n.id;
    const possibleStart=view.phase==='monster-setup'&&eligible.has(n.id);
    const selected=view.phase==='monster-setup'&&selectedSpawn===n.id;
    const target=monsterNeighbours.has(n.id);
    const hasClue=view.phase==='hunter'&&view.clues.some(c=>c.place===n.id);
    const suspected=view.phase==='hunter'&&view.clues.some(c=>
      c.type==='rumour'&&c.pointNode===n.id&&c.status==='unverified');
    const discredited=view.phase==='hunter'&&view.clues.some(c=>
      c.type==='rumour'&&c.pointNode===n.id&&c.status==='false');
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
    if(suspected)cls.push('rumoured-node');
    if(discredited)cls.push('discredited-node');
    if(analysis?.constrained && candidateSet.has(n.id)) cls.push('candidate-location');
    if(mark) cls.push('marked-'+mark);
    const nodeBody='<title>'+esc(n.name)+(exit?' — Escape Gate':beacon?(dark?' — Extinguished beacon':' — Lit beacon'):'')+'</title>' +
      (exit?'<circle r="28" class="escape-goal-ring"/>':'') +
      (beacon?'<circle r="26" class="beacon-goal-ring"/>':'') +
      (analysis?.constrained && candidateSet.has(n.id)?'<circle r="25" class="candidate-halo"/>':'') +
      (suspected?'<circle r="28" class="rumour-halo"/><text x="20" y="-19" class="rumour-icon">?</text>':'')+
      (discredited?'<text x="20" y="-19" class="false-rumour-icon">×</text>':'')+
      '<circle r="19" class="node-hit-area"/><circle r="15" class="node-ring"/><circle r="8" class="node-core"/>' +
      (isMonsterHere?'<text y="4" text-anchor="middle" class="person-symbol">◆</text>':
       n.label?'<text y="4" text-anchor="middle" class="node-number">'+esc(n.label)+'</text>':'')+
      // Always print the full place name on the map. Numbers remain *inside*
      // the marker as a reference to the expandable index, never as a
      // substitute for the name (previously the 26/36-node maps did this).
      '<text y="-25" class="node-label node-label-'+labelDensity+
        '" text-anchor="middle">'+esc(n.name)+'</text>' +
      (exit?'<text x="25" y="8" class="goal-label">GATE</text>':'')+
      (beacon?'<text x="23" y="8" class="goal-label">'+(dark?'OUT':'BEACON')+'</text>':'')+
      (mark?'<text y="34" text-anchor="middle" class="mark-symbol">'+(mark==='possible'?'?':'×')+'</text>':'');
    if(possibleStart) return '<g role="button" tabindex="0" aria-label="Choose '+esc(n.name)+' as monster starting position" class="'+cls.join(' ')+'" data-spawn="'+n.id+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
    if(view.phase==='hunter') return '<g role="button" tabindex="0" aria-label="Mark '+esc(n.name)+' on your map, current mark '+esc(mark||'none')+'" class="'+cls.join(' ')+'" data-node-note="'+n.id+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
    return '<g class="'+cls.join(' ')+'" transform="translate('+n.x+' '+n.y+')">'+nodeBody+'</g>';
  }).join('');
  const replayTokens=view.replay && view.hunter && view.monster ?
    [['monster',view.monster,'M']].map(([role,id,initial])=>{
      const p=currentMap().nodes[id];
      if(!p)return '';
      const dx=view.hunter===view.monster?-26:0;
      return '<g class="replay-actor replay-actor-'+role+'" data-replay-actor="'+role+
        '" transform="translate('+(p.x+dx)+' '+(p.y+19)+')" pointer-events="none">'+
        '<title>'+esc(role==='hunter'?'Hunter at '+nameOf(id):monsterFor(view.difficulty).name+' at '+nameOf(id))+'</title>'+
        '<circle r="16"/><text text-anchor="middle" y="5">'+initial+'</text></g>';
    }).join('') : '';
  // The Hunter is a visible, modular figure on EVERY public map, including
  // Monster setup, active play, replay and final results. The same saved outfit
  // is used in the Forge and the mission briefing; no secret state is read.
  const currentHunter=view.hunter && currentMap().nodes[view.hunter];
  const origin=pendingHunterMotion && currentMap().nodes[pendingHunterMotion.from];
  const moving=!!(origin && currentHunter && !view.replay &&
    view.phase==='hunter' && pendingHunterMotion.to===view.hunter &&
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches!==true);
  const hunterPiece=currentHunter?renderHunterBoardPiece(hunterAppearance,{
    node:view.hunter,x:currentHunter.x,y:currentHunter.y,
    replay:view.replay===true,
    fromX:origin?.x,fromY:origin?.y,animate:moving
  }):'';
  const mapHeightStyle=(['hunter','monster'].includes(view.phase)||view.replay)
    ?'height:'+Math.round(mapZoom*100)+'%;':'height:auto;';
  return '<svg class="world-svg theme-'+esc(currentMap().theme)+'" style="width:'+Math.round(mapZoom*100)+'%;'+mapHeightStyle+'max-height:none" viewBox="0 0 1000 720" aria-label="Connected map of '+Object.keys(currentMap().nodes).length+' locations in '+esc(currentMap().title)+'. North is up." role="img" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
      '<linearGradient id="moor-bg" x2="1" y2="1"><stop stop-color="#1a353b"/><stop offset=".52" stop-color="#243e3d"/><stop offset="1" stop-color="#172b38"/></linearGradient>' +
      '<pattern id="moor-grain" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="8" cy="10" r="1" fill="#b7c8b7" opacity=".075"/><circle cx="25" cy="26" r="1" fill="#b7c8b7" opacity=".08"/></pattern>' +
      '<filter id="moor-glow"><feGaussianBlur stdDeviation="11"/></filter>' +
    '</defs>' +
    renderScenery(currentMap().theme) +
    // No invented terrain labels: every readable map name belongs to a real
    // named landmark. The terrain is conveyed by its actual artwork.
    '<g class="roads">'+paths+'</g>' +
    '<g class="river-bridges" pointer-events="none">'+bridgeDecks+'</g>' +
    '<g>'+plotted+'</g>' +
    hunterPath+monsterPath+
    '<g class="nodes">'+dots+'</g>' +
    hunterPiece+
    replayTokens+
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
        '<button type="button" id="map-zoom-in" aria-label="Zoom in" '+(mapZoom>=3?'disabled':'')+'>+</button>'+
      '</div></div></div>' +
    '<div class="map-frame">'+mapSvg(view)+'</div>' +
    '<div class="map-key">' +
      '<span><i class="key-spot key-hunter"></i> Hunter</span>' +
      ((view.phase==='monster'||view.phase==='over')?'<span><i class="key-spot key-monster"></i> Monster</span>':'') +
      '<span><i class="key-spot key-route"></i> Connected road</span>' +
      ((view.phase==='monster-setup')?'<span><i class="key-spot key-available"></i> Eligible start</span>':'')+
      ((view.scenario==='escape')?'<span><i class="key-spot key-goal"></i> Escape Gate</span>':'')+
      ((view.scenario==='beacons')?'<span><i class="key-spot key-beacon"></i> Signal beacon</span>':'')+
      (protractorVisible && ['hunter','monster'].includes(view.phase)
        ?'<span class="protractor-help">MEASURE: DRAG GOLD TIP · MOVE: DRAG CENTRE</span>':'')+
      ((view.phase==='hunter' && view.guided)?'<span><i class="key-spot key-available"></i> Candidate (analysis on)</span>' +
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
    '<p class="muted compact guided-route-help">Roads lead to: '+esc(adjacent)+'</p>'+
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
    '<button id="open-tutorial-game" class="field-guide-link" type="button">HOW TO HUNT &amp; BEARINGS TRAINING ↗</button>'+
    '</section>';
}

function clueSentence(clue) {
  const place=nameOf(clue.place);
  const observation=esc(roundCaption(clue.observedRound));
  const monster=esc(monsterFor(game.difficulty).name);
  if(clue.type==='teleport-origin')
    return '<b>'+monster+'</b> vanished from <strong>'+esc(place)+
      '</strong> during round '+(clue.observedRound+1)+
      '. This departure location is confirmed; its destination is hidden, 2–3 connected roads away.';
  if(clue.type==='rumour')
    return clue.status==='false'
      ?'You investigated <strong>'+esc(place)+
        '</strong> and exposed the report as a <b>false sighting</b>.'
      :'A villager claims <b>'+monster+'</b> was at <strong>'+esc(place)+
        '</strong> at the end of round '+clue.observedRound+
        '. <b>Unconfirmed.</b> Visit this location to verify the claim.';
  if(clue.type==='beacon')
    return 'A beacon fell at <strong>'+esc(nameOf(clue.pointNode))+
      '</strong> at the end of round '+clue.observedRound+
      '. The Monster was here <b>then</b>, but may have moved since.';
  const precise=clue.halfWidth===0;
  const range=precise
    ?'was exactly <strong>'+esc(clue.bounds[0])+'</strong>.'
    :'was between <strong>'+esc(clue.bounds[0])+'</strong> and <strong>'+
      esc(clue.bounds[1])+'</strong>.';
  if(clue.type==='sighting'){
    const source=clue.source==='lantern'?'Your Signal Lantern detected':'A watcher reports';
    return source+': the bearing of <b>'+monster+'</b> from <b>'+esc(place)+
      '</b> '+observation+' '+range;
  }
  const orientation=clue.kind==='reverse'
    ?'Bearing of <b>'+esc(place)+'</b> from <b>'+monster+'</b>'
    :'Bearing of <b>'+monster+'</b> from <b>'+esc(place)+'</b>';
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
      '<p class="muted compact">These are possible locations, not guaranteed positions. Older clues allow one road per normal Monster turn; a publicly announced teleport permits a 2–3-road jump.</p></div>'
    : plotClue ? '<p class="muted compact">Select a confirmed bearing or location clue. Unverified local rumours never constrain the mathematical candidate set.</p>' : '';
  const cards=view.clues.map((c,i)=>{
    const chosen=active.some(a=>a.id===c.id);
    const visit=c.type==='teleport-origin'?'CONFIRMED VANISHING POINT':
      c.type==='rumour'?(c.status==='false'?'DISPROVED REPORT':'UNCONFIRMED SIGHTING'):
      c.type==='beacon'?'PUBLIC BEACON REPORT':c.type==='sighting'?'PUBLIC SIGNAL':
      (c.ageLabel ? esc(c.ageLabel) : 'TRACE LEFT '+(c.visitRound===0?'AT SETUP':'ROUND '+c.visitRound));
    const routeDistance=Number.isInteger(c.distanceMin) ?
      '<p class="distance-hint">Road distance at observation: '+
      (c.distanceMin===c.distanceMax?'exactly '+c.distanceMin:
        c.distanceMin+'–'+c.distanceMax)+' connected roads</p>' : '';
    const label=c.type==='teleport-origin'?'MONSTER TELEPORTED':
      c.type==='rumour'?(c.status==='false'?'DECOY EXPOSED':'LOCAL RUMOUR'):
      c.type==='beacon'?'BEACON EXTINGUISHED':
      c.source==='lantern'?'SIGNAL LANTERN':
      c.type==='sighting'?'WATCHER SIGHTING':'TRACK CLUE '+(view.clues.length-i);
    return '<article class="clue-card '+(c.type==='sighting'?'sighting-card':
      c.type==='beacon'||c.type==='teleport-origin'?'beacon-card':
      c.type==='rumour'?'rumour-card':'')+'">' +
      '<div class="clue-meta"><span>'+label+'</span><span>'+visit+'</span></div>' +
      (view.guided && plotClue?'<label class="clue-check"><input type="checkbox" data-clue-toggle="'+esc(c.id)+
        '" '+(chosen?'checked':'')+'/> INCLUDE IN DEDUCTION</label>':'') +
      '<p>'+clueSentence(c)+'</p>'+routeDistance+
      '<small>Discovered round '+c.foundRound+
      (c.kind==='reverse'?' · Reverse the direction by 180°':' · Bearing starts at the stated location')+'</small>' +
      '<details class="clue-explanation"><summary>Explain the maths</summary><p>'+
        esc(clueMathExplanation(c,view.round,view.publicEvents))+'</p></details>' +
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

function monsterPortrait(difficulty,cssClass='') {
  const m=monsterFor(difficulty);
  return '<img class="monster-portrait '+cssClass+'" src="'+m.art+
    '" alt="Illustration of '+esc(m.name)+'" loading="eager"/>';
}

/** Solo level encounter shown before the first movement. No secret state. */
/** Illustrated Solo briefing: the round limit is always the current level's. */
function monsterIntroductionHtml(view) {
  const m=monsterFor(view.difficulty);
  const briefing=hunterBriefing(view);
  const level=String(Object.keys(MONSTERS).indexOf(view.difficulty)+1).padStart(2,'0');
  return '<div class="encounter-backdrop" data-encounter="intro">'+
    '<section class="encounter-card monster-encounter hunter-briefing" role="dialog" aria-modal="true" aria-labelledby="monster-intro-title">'+
      '<div class="encounter-art hunter-briefing-art">'+
        renderHunterSvg(hunterAppearance,{className:'briefing-hunter-illustration'})+
        '<div class="briefing-quarry-portrait">'+
          monsterPortrait(view.difficulty)+
          '<span>'+esc(m.name)+'</span>'+
        '</div>'+
      '</div>'+
      '<div class="encounter-copy briefing-copy">'+
        '<span class="eyebrow">LEVEL '+level+' · '+esc(m.home.toUpperCase())+
          ' · '+briefing.roundLimit+' ROUNDS</span>'+
        '<span class="encounter-kicker">YOUR MISSION BRIEFING</span>'+
        '<h1 id="monster-intro-title">'+esc(briefing.heading)+'</h1>'+
        '<h2 class="briefing-monster-name">FIND '+esc(m.name.toUpperCase())+'</h2>'+
        '<p class="briefing-text">'+esc(briefing.goal)+'</p>'+
        '<p class="briefing-text">'+esc(briefing.evidence)+'</p>'+
        '<p class="briefing-text briefing-warning">'+esc(briefing.warning)+'</p>'+
        (briefing.missionWarning?'<p class="briefing-mission-warning">'+esc(briefing.missionWarning)+'</p>':'')+
        '<div class="briefing-deadline"><strong>'+briefing.roundLimit+' ROUNDS</strong>'+
          '<span>'+esc(briefing.deadline)+'</span></div>'+
        '<div class="briefing-steps" aria-label="Your first steps">'+
          '<span>1 · READ CLUES</span><span>2 · MEASURE BEARINGS</span><span>3 · SEARCH LOCATIONS</span>'+
        '</div>'+
        '<div class="briefing-actions">'+
          '<button id="intro-begin" type="button" class="primary-button">BEGIN THE HUNT →</button>'+
          '<button id="intro-help" type="button" class="secondary-button">HOW TO PLAY</button>'+
        '</div>'+
      '</div></section></div>';
}

/** Prominent role-safe search result after each VALID Hunter movement. */
function searchReportHtml(view) {
  const report=view.hunterOutcome;
  if(!report)return '';
  const m=monsterFor(view.difficulty);
  const category={
    empty:'NOTHING FOUND',trace:'A NEW TRAIL',decoy:'FALSE SIGHTING EXPOSED',
    capture:'MONSTER CAPTURED'
  }[report.kind]||'SEARCH REPORT';
  return '<div class="encounter-backdrop" data-encounter="report">'+
    '<section class="encounter-card report-encounter report-'+esc(report.kind)+
      '" role="dialog" aria-modal="true" aria-labelledby="search-report-title">'+
      '<div class="report-art">'+monsterPortrait(view.difficulty)+'</div>'+
      '<div class="report-copy">'+
        '<span class="eyebrow">ROUND '+view.round+' · '+esc(nameOf(report.place))+'</span>'+
        '<span class="encounter-kicker">'+category+'</span>'+
        '<h2 id="search-report-title">'+esc(report.heading)+'</h2>'+
        '<p class="report-story">'+esc(report.text)+'</p>'+
        (report.clueId?'<p class="report-clue-note">The full dated clue is in your notebook.</p>':'')+
        '<div class="report-actions">'+
          '<button id="report-continue" type="button" class="primary-button">'+
            (view.phase==='over'?'SEE HUNT RESULTS →':'CONTINUE HUNT →')+'</button>'+
          (report.clueId&&view.phase==='hunter'
            ?'<button id="report-notebook" type="button" class="secondary-button">VIEW FIELD NOTEBOOK</button>':'')+
        '</div></div></section></div>';
}

function encounterOverlay(view) {
  if(monsterIntroOpen && view.mode==='solo' && view.phase==='hunter')
    return monsterIntroductionHtml(view);
  if(searchReportOpen && view.hunterOutcome &&
    ['hunter','over'].includes(view.phase))return searchReportHtml(view);
  return '';
}

function bindEncounters() {
  document.getElementById('intro-begin')?.addEventListener('click',()=>{
    monsterIntroOpen=false;
    persistNow();
    render();
  });
  document.getElementById('intro-help')?.addEventListener('click',openTutorial);
  document.getElementById('report-continue')?.addEventListener('click',()=>{
    searchReportOpen=false;
    if(game.phase!=='over')persistNow();
    render();
  });
  document.getElementById('report-notebook')?.addEventListener('click',()=>{
    searchReportOpen=false;
    hudTab='clues';
    persistNow();
    render();
  });
  document.getElementById(monsterIntroOpen?'intro-begin':'report-continue')?.focus?.();
}

function hudMissionSummary(view) {
  if(view.scenario==='escape')
    return 'ESCAPE GATE: '+nameOf(view.objectives.exitNode)+' · OPENS ROUND 5';
  if(view.scenario==='beacons')
    return 'BEACONS '+view.beaconVisits.length+'/'+view.objectives.beacons.length+' EXTINGUISHED';
  return 'FIND THE MONSTER BEFORE ROUND '+view.maxRounds;
}

function guidedCoachPanel(view) {
  const tip=guidedCoach(view,currentMap());
  if(!tip) return '';
  return '<section class="panel coach-panel" aria-label="Guided step-by-step help">'+
    '<span class="eyebrow">YOUR HUNTING COACH · '+tip.remaining+
      ' ROUND'+(tip.remaining===1?'':'S')+' LEFT</span>'+
    '<h3>'+esc(tip.title)+'</h3>'+
    '<p class="coach-instruction">'+esc(tip.instruction)+'</p>'+
    '<div class="coach-mini-checklist">'+
      '<strong>EVERY TURN</strong>'+
      '<p>1 · READ CLUES &nbsp; 2 · PLAN &nbsp; 3 · MEASURE &nbsp; 4 · SEARCH &nbsp; 5 · DEDUCE</p>'+
    '</div>'+
    (tip.example && tip.stepsLeft>0?
      '<div class="coach-example">'+
        '<span class="eyebrow">OPTIONAL WORKED ROAD EXAMPLE</span>'+
        '<p>From <strong>'+esc(tip.example.from)+'</strong>, look at the road towards <strong>'+
          esc(tip.example.to)+'</strong>. Measure clockwise from north first.</p>'+
        (coachAnswerVisible
          ?'<p class="coach-reveal-answer">Correct road bearing: <strong>'+
              esc(tip.example.bearing)+'</strong></p>'
          :'<button id="coach-reveal" type="button" class="secondary-button">REVEAL BEARING IN TEXT</button>')+
        '<p class="coach-disclaimer">This example is only text: no line will be drawn on the map.</p>'+
      '</div>':'')+
    '<div class="coach-actions">'+
      '<button id="coach-open-clues" type="button" class="secondary-button">READ MY CLUES</button>'+
      (tip.stepsLeft>0?'<button id="coach-open-protractor" type="button" class="secondary-button">'+
        (protractorVisible?'HIDE PROTRACTOR':'SHOW PROTRACTOR')+'</button>':'')+
      '<button id="coach-training" type="button" class="field-guide-link">FULL HOW-TO GUIDE &amp; PRACTICE ↗</button>'+
    '</div></section>';
}

function hudTabsHtml(view) {
  const isMonster=view.phase==='monster';
  const tabs=isMonster
    ? [['trail','TRAIL'],['mission','MISSION']]
    : [...(view.guided?[['coach','COACH']]:[]),
       ['clues','CLUES ('+view.clues.length+')'],['notes','NOTES'],['mission','MISSION'],
       ['stats','FEEDBACK']];
  const chosen=tabs.some(([id])=>id===hudTab)?hudTab:tabs[0][0];
  const tabBar=tabs.map(([id,label])=>'<button type="button" role="tab" id="hud-tab-'+id+
    '" data-hud-tab="'+id+'" aria-controls="hud-tab-panel" aria-selected="'+(chosen===id)+
    '" tabindex="'+(chosen===id?'0':'-1')+'">'+label+'</button>').join('');
  const panels={
    trail:()=>monsterTrailPanel(view),
    coach:()=>guidedCoachPanel(view),
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
  const mission=esc(monsterFor(view.difficulty).name+' · '+hudMissionSummary(view));
  return '<div class="app-shell hud-screen '+(isMonster?'monster-mode':'hunter-mode')+'">'+
    titleBar(true,view)+
    '<main class="play-content hud-content">'+
      '<div class="status-row hud-status"><div class="hud-status-main">'+
        (isMonster?'':'<span class="hud-hunter-avatar">'+renderHunterSvg(hunterAppearance,{bust:true,className:'hud-hunter-art'})+'</span>')+
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
      '<h3>Begin in the shadows</h3>'+monsterPortrait(view.difficulty,'setup-monster-art')+
      '<p class="muted">You are '+esc(monsterFor(view.difficulty).name)+
      '. Choose a purple location on the map, or use the list below. Keep this location hidden.</p>' +
      '<label class="setup-label" for="spawn-select">Your secret starting location</label>' +
      '<select id="spawn-select">'+spawnOptions+'</select>' +
      '<button id="confirm-spawn" class="primary-button">CONFIRM SECRET START →</button>' +
      '<p class="warning-note">Once confirmed, the screen will be completely hidden before it passes to the Hunter.</p>' +
      '</section>'+savePanel()+'</aside></div></main></div>';
}

function initialiseReplay(view){
  if(replayState)return;
  const frames=buildHuntReplay({...view,monsterName:monsterFor(view.difficulty).name},currentMap());
  const reduceMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
  replayState={frames,index:0,playing:frames.length>1 && !reduceMotion,
    speed:1250,skipped:frames.length===0};
}
function scheduleReplay(){
  if(replayTimeout!==null)clearTimeout(replayTimeout);
  replayTimeout=null;
  if(game.phase!=='over'||searchReportOpen||!replayState||
      replayState.skipped||!replayState.playing)return;
  if(replayState.index>=replayState.frames.length-1){
    replayState.playing=false;return;
  }
  replayTimeout=setTimeout(()=>{
    replayTimeout=null;
    if(game.phase!=='over'||searchReportOpen||!replayState||
        replayState.skipped||!replayState.playing)return;
    replayState.index=Math.min(replayState.frames.length-1,replayState.index+1);
    if(replayState.index===replayState.frames.length-1)replayState.playing=false;
    render();
  },replayState.speed);
}
function replayScreenHtml(view){
  const frames=replayState.frames;
  const frame=frames[replayState.index];
  const final=replayState.index>=frames.length-1;
  const monster=monsterFor(view.difficulty).name;
  const outcome=view.winner==='hunter'?'THE HUNTER PREVAILS':'THE MONSTER ESCAPES';
  const role=frame.role==='start'?'THE FIRST POSITIONS':
    frame.role==='hunter'?'HUNTER MOVEMENT':'MONSTER MOVEMENT';
  return '<div class="app-shell end-mode replay-mode">'+titleBar(false,view)+
    '<main class="replay-screen" aria-label="Post-game movement replay">'+
      '<header class="replay-heading"><div>'+
        '<span class="eyebrow">THE HUNT IS OVER · MOVEMENT REVEALED</span>'+
        '<h1>THE HUNT, <em>REPLAYED</em></h1>'+
        '<p>Follow each recorded movement in order. The Monster’s hiding places are revealed only now that the game has finished.</p>'+
      '</div><div class="replay-outcome">'+outcome+'</div></header>'+
      '<div class="replay-layout">'+
        '<div class="replay-map">'+mapFrame(replayMapView(view,frame))+'</div>'+
        '<aside class="replay-panel">'+
          '<span class="eyebrow">'+role+' · '+replayFrameCaption(frame,frames.length)+'</span>'+
          '<div class="replay-progress-caption"><strong>'+esc(frame.heading)+'</strong>'+
            '<span>'+replayState.index+' / '+(frames.length-1)+'</span></div>'+
          '<p id="replay-description" class="replay-story" aria-live="polite">'+esc(frame.description)+'</p>'+
          '<div class="replay-locations">'+
            '<div><span class="replay-dot hunter-dot">H</span><span><small>HUNTER</small><strong>'+esc(nameOf(frame.hunter))+'</strong></span></div>'+
            '<div><span class="replay-dot monster-dot">M</span><span><small>'+esc(monster.toUpperCase())+'</small><strong>'+esc(nameOf(frame.monster))+'</strong></span></div>'+
          '</div>'+
          '<label class="replay-scrub-label" for="replay-progress">MOVE BY MOVE · SCRUB THE TIMELINE</label>'+
          '<input id="replay-progress" type="range" min="0" max="'+(frames.length-1)+
            '" value="'+replayState.index+'" step="1" aria-label="Replay position, from starting positions to final move"/>'+
          '<div class="replay-buttons">'+
            '<button id="replay-prev" type="button" '+(replayState.index===0?'disabled':'')+' aria-label="Previous movement">← BACK</button>'+
            '<button id="replay-play-pause" type="button" '+(final?'disabled':'')+'>'+
              (replayState.playing?'Ⅱ PAUSE':'▶ PLAY')+'</button>'+
            '<button id="replay-next" type="button" '+(final?'disabled':'')+' aria-label="Next movement">NEXT →</button>'+
          '</div>'+
          '<div class="replay-secondary-actions">'+
            '<button id="replay-restart" type="button">↺ FROM START</button>'+
            '<button id="replay-speed" type="button" aria-label="Toggle playback speed">'+
              (replayState.speed===1250?'1× SPEED':'2× SPEED')+'</button>'+
          '</div>'+
          (final?'<p class="replay-complete">The final move is revealed. Review the outcome or replay the chase.</p>':'')+
          '<button id="replay-skip" type="button" class="primary-button">'+
            (final?'SEE FINAL RESULTS →':'SKIP REPLAY · SEE RESULTS →')+'</button>'+
        '</aside>'+
      '</div>'+
    '</main></div>';
}
function bindReplay(){
  if(!replayState||replayState.skipped)return;
  const last=replayState.frames.length-1;
  const manual=index=>{
    replayState.index=Math.max(0,Math.min(last,index));
    replayState.playing=false;render();
  };
  document.getElementById('replay-prev')?.addEventListener('click',()=>manual(replayState.index-1));
  document.getElementById('replay-next')?.addEventListener('click',()=>manual(replayState.index+1));
  document.getElementById('replay-progress')?.addEventListener('input',e=>manual(Number(e.target.value)));
  document.getElementById('replay-play-pause')?.addEventListener('click',()=>{
    replayState.playing=!replayState.playing;render();
  });
  document.getElementById('replay-speed')?.addEventListener('click',()=>{
    replayState.speed=replayState.speed===1250?625:1250;render();
  });
  document.getElementById('replay-restart')?.addEventListener('click',()=>{
    replayState.index=0;replayState.playing=true;render();
  });
  document.getElementById('replay-skip')?.addEventListener('click',()=>{
    replayState.playing=false;replayState.skipped=true;
    if(replayTimeout!==null)clearTimeout(replayTimeout);
    replayTimeout=null;
    render();
  });
}

function overHtml(view) {
  const hunterWin=view.winner==='hunter';
  const route=view.trail.map(t=>nameOf(t.node)).join(' → ');
  const creature=monsterFor(view.difficulty);
  return '<div class="app-shell end-mode">'+titleBar(false,view) +
    '<main class="play-content"><div class="end-header">' +
      '<span class="eyebrow">THE HUNT HAS ENDED</span><div class="result-symbol">'+(hunterWin?'✦':'◆')+'</div>' +
      '<h1>'+(hunterWin?'THE HUNTER PREVAILS':'THE MONSTER ESCAPES')+'</h1>' +
      monsterPortrait(view.difficulty,'end-monster-art')+
      '<h2 class="end-monster-name">'+esc(creature.name)+'</h2>' +
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
      '<div class="end-actions"><button id="replay-watch-again" class="secondary-button">↺ WATCH THE HUNT AGAIN</button><button id="play-again" class="primary-button">PLAY AGAIN →</button><button id="main-menu" class="secondary-button">RETURN TO MENU</button></div>' +
    '</main></div>';
}

function resetProtractor(keepVisible = false) {
  protractorBearing=0;
  protractorPosition=null;
  if(!keepVisible)protractorVisible=false;
}

/**
 * Manual tool only. No adjacent-road bearing or private Monster coordinate is
 * read by these handlers: users position and rotate the transparent overlay.
 * Pointer moves update stable SVG nodes without replacing the active element.
 */
function bindProtractor() {
  document.getElementById('protractor-toggle')?.addEventListener('click',()=>{
    protractorVisible=!protractorVisible;
    protractorPosition=null;
    protractorBearing=0;
    render();
  });
  if(!protractorVisible)return;
  const showValue=()=>{
    const label=formatBearing(protractorBearing);
    const output=document.getElementById('protractor-readout');
    if(output)output.textContent=label;
    const num=document.getElementById('protractor-number');
    if(num)num.textContent=label;
    document.getElementById('protractor-arm-group')?.setAttribute('transform',
      'rotate('+protractorBearing+')');
  };
  const turn=step=>{
    protractorBearing=normalizeBearing(protractorBearing+step);
    showValue();
  };
  document.getElementById('protractor-minus')?.addEventListener('click',()=>turn(-1));
  document.getElementById('protractor-plus')?.addEventListener('click',()=>turn(1));
  document.getElementById('protractor-center')?.addEventListener('click',()=>{
    protractorPosition=null;
    render();
  });
  const svg=document.querySelector?.('.world-svg');
  if(!svg || !svg.createSVGPoint || !svg.getScreenCTM)return;
  const mapPosition=event=>{
    const matrix=svg.getScreenCTM();
    if(!matrix)return null;
    const point=svg.createSVGPoint();
    point.x=event.clientX;
    point.y=event.clientY;
    return point.matrixTransform(matrix.inverse());
  };
  const beginDrag=(target,mode)=>{
    target.addEventListener('pointerdown',event=>{
      if(event.button!==undefined && event.button!==0)return;
      event.preventDefault?.();
      target.setPointerCapture?.(event.pointerId);
      const pointerId=event.pointerId;
      const move=e=>{
        if(e.pointerId!==pointerId)return;
        const point=mapPosition(e);
        if(!point)return;
        if(mode==='move'){
          protractorPosition={
            x:Math.max(10,Math.min(990,Math.round(point.x))),
            y:Math.max(10,Math.min(710,Math.round(point.y)))
          };
          document.getElementById('protractor-group')?.setAttribute('transform',
            'translate('+protractorPosition.x+' '+protractorPosition.y+')');
        }else {
          const actor=game.phase==='monster'?game.monster:game.hunter;
          const origin=protractorPosition || currentMap().nodes[actor];
          if(!origin)return;
          const reading=bearingFromPointer(point.x,point.y,origin.x,origin.y);
          if(reading!==null){
            protractorBearing=reading;
            showValue();
          }
        }
      };
      const stop=e=>{
        if(e.pointerId!==pointerId)return;
        target.removeEventListener('pointermove',move);
        target.removeEventListener('pointerup',stop);
        target.removeEventListener('pointercancel',stop);
        target.releasePointerCapture?.(pointerId);
      };
      target.addEventListener('pointermove',move);
      target.addEventListener('pointerup',stop);
      target.addEventListener('pointercancel',stop);
      move(event);
    });
  };
  document.querySelectorAll('[data-protractor-rotate]').forEach(element=>beginDrag(element,'rotate'));
  document.querySelectorAll('[data-protractor-move]').forEach(element=>beginDrag(element,'move'));
}

function bindMapZoom() {
  bindProtractor();
  document.getElementById('map-zoom-in')?.addEventListener('click',()=>{
    mapZoom=Math.min(3,Math.round((mapZoom+0.25)*100)/100);
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
      resetReplay();
      monsterIntroOpen=false;searchReportOpen=false;
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
  resetReplay();
  monsterIntroOpen=false;searchReportOpen=false;
  nodeMarks.clear();fieldNotes='';selectedClueIds=null;plotClue=false;tutorialOpen=false;
  difficultyPicker=false;scenarioPicker=false;
  resetProtractor();
  render();
}

function render() {
  const view=viewForCurrentScreen(game);
  // Keep saved games on the home screen; clear completed games.
  if(view.phase==='over')clearSaved(storage());
  else if(view.phase!=='home')persistNow();
  // Critical privacy boundary: handoff markup is generated without map, role, logs or secret data.
  if(view.phase.startsWith('pass-')) {
    monsterIntroOpen=false;searchReportOpen=false;
    resetProtractor();
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
  if(view.phase==='home' && forgeOpen){
    mount.innerHTML=forgeHtml();
    bindForge();
    return;
  }
  if(view.phase==='home') {
    mount.innerHTML=homeHtml();
    document.getElementById('forge-open')?.addEventListener('click',openForge);
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
    initialiseReplay(view);
    const showReplay=replayState && !replayState.skipped;
    mount.innerHTML=(showReplay?replayScreenHtml(view):overHtml(view))+encounterOverlay(view);
    bindEncounters();
    bindCommon();
    bindMapZoom();
    if(showReplay){
      bindReplay();
      scheduleReplay();
    }else{
      document.getElementById('replay-watch-again')?.addEventListener('click',()=>{
        if(!replayState)return;
        replayState.index=0;replayState.skipped=false;replayState.playing=true;
        mapZoom=1;render();
      });
      document.getElementById('play-again').addEventListener('click',()=>start(game.mode,game.difficulty,game.scenario));
      document.getElementById('main-menu').addEventListener('click',()=>{
        Object.assign(game,createGame());
        resetReplay();
        monsterIntroOpen=false;searchReportOpen=false;
        nodeMarks.clear(); fieldNotes=''; selectedClueIds=null; plotClue=false; tutorialOpen=false;
        difficultyPicker = false;mapZoom=1;
        render();
      });
    }
    return;
  }
  mount.innerHTML=playHtml(view)+encounterOverlay(view);
  // If a search report covers the moving figure, play the route animation
  // when that report is dismissed instead of wasting it behind the overlay.
  if(!searchReportOpen)pendingHunterMotion=null;
  bindEncounters();
  bindCommon();
  document.querySelectorAll('[data-hud-tab]').forEach(button=>{
    button.addEventListener('click',()=>{
      hudTab=button.dataset.hudTab;
      render();
    });
  });
  document.getElementById('coach-open-clues')?.addEventListener('click',()=>{
    hudTab='clues';render();
  });
  document.getElementById('coach-open-protractor')?.addEventListener('click',()=>{
    protractorVisible=!protractorVisible;
    protractorPosition=null;
    protractorBearing=0;
    render();
  });
  document.getElementById('coach-reveal')?.addEventListener('click',()=>{
    coachAnswerVisible=true;render();
  });
  document.getElementById('coach-training')?.addEventListener('click',openTutorial);
  bindMapZoom();
  document.getElementById('move-form').addEventListener('submit',event=>{
    event.preventDefault();
    const value=document.getElementById('bearing-input').value;
    const before=view.phase==='hunter'?game.hunter:game.monster;
    const result=view.phase==='hunter'
      ?hunterMove(game,value)
      :monsterMove(game,value,{veil:document.getElementById('veil-move')?.checked===true});
    const after=view.phase==='hunter'?game.hunter:game.monster;
    if(before!==after) {
      if(view.phase==='hunter')pendingHunterMotion={from:before,to:after};
      coachAnswerVisible=false;
      resetProtractor(view.phase==='hunter' && game.mode==='solo');
      if(view.phase==='hunter' && result.ok && game.hunterOutcome)
        searchReportOpen=true;
    }
    render();
  });
  document.getElementById('end-turn')?.addEventListener('click',()=>{
    coachAnswerVisible=false;
    searchReportOpen=false;
    endHunterTurn(game);
    resetProtractor(game.mode==='solo');
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
  if(view.phase==='hunter' && view.stepsLeft===0 && !searchReportOpen)
    document.getElementById('end-turn')?.focus();
}

/** Re-seal when hidden so app-switch / returning to a tab cannot reveal a private view. */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    const phase=game.phase;
    sealTurn(game);
    if(phase!==game.phase) {
      tutorialOpen=false;monsterIntroOpen=false;searchReportOpen=false;
      resetProtractor();
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
