import { WATERWAYS, waterwayPath } from './waterways.mjs';

/**
 * Blackfen Marsh, the Intro world. The stable IDs and world coordinates come
 * from the original 14-node graph; changing any of them changes bearings.
 * One source of truth drives both the visible names and individual artwork.
 * All SVG is original, deterministic, and below the playable graph layer.
 */
const SITES = [
  ['A',"Warden's Watch",100,380,'watch',45,61,'western approach'],
  ['B','Pine Crossing',210,225,'pine',45,59,'northwest copse'],
  ['C','Broken Mill',240,470,'mill',53,44,'western millrace'],
  ['D','Crow Farm',360,120,'farm',47,70,'northern fields'],
  ['E','Whisper Wood',420,345,'wood',46,63,'central woodland'],
  ['F','Fen Chapel',390,590,'chapel',57,3,'southern fen rise'],
  ['G','Lantern Inn',590,185,'inn',53,67,'northeast road'],
  ['H','Moss Bridge',620,445,'bridge',0,0,'creek crossing'],
  ['I','Blackwater Landing',800,315,'landing',30,16,'eastern water edge'],
  ['J','Barrow Hill',790,85,'barrow',-45,70,'northern heights'],
  ['K','Standing Stones',800,575,'stones',-49,17,'southeastern field'],
  ['L','East Fen Gate',930,410,'gate',-61,51,'eastern boundary'],
  ['M','Old Swamp',145,640,'swamp',55,-2,'southwestern bog'],
  ['N','Stone Quarry',575,640,'quarry',57,-8,'southern dry ground']
];
export const BLACKFEN_SITES=Object.freeze(SITES.map(
  ([id,name,x,y,kind,artDx,artDy,zone])=>
    Object.freeze({id,name,x,y,kind,artDx,artDy,zone})
));
export const BLACKFEN_LANDMARKS=Object.freeze(
  Object.fromEntries(BLACKFEN_SITES.map(s=>[s.id,s]))
);

const ink='#14232b',stone='#9caa99',mortar='#435354',
  timber='#765d47',oak='#b49b74',roof='#394c4d',
  amber='#f3ca7e',moss='#6b876c',water='#477780';

function path(d,fill,stroke=ink,sw=2.6,opacity=1){
  return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+
    '" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+opacity+'"/>';
}
function line(d,color=oak,sw=2.3,opacity=1){
  return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+sw+
    '" stroke-linecap="round" stroke-linejoin="round" opacity="'+opacity+'"/>';
}
function ellipse(cx,cy,rx,ry,fill,opacity=1){
  return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+
    '" fill="'+fill+'" opacity="'+opacity+'"/>';
}
function cabin(w=43,h=33){
  return path('M'+(-w/2)+' 0 L0 -20 L'+(w/2)+' 0 Z',roof,ink,3)+
    path('M'+(-w/2+4)+' 0V'+h+'H'+(w/2-4)+'V0Z',stone,ink,3)+
    line('M'+(-w/2+4)+' 8H'+(w/2-4),mortar,2);
}
function pane(x,y){
  return '<rect x="'+x+'" y="'+y+'" width="9" height="12" rx="1" fill="'+amber+
    '" stroke="#553f35" stroke-width="2"/>'+
    line('M'+(x+4.5)+' '+y+'v12 M'+x+' '+(y+6)+'h9','#987547',1.3);
}
function pineTree(x,y,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    line('M0 10v19',timber,3)+
    path('M0 -35L-14 -12H-8L-20 6H-10L-24 19H24L10 6H20L8 -12H14Z',
      '#29483f','#192c30',2)+
    line('M-7 -12L0 -26L9 -11 M-13 6L0 -9L14 6','#7a9a7b',2,.54)+
    '</g>';
}
function reeds(x,y,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    line('M-13 14Q-20 -4-16 -22M0 17Q-4 -3 3 -29M12 14Q7 -4 16 -20',moss,2.6,.95)+
    line('M-16 -22l0 -6 M3 -29l2 -7 M16 -20l2 -6',oak,4,.86)+
    '</g>';
}
function stoneBlock(x,y,scale=1){
  return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+
    path('M-11 8L-10 -12L-3 -17L10 -10L13 9Z','#7d9187','#233d42',2.4)+
    line('M-8 -6L-3 -10M3 -10L7 -3','#d4d2b7',1.3,.5)+'</g>';
}
function lamp(x,y){
  return '<g transform="translate('+x+' '+y+')">'+
    line('M0 11V-12','#3b4039',2.4)+
    path('M-5 -13L5 -13L7 -26L-7 -26Z',amber,'#544a3a',2)+
    path('M-9 -27L0 -33L9 -27Z',roof,ink,1.8)+
    ellipse(0,-19,15,15,amber,.09)+'</g>';
}

