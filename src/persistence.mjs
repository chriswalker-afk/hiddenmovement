import { createGame, sealTurn } from './engine.mjs';

export const STORAGE_KEY='shadow-bearings-save-v1';
const VERSION=1;
const ACTIVE_PHASES=new Set([
  'hunter','monster','monster-setup','pass-hunter','pass-monster','pass-monster-setup'
]);
const OWN=['round','phase','hunter','monster','stepsLeft','randomState','nextTrailId',
  'veilCharges','lanternCharges','beaconVisits','publicEvents','monsterTrail',
  'hunterTrail','collectedVisitIds','clues','history','hunterStats','feedback',
  'monsterCooldowns','activeDecoys','hunterOutcome'];
const isObject=v=>v!==null && typeof v==='object' && !Array.isArray(v);
const finiteInt=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const validNodes=(array,map)=>Array.isArray(array)&&array.length<=300&&
  array.every(id=>typeof id==='string'&&Object.hasOwn(map.nodes,id));

/**
 * Save an intentionally small snapshot without duplicating map objects or
 * user-generated HTML. All Monster secrets are locally stored so the browser
 * can resume offline; this is NOT secure against browser developer tools.
 */
export function serializeGame(game,ui={}) {
  if(!ACTIVE_PHASES.has(game.phase))throw new RangeError('Only active games may be saved');
  const data={version:VERSION,savedAt:Date.now(),
    mode:game.mode,difficulty:game.difficulty,scenario:game.scenario,
    guided:game.guided,seed:game.seed};
  for(const key of OWN)data[key]=game[key];
  const validMarks=Array.isArray(ui.marks)?ui.marks.filter(([id,mark])=>
    typeof id==='string'&&Object.hasOwn(game.map.nodes,id)&&['possible','ruled'].includes(mark)): [];
  data.ui={
    marks:validMarks.slice(0,80),
    fieldNotes:typeof ui.fieldNotes==='string'?ui.fieldNotes.slice(0,400):'',
    selectedClueIds:Array.isArray(ui.selectedClueIds)?ui.selectedClueIds.filter(x=>typeof x==='string').slice(0,100):null,
    plotClue:!!ui.plotClue,
    introSeen:ui.introSeen!==false,
    reportSeen:ui.reportSeen!==false
  };
  return JSON.stringify(data);
}

