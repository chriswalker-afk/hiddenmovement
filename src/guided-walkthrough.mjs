/**
 * First-turn guided play. Everything shown here is built from the PUBLIC
 * Hunter projection: NEVER the game object, secret Monster node or AI trail.
 * This does not change a legal road, angle, clue or victory condition.
 */
import { hunterTurnTransition } from './turn-transition.mjs';

export const TOUR_STAGES=Object.freeze([
  'enable-protractor','place-protractor','open-clue','read-bearing',
  'enable-deduction','explain-deduction','first-move','search-report',
  'second-move','end-turn','monster-wait','monster-moved',
  'independent','done'
]);

export const DEFAULT_TOUR_STAGE='enable-protractor';

export function validTourStage(value){
  return typeof value==='string'&&TOUR_STAGES.includes(value);
}

const TRANSITIONS=Object.freeze({
  'enable-protractor':{'tool-on':'place-protractor'},
  'place-protractor':{'tool-centred':'open-clue'},
  'open-clue':{'clues-open':'read-bearing'},
  'read-bearing':{'bearing-read':'enable-deduction'},
  'enable-deduction':{'deduction-on':'explain-deduction'},
  'explain-deduction':{'understood':'first-move'},
  'first-move':{'hunter-moved':'search-report'},
  'search-report':{'report-dismissed':'second-move'},
  'second-move':{'hunter-moved':'end-turn'},
  'end-turn':{'turn-ended':'monster-wait'},
  'monster-wait':{'monster-finished':'monster-moved'},
  'monster-moved':{'clues-open':'independent'},
  'independent':{'finish':'done'}
});
/** Returns the next stage. Inactive/irrelevant events have no effect. */
export function advanceTour(stage,event){
  if(!validTourStage(stage))return DEFAULT_TOUR_STAGE;
  if(event==='skip')return 'done';
  if(event==='turn-ended' && stage!=='done'&&stage!=='monster-wait'&&
    stage!=='monster-moved'&&stage!=='independent')return 'monster-wait';
  if(event==='hunter-moved' && stage!=='done' && stage!=='monster-wait' &&
    stage!=='monster-moved' && stage!=='independent')
    return stage==='second-move'?'end-turn':'search-report';
  return TRANSITIONS[stage]?.[event]||stage;
}
/** Save-resume reconciliation uses only role, round and public steps left. */
export function reconcileTour(stage,view){
  if(!view.guided||!validTourStage(stage))return 'done';
  if(view.phase==='over')return 'done';
  if(stage==='monster-wait'&&view.phase==='hunter'&&view.round>1)
    return 'monster-moved';
  if(view.phase!=='hunter')return stage;
  if(view.round>1 &&
    !['monster-moved','independent','done'].includes(stage))
    return 'monster-moved';
  if(view.stepsLeft===0&&
    ['first-move','second-move','search-report'].includes(stage))
    return 'end-turn';
  return stage;
}

const isNumber=x=>Number.isFinite(x);
export function nearHunter(position,hunter,radius=35){
  return !!(position&&hunter&&
    [position.x,position.y,hunter.x,hunter.y].every(isNumber)&&
    Math.hypot(position.x-hunter.x,position.y-hunter.y)<=radius);
}
export function initialRulerPosition(hunter){
  if(!hunter||!isNumber(hunter.x)||!isNumber(hunter.y))return null;
  // The ruler intentionally starts away from the Hunter for the first
  // guided lesson, so students physically practise positioning its centre.
  const x=Math.max(150,Math.min(845,hunter.x+166));
  const y=Math.max(150,Math.min(560,hunter.y-116));
  return {x,y};
}

/** At the start of a hunt the watcher bearing is a PUBLIC dated clue. */
function publicBearingClue(view){
  return (view.clues||[]).find(c=>
    (c.type==='sighting'||c.type==='trace')&&
    typeof c.place==='string'&&Array.isArray(c.bounds)
  )||null;
}
function readDirection(view,map){
  const c=publicBearingClue(view);
  if(!c)return 'Read the newest clue. Identify the FROM location and OBSERVATION ROUND before measuring clockwise from north.';
  const from=map.nodes[c.place]?.name||'the stated observation point';
  const value=c.halfWidth===0
    ?c.bounds[0]+' exactly'
    :c.bounds[0]+' to '+c.bounds[1]+' (a sector, not an exact position)';
  const reverse=c.kind==='reverse'
    ?' This clue is REVERSED: first subtract or add 180° to point from the named location towards the Monster.'
    :' Start at the named location and turn clockwise from north.';
  return 'The clue begins at '+from+' and describes round '+
    c.observedRound+'. Its bearing is '+value+'.'+reverse+
    ' Drag the protractor centre onto that FROM location if needed. Rotate the gold arm to inspect the direction or sector. An older clue is NOT live GPS.';
}

/**
 * The first 13 steps deliberately use actual interface controls. Optional
 * explanations use a continue button; action steps advance on the real user
 * action rather than a timer or fabricated progress.
 */