function landmarkArt(kind){
  switch(kind){
    case 'watch':
      return ellipse(0,41,45,12,'#172e33',.44)+
        path('M-21 33V-17L0 -28L21 -17V33Z','#5b695a',ink,3)+
        path('M-27 -17L0 -39L27 -17Z',roof,ink,3)+
        line('M-17 -7L17 27 M17 -7L-17 27',oak,3,.85)+
        path('M-7 33V10Q0 0 7 10V33Z','#2b403e',ink,2)+
        lamp(25,1)+line('M-29 35H28','#c2aa7d',2.7,.65);
    case 'pine':
      return ellipse(0,35,51,13,'#223f36',.6)+
        pineTree(-25,6,1.15)+pineTree(23,9,.96)+pineTree(-4,-1,.78)+
        line('M0 7V31',oak,4)+
        path('M-4 10L25 4L25 16L-4 22Z','#aa8965',ink,2)+
        line('M-12 31Q0 23 15 31','#b4a079',2.2,.6);
    case 'mill':
      return ellipse(3,37,54,13,'#203d3e',.57)+
        cabin(46,32)+pane(-18,8)+
        path('M-4 31V13Q2 6 8 13V31Z','#273c40',ink,2)+
        '<circle cx="28" cy="17" r="18" fill="none" stroke="#937c5a" stroke-width="4"/>'+
        '<circle cx="28" cy="17" r="4" fill="#c2a475" stroke="#273b3c" stroke-width="2"/>'+
        line('M28 0V9M14 10L23 14M42 24L35 20M28 35L28 44M14 32L21 23',oak,3)+
        // A deliberate missing wheel spoke makes the mill visibly ruined.
        line('M36 0L47 -10 M49 -7L54 -14','#d0c49d',2,.7)+
        path('M-25 32L-11 34L-4 44L-39 42Z','#5e6b63',ink,1.4)+
        line('M-39 46Q8 53 55 47',water,3,.66);
    case 'farm':
      return ellipse(0,36,62,12,'#3b5039',.62)+
        path('M-29 3L0 -24L31 3Z','#6b4d40',ink,3)+
        path('M-27 3V30H28V3Z','#866a4e',ink,3)+
        line('M-20 11L-20 28M-10 11L-10 28M0 11V29M12 11V29M23 11V27',oak,2,.7)+
        path('M-8 29V9H8V29Z','#2c3837',ink,2)+
        line('M-7 10L8 28M8 10L-7 28','#a18a69',2.5)+
        line('M-55 34L-39 29L-32 35M36 30L55 26L61 33',oak,2.4)+
        line('M-47 25V38M-34 23V40M45 24V37M57 22V36',oak,2.2)+
        line('M48 -2V27M37 9L58 11',stone,2.2)+
        ellipse(48,-7,7,5,'#c6ab70');
    case 'wood':
      return ellipse(2,33,55,13,'#162d2b',.62)+
        path('M-31 33Q-19 4-25 -26L-18 -24Q-5 -1-7 33Z','#645744',ink,2.6)+
        line('M-21 -16L-39 -27L-42 -39M-20 -10L-10 -30L-3 -34','#a99a76',3,.8)+
        path('M10 34Q11 -9 21 -32L26 -28Q22 -2 31 34Z','#695744',ink,2.6)+
        line('M22 -18L42 -34L46 -42M24 -13L11 -37',oak,3,.75)+
        path('M-39 -26Q-58 -38-42 -51Q-23 -62-10 -46Q0 -51 9 -43L16 -34Z',
          '#315143',ink,2)+
        path('M14 -37Q36 -58 54 -40Q59 -26 37 -20L14 -17Z','#294a42',ink,2)+
        line('M-40 30Q-10 24 7 31T52 29','#a4ad91',2,.4);
    case 'chapel':
      return ellipse(0,38,48,13,'#3f524b',.65)+
        path('M-28 33V-3L-13 -18L-2 -7L-1 32Z','#a4ad9e',ink,3)+
        path('M8 32V-22L17 -33L29 -20V34Z','#86968d',ink,3)+
        line('M-34 35H36M-20 4L-13 4M17 -13L23 -13','#c4b9a0',3)+
        path('M-7 33V14Q0 7 8 14V33Z','#20393a',ink,2.8)+
        line('M19 -33V-50M12 -43H26','#d7c6a2',2.4)+
        path('M-34 16L-22 8L-22 23L-37 29Z','#65756c',ink,1.6);
    case 'inn':
      return ellipse(0,39,63,12,'#253933',.61)+
        path('M-35 0L0 -27L35 0Z','#514541',ink,3)+
        path('M-30 0V32H30V0Z','#9c997f',ink,3)+
        pane(-24,8)+pane(12,8)+
        path('M-6 32V14Q0 5 7 14V32Z','#5d4438',ink,2.5)+
        line('M-30 6H30M-21 -1L-21 28M20 -1L20 28',timber,2.5,.7)+
        line('M34 0H49V-11',oak,2.8)+
        path('M43 -11L56 -11L53 3L45 3Z','#644b37','#d1bb8c',2)+
        lamp(-42,25)+
        path('M-35 36H35',oak,'#8d7861',1);
    case 'bridge':
      // Stream passes beneath this bridge node at (620,445).
      // The deck is oriented on the legal E-H-H-I road corridor, never a
      // free-floating disconnected bridge.
      return '<g transform="rotate(-30)">'+
        ellipse(0,4,48,25,'#24474d',.75)+
        path('M-45 2Q0 -18 45 2L45 20Q25 0 0 6Q-25 0-45 20Z',
          '#7c8f85',ink,3)+
        path('M-47 -6Q-20 -22 0 -20Q21 -21 47 -6L47 0Q22 -14 0 -12Q-19 -14-47 0Z',
          '#a5b09b',ink,2.5)+
        line('M-40 -4H40 M-40 14L-31 11 M28 10L38 14','#bcc7af',2,.8)+
        path('M-25 0L-18 -5L-11 0M8 -6L15 -10L25 -4','#59785e','none',0)+
        '</g>';
    case 'landing':
      return ellipse(0,24,57,22,'#31595b',.35)+
        line('M-46 23Q-27 16-7 23T42 21',water,3,.78)+
        path('M-31 -10L31 -10L22 0L-31 0Z','#9a7853',ink,2.4)+
        path('M-23 -9V27L-16 30V-9Z M-2 -9V25L6 28V-9Z M21 -9V24L28 26V-9Z',
          '#73573f',ink,2)+
        line('M-30 -10H30 M-23 4H23 M-23 13H23','#c5a376',2.4)+
        line('M-40 -8V17M40 -9V17',oak,4)+
        ellipse(-40,-12,5,4,'#c7ae82')+
        ellipse(40,-13,5,4,'#c7ae82')+
        path('M-15 34Q0 22 22 34L13 42L-3 42Z','#5c4b39','#182a2e',2);
    case 'barrow':
      return ellipse(0,39,57,12,'#2c483b',.6)+
        path('M-54 34Q-17 -9 9 -7Q34 -5 55 35Z','#5a6c49','#263c35',2.8)+
        path('M-35 22Q-1 2 32 22','#879472','none',0,.6)+
        stoneBlock(2,0,.85)+
        line('M-50 33L-45 23M28 29L34 17M43 34L48 23','#a7a479',2.5,.75);
    case 'stones':
      return ellipse(0,36,56,14,'#2b3d3c',.6)+
        stoneBlock(-28,9,1.1)+stoneBlock(-8,-1,1.25)+
        stoneBlock(20,3,1.35)+stoneBlock(36,19,.79)+
        stoneBlock(-3,22,.76)+
        line('M-31 33Q0 22 34 34','#b2ae8a',2,.4);
    case 'gate':
      return ellipse(0,37,61,10,'#24383b',.6)+
        // Actual opening: no closed palisade spans the passable route.
        path('M-36 34V-13L-23 -21L-14 -13V34Z','#82755b',ink,2.8)+
        path('M16 34V-13L28 -21L38 -12V34Z','#82755b',ink,2.8)+
        line('M-36 -13Q0 -38 38 -12','#b3a27b',6)+
        line('M-42 -22L-33 -37M-23 -23L-19 -38M24 -23L27 -38M39 -21L43 -35',oak,2.7)+
        path('M-37 13H-54V34H-37Z M38 13H54V34H38Z','#5b6455',ink,2)+
        line('M-12 -25H14','#c9b588',2.5);
    case 'swamp':
      return ellipse(-5,30,55,22,'#27525a',.8)+
        ellipse(26,38,38,14,'#3d7274',.62)+
        ellipse(-31,15,30,11,'#416965',.5)+
        line('M-45 21Q-30 10-11 22M7 32Q25 23 41 33','#9ba78c',2,.67)+
        path('M-27 30L-13 22L11 19L20 24L-5 36Z','#574b3b',ink,2.2)+
        reeds(-40,3,.77)+reeds(39,15,.65)+
        path('M-13 18L-4 10L2 15','#b9ab84',ink,1.5);
    case 'quarry':
      return ellipse(0,33,62,19,'#263a3b',.56)+
        path('M-52 21L-26 -5L19 -9L57 15L33 42L-31 42Z','#65756d',ink,2.7)+
        path('M-38 21L-17 2L14 1L39 18L18 31L-21 31Z','#a3a898',ink,2)+
        path('M-20 19L-7 10L15 10L21 20L5 26L-12 26Z','#5b6f68',ink,1.5)+
        line('M-52 21L-38 21L-31 42M39 18L56 15 M19 -8L15 10','#d0c4ab',2.7,.65)+
        stoneBlock(-46,35,.47)+stoneBlock(48,38,.5);
    default:return '';
  }
}