export function restoreGame(raw) {
  let data;
  try{data=typeof raw==='string'&&raw.length<180000?JSON.parse(raw):null;}
  catch{return null;}
  if(!isObject(data)||data.version!==VERSION||!ACTIVE_PHASES.has(data.phase))return null;
  if(!['solo','multi'].includes(data.mode)||!['intro','apprentice','tracker','expert'].includes(data.difficulty)||
      !['classic','escape','beacons'].includes(data.scenario))return null;
  if(!finiteInt(data.seed,0,4294967295)||!finiteInt(data.randomState,0,4294967295))return null;
  // Legacy solo saves predate the Standard/Guided split and used watcher
  // sightings; reopen these as Guided rather than silently changing their rules.
  if(data.guided!==undefined && typeof data.guided!=='boolean')return null;
  const guided=data.guided===true || (data.guided===undefined && data.mode==='solo');
  const game=createGame({mode:data.mode,difficulty:data.difficulty,
    scenario:data.scenario,guided,seed:data.seed});
  const map=game.map;
  if(!Object.hasOwn(map.nodes,data.hunter))return null;
  if(data.monster!==null&&!Object.hasOwn(map.nodes,data.monster))return null;
  if(!finiteInt(data.round,1,game.config.maxRounds) ||
      !finiteInt(data.stepsLeft,0,game.config.hunterSteps)||
      !finiteInt(data.nextTrailId,1,500)||
      !finiteInt(data.veilCharges,0,1)||!finiteInt(data.lanternCharges,0,1))return null;
  if(!validNodes(data.hunterTrail,map)||data.hunterTrail.length<1||
      !Array.isArray(data.monsterTrail)||data.monsterTrail.length>100||
      !data.monsterTrail.every(t=>isObject(t)&&Object.hasOwn(map.nodes,t.node)&&finiteInt(t.round,0,game.config.maxRounds)&&
        typeof t.id==='string'))return null;
  if(!Array.isArray(data.beaconVisits)||!data.beaconVisits.every(id=>game.objectives.beacons.includes(id))||
      new Set(data.beaconVisits).size!==data.beaconVisits.length)return null;
  if(!Array.isArray(data.collectedVisitIds)||data.collectedVisitIds.length>100||
      !Array.isArray(data.publicEvents)||data.publicEvents.length>100||
      !Array.isArray(data.history)||data.history.length>200||
      !Array.isArray(data.clues)||data.clues.length>150||
      !isObject(data.hunterStats))return null;
  for(const key of ['attempts','successful','errors'])
    if(!finiteInt(data.hunterStats[key],0,500))return null;
  if(!Number.isFinite(data.hunterStats.totalAngleError)||
      data.hunterStats.totalAngleError<0||data.hunterStats.totalAngleError>10000)return null;
  if(typeof data.feedback!=='string'||data.feedback.length>1000)return null;
  if(data.monsterCooldowns!==undefined) {
    if(!isObject(data.monsterCooldowns))return null;
    for(const key of ['teleportReadyRound','decoyReadyRound'])
      if(data.monsterCooldowns[key]!==null &&
        !finiteInt(data.monsterCooldowns[key],1,200))return null;
  }
  if(data.activeDecoys!==undefined) {
    if(!Array.isArray(data.activeDecoys)||data.activeDecoys.length>50 ||
      !data.activeDecoys.every(d=>isObject(d)&&
        typeof d.id==='string'&&d.id.length<100 &&
        Object.hasOwn(map.nodes,d.node)&&
        finiteInt(d.createdRound,1,game.config.maxRounds)&&
        typeof d.revealed==='boolean'))return null;
  }
  if(data.hunterOutcome!==undefined && data.hunterOutcome!==null) {
    const o=data.hunterOutcome;
    if(!isObject(o)||!['empty','trace','decoy','capture'].includes(o.kind)||
      !Object.hasOwn(map.nodes,o.place)||typeof o.heading!=='string'||
      typeof o.text!=='string'||o.text.length>1500)return null;
  }
  if(data.mode==='multi'&&data.difficulty!=='intro')return null;
  if(data.phase==='monster-setup'&&data.monster!==null)return null;
  if(data.phase!=='monster-setup'&&data.phase!=='pass-monster-setup'&&data.monster===null)return null;
  // Older saved hunts predate monster abilities; defaults from createGame()
  // remain valid when those newer optional fields are absent.
  for(const key of OWN)if(Object.hasOwn(data,key))game[key]=data[key];
  // Even if a snapshot was created in the middle of a role turn, restore to
  // an entirely blank role handoff so refresh cannot expose the prior screen.
  sealTurn(game);
  const ui=isObject(data.ui)?data.ui:{};
  const marks=Array.isArray(ui.marks)?ui.marks.filter(x=>Array.isArray(x)&&
    x.length===2&&Object.hasOwn(map.nodes,x[0])&&['possible','ruled'].includes(x[1])).slice(0,80):[];
  return {game,ui:{
    fieldNotes:typeof ui.fieldNotes==='string'?ui.fieldNotes.slice(0,400):'',
    marks,plotClue:!!ui.plotClue,
    introSeen:ui.introSeen!==false,reportSeen:ui.reportSeen!==false,
    selectedClueIds:Array.isArray(ui.selectedClueIds)?
      ui.selectedClueIds.filter(x=>typeof x==='string').slice(0,100):null
  }};
}

/** Read a safe public summary for the title screen, never any secret position. */
export function savedSummary(storage) {
  const saved=readSaved(storage);
  if(!saved)return null;
  return {mode:saved.game.mode,difficulty:saved.game.difficulty,
    scenario:saved.game.scenario,round:saved.game.round};
}

export function readSaved(storage) {
  try{
    if(!storage || typeof storage.getItem!=='function')return null;
    return restoreGame(storage.getItem(STORAGE_KEY));
  }catch{return null;}
}

export function persistSaved(storage,game,ui) {
  try{
    if(!storage||typeof storage.setItem!=='function')return false;
    storage.setItem(STORAGE_KEY,serializeGame(game,ui));
    return true;
  }catch{return false;}
}

export function clearSaved(storage) {
  try{
    if(!storage||typeof storage.removeItem!=='function')return false;
    storage.removeItem(STORAGE_KEY);
    return true;
  }catch{return false;}
}