export function tourStep(view,map,stage){
  if(!view.guided||!validTourStage(stage))return null;
  if(view.phase==='monster' && stage==='monster-wait')return {
    stage,heading:'Monster movement: travel in secret',
    text:'It is now the Monster’s turn. The Hunter must not see this screen. Use your own secret location as the FROM point, measure clockwise from north along one connected road, type the THREE digits and press MOVE. You may use the manual protractor. The game seals the screen before you pass the device back. Your destination stays secret.',
    target:'#bearing-input',secondary:'#move-form button[type="submit"]',
    counter:'10 / 12'
  };
  if(view.phase!=='hunter'||['done','monster-wait'].includes(stage))return null;
  const name=map.nodes[view.hunter]?.name||'your starting place';
  const monsterLabel='the Monster';
  const steps={
    'enable-protractor':{
      heading:'Turn on your protractor',
      text:'You are the Monster Hunter. First, press PROTRACTOR above the map. Watch for the gold measuring tool to appear. This is a real manual protractor, not an automatic answer.',
      target:'#protractor-toggle',counter:'01 / 12'
    },
    'place-protractor':{
      heading:'Put its centre on your Hunter',
      text:'Find your Hunter character at '+name+'. Drag the small centre cross of the protractor onto the ROUND LOCATION MARKER immediately beside the character. That exact point is the FROM location for measuring a move. On phones or with a keyboard, choose CENTER ON HUNTER in this guide instead.',
      target:'.protractor-center-hit',secondary:'.hunter-board-piece',counter:'02 / 12'
    },
    'open-clue':{
      heading:'Find your first clue',
      text:'Now press CLUES. The opening watcher report is the evidence you should read first. Look for where the bearing starts and when the Monster was observed.',
      target:'#hud-tab-clues',counter:'03 / 12'
    },
    'read-bearing':{
      heading:'Read the clue with the protractor',
      text:readDirection(view,map)+' The clue card is flashing; use the gold tip on the protractor, then choose I HAVE READ THE CLUE.',
      target:'.clue-card',secondary:'.protractor-tip',action:'I HAVE READ THE CLUE',event:'bearing-read',counter:'04 / 12'
    },
    'enable-deduction':{
      heading:'Switch on your deduction overlay',
      text:'In Guided mode only, you can press COMBINE CLUES ON THE MAP. This optional training aid marks possible positions using public evidence. It does not reveal where the Monster currently is.',
      target:'#plot-toggle',counter:'05 / 12'
    },
    'explain-deduction':{
      heading:'Understand the shaded possibilities',
      text:'The highlighted candidates satisfy the selected clues, allowing for the Monster’s secret movements over time. A clue from an earlier round is not a guaranteed current position. You can hide the overlay at any time.',
      target:'.analysis-summary',secondary:'#plot-toggle',action:'I UNDERSTAND',event:'understood',counter:'06 / 12'
    },
    'first-move':{
      heading:'Make your first Hunter move',
      text:'Look at your Hunter at '+name+'. Choose ONE connected road. Put the protractor centre on your Hunter, measure clockwise from 000° north along that road, then type the THREE digits into this box and press MOVE. A wrong bearing can be retried without using a move.',
      target:'#bearing-input',secondary:'#move-form button[type="submit"]',counter:'07 / 12'
    },
    'search-report':{
      heading:'Search the location you reached',
      text:'When you arrive, the search report explains whether you found a recent trace, an unreliable sighting or nothing. Read it before continuing. A trace gives a dated bearing — it does not reveal the Monster now.',
      target:'#report-continue',counter:'08 / 12'
    },
    'second-move':{
      heading:'You can make a second move',
      text:'You have another road move this turn. Re-centre your protractor on your NEW Hunter location, pick a connected road and enter its three-figure bearing. You may also finish the turn early with END TURN.',
      target:'#bearing-input',secondary:'#end-turn',counter:'09 / 12'
    },
    'end-turn':{
      heading:'Finish your Hunter turn',
      text:'Your Hunter has finished moving. '+
        (hunterTurnTransition(view)?.hint||'No Hunter moves remain.')+
        ' Look for the large gold button: '+
        (hunterTurnTransition(view)?.button||'BEGIN MONSTER’S HIDDEN MOVEMENT')+
        '. The Monster does not start moving until you press it.',
      target:'#end-turn',counter:'10 / 12'
    },
    'monster-moved':{
      heading:'The Monster moved in secret',
      text:'The Monster has completed its SECRET movement phase. You cannot see its position. Check the CLUES tab for a new watcher report, teleport departure or unconfirmed rumour, if one appeared. Compare each clue’s observation round with the current round.',
      target:'#hud-tab-clues',counter:'11 / 12'
    },
    'independent':{
      heading:'You are now on your own!',
      text:'You have used the protractor, read a dated clue, tried the optional deduction overlay, travelled along roads and seen the Monster’s hidden turn. Now use those skills to find '+monsterLabel+' before the round limit. The Coach tab, tools and full guide remain available whenever you need them.',
      target:null,action:'START HUNTING INDEPENDENTLY',event:'finish',counter:'12 / 12'
    }
  };
  const step=steps[stage];
  return step?{stage,...step}:null;
}