// Landscape macro-forms follow Blackfen's specific hydrology and sites,
// instead of the previous generic river cutting randomly across the board.
function blackfenLandscape(){
  const creek=waterwayPath(WATERWAYS.moor[0]);
  let art='<defs>'+
    '<linearGradient id="region-moor" x1=".05" y1="0" x2=".9" y2="1">'+
      '<stop offset="0" stop-color="#334a3d"/>'+
      '<stop offset=".48" stop-color="#314b43"/>'+
      '<stop offset="1" stop-color="#192f37"/></linearGradient>'+
    '<radialGradient id="blackfen-fog">'+
      '<stop stop-color="#d2d9b7" stop-opacity=".13"/>'+
      '<stop offset="1" stop-color="#d2d9b7" stop-opacity="0"/></radialGradient>'+
    '<linearGradient id="blackfen-water" x1="0" y1="0" x2="1" y2=".4">'+
      '<stop stop-color="#254b54"/>'+
      '<stop offset=".5" stop-color="#48767b"/>'+
      '<stop offset="1" stop-color="#284d59"/></linearGradient>'+
    '<pattern id="blackfen-stipple" width="33" height="33" patternUnits="userSpaceOnUse">'+
      '<circle cx="7" cy="9" r=".8" fill="#cbcaab" opacity=".12"/>'+
      '<circle cx="23" cy="26" r="1.15" fill="#9faf91" opacity=".13"/>'+
      '<path d="M11 27l5-3" stroke="#aec1a1" stroke-opacity=".07"/></pattern>'+
    '</defs>'+
    '<rect width="1000" height="720" fill="url(#region-moor)"/>'+
    '<path d="M0 0H650Q590 70 510 113Q390 122 336 205Q186 248 0 204Z" fill="#243f37" opacity=".5"/>'+
    '<path d="M0 508Q139 500 220 557T450 596L400 720H0Z" fill="#23443f" opacity=".75"/>'+
    '<path d="M410 580Q564 537 716 579T1010 572V722H390Z" fill="#394c3d" opacity=".48"/>'+
    '<path d="M720 11Q885 -20 1003 73L1007 207Q918 217 851 186T710 140Z" fill="#4b5542" opacity=".25"/>'+
    // Crow Farm's dry patterned fields.
    path('M259 38Q369 -11 466 42L500 140L403 216L272 184Z',
      '#506044','#334a39',2.4,.39)+
    [0,1,2,3,4,5].map(i=>
      line('M'+(278+i*26)+' 70L'+(300+i*23)+' 175','#b2ad83',1.6,.23)).join('')+
    // Barrow Hill's high ground.
    ellipse(806,129,129,71,'#67715a',.24)+
    ellipse(801,120,81,46,'#8b9270',.15)+
    // Whisper Wood and Pine Crossing coherent forest patches.
    path('M121 91Q252 52 337 184T497 280Q540 355 467 389L314 302L140 284Z',
      '#1f3a33','none',0,.28)+
    // Swamp boundary and waterlogged topography tied to site M.
    path('M0 540Q74 498 148 533Q236 551 291 627L260 720H0Z',
      '#214746','#233f40',2.2,.68)+
    ellipse(141,644,121,67,'#315b5c',.27)+
    ellipse(78,626,53,23,'#47716b',.23)+
    ellipse(226,682,68,24,'#406e6a',.25)+
    // Blackfen Run: millrace at Broken Mill, a bridge at H,
    // then a usable landing at Blackwater. One coherent watercourse.
    '<path d="'+creek+'" fill="none" stroke="#142e32" stroke-width="46" opacity=".82" stroke-linejoin="round"/>'+
    '<path d="'+creek+'" fill="none" stroke="url(#blackfen-water)" stroke-width="28" opacity=".94" stroke-linejoin="round"/>'+
    '<path d="'+creek+'" fill="none" stroke="#80aaa2" stroke-width="2" stroke-dasharray="6 25" opacity=".47"/>'+
    '<g class="blackfen-creek-banks" stroke="#a1a27c" stroke-width="2" fill="none" opacity=".29">'+
       '<path d="M188 561Q198 531 225 514"/>'+
       '<path d="M386 538Q461 534 543 496"/>'+
       '<path d="M711 378Q773 344 827 356"/>'+
    '</g>';
  // Intentional secondary details: no randomly painted landmark at a different node.
  for(const [x,y,r] of [
    [68,112,.76],[127,117,.89],[172,104,.6],[291,73,.7],
    [83,267,.68],[289,294,.55],[358,266,.62],[458,260,.78],
    [506,311,.65],[558,96,.7],[678,88,.57],[886,156,.71],
    [908,581,.83],[963,631,.65]
  ])art+=pineTree(x,y,r);
  for(const [x,y,s] of [[44,603,.78],[84,655,.83],[118,579,.66],
    [233,621,.72],[264,697,.61],[336,701,.66],[744,493,.65],[924,670,.75]])
    art+=reeds(x,y,s);
  // Worn parcel boundaries; these don't create new playable roads.
  art+=line('M278 218Q341 228 405 234M284 214L286 226M341 221L345 234M402 228L404 241',
    '#b4a37c',2.2,.33);
  art+=ellipse(346,276,115,73,'url(#blackfen-fog)',.62)+
    ellipse(174,613,210,105,'url(#blackfen-fog)',.48)+
    '<rect width="1000" height="720" fill="url(#blackfen-stipple)" opacity=".46"/>';
  return art;
}

export function renderBlackfenScenery(){
  const landmarks=BLACKFEN_SITES.map(s=>{
    const glyph=landmarkArt(s.kind);
    if(!glyph)throw new Error('Missing Blackfen landmark artwork '+s.id);
    return '<g class="blackfen-landmark blackfen-landmark-'+s.kind+
      '" data-landmark-id="'+s.id+'" data-landmark-kind="'+s.kind+
      '" transform="translate('+(s.x+s.artDx)+' '+(s.y+s.artDy)+')">'+
      '<title>'+s.name.replaceAll('&','&amp;').replaceAll("'","&apos;")+'</title>'+
      glyph+'</g>';
  }).join('');
  return '<g class="illustrated-scenery theme-scene-moor blackfen-world" aria-hidden="true">'+
    blackfenLandscape()+
    '<g class="blackfen-landmarks">'+landmarks+'</g>'+
    '<rect x="10" y="10" width="980" height="700" rx="7" '+
      'fill="none" stroke="#a5ad87" stroke-opacity=".14" stroke-width="14"/>'+
    '</g>';
}
