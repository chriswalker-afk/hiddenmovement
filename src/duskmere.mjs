import { WATERWAYS, waterwayPath } from './waterways.mjs';

/**
 * Duskmere Village: eighteen distinct landmarks on the unchanged 18-node
 * apprentice bearings graph. The site roster controls labels and original
 * artwork together; fixed map coordinates are verified against makeRegion()
 * by the regression suite and during map construction.
 */
const SITES=[
  ['A01','North Coppice',215.9,95,'coppice',-25,63,'northwest woodland'],
  ['A02','Bell Chapel',457.7,95,'bell-chapel',20,64,'north ridge'],
  ['A03','North Gate',699.5,95,'north-gate',20,62,'north road boundary'],
  ['A04',"Shepherd's Fold",179.6,231.3,'fold',-8,62,'northwest pasture'],
  ['A05','Crooked Inn',421.4,231.3,'inn',1,65,'upper village'],
  ['A06',"Baker's Row",663.2,231.3,'bakers',0,63,'northeast houses'],
  ['A07','Dovecote Hill',905,231.3,'dovecote',-63,61,'eastern ridge'],
  ['A08','West Watch',95,367.5,'watch',-45,60,'west entrance'],
  ['A09','Market Cross',336.8,367.5,'market',-20,64,'west centre'],
  ['A10','Village Green',578.6,367.5,'green',0,66,'central common'],
  ['A11','Old Well',820.4,367.5,'well',-4,66,'east centre'],
  ['A12','Mill Stream',179.6,503.8,'stream',32,43,'southwest stream bank'],
  ['A13','Stone Bridge',421.4,503.8,'stone-bridge',17,62,'southern central crossing'],
  ['A14','Mill Pond',663.2,503.8,'pond',93,49,'southeast millpond'],
  ['A15','Willow Bank',905,503.8,'willow',-45,43,'eastern stream bank'],
  ['A16','Apple Orchard',215.9,640,'orchard',75,44,'southwest outskirts'],
  ['A17','Smithy Yard',457.7,640,'smithy',74,44,'southern workshops'],
  ['A18','South Beacon',699.5,640,'beacon',70,44,'south road']
];
export const DUSKMERE_SITES=Object.freeze(SITES.map(([id,name,x,y,kind,artDx,artDy,zone])=>
  Object.freeze({id,name,x,y,kind,artDx,artDy,zone})));
export const DUSKMERE_LANDMARKS=Object.freeze(
  Object.fromEntries(DUSKMERE_SITES.map(site=>[site.id,site])));

const INK='#17292f',STONE='#a0a79c',MORTAR='#54615e',
  ROOF='#465456',BRICK='#9b8e77',OAK='#9a7957',
  GOLD='#f1c77c',GREEN='#527052',WATER='#547e78',
  SHADOW='#1d3438';

const p=(d,fill,stroke=INK,sw=2.4,opacity=1)=>
  '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+
  '" stroke-linejoin="round" stroke-linecap="round" opacity="'+opacity+'"/>';
const line=(d,color=OAK,sw=2,opacity=1)=>
  '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+sw+
  '" stroke-linecap="round" stroke-linejoin="round" opacity="'+opacity+'"/>';
const oval=(x,y,rx,ry,fill,opacity=1)=>
  '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+
  '" fill="'+fill+'" opacity="'+opacity+'"/>';
const circle=(x,y,r,fill,stroke=INK,sw=2)=>
  '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+
  '" stroke="'+stroke+'" stroke-width="'+sw+'"/>';

function window(x,y){
  return '<rect x="'+x+'" y="'+y+'" width="9" height="12" fill="'+GOLD+
    '" stroke="'+INK+'" stroke-width="1.7" rx="1"/>'+
    line('M'+(x+4.5)+' '+y+'v12M'+x+' '+(y+6)+'h9',OAK,1.2);
}
function house(w=40,h=31,facade=STONE){
  return p('M'+(-w/2)+' 0L0 -23L'+(w/2)+' 0Z',ROOF,INK,2.8)+
    p('M'+(-w/2+3)+' 0V'+h+'H'+(w/2-3)+'V0Z',facade,INK,2.6)+
    line('M'+(-w/2+3)+' 9H'+(w/2-3),MORTAR,1.8,.65);
}
function shingle(d,opacity=.65){return line(d,'#c3b79c',1.4,opacity);}
function lantern(x,y){
  return '<g transform="translate('+x+' '+y+')">'+
    line('M0 11V-20','#444a3d',2.7)+
    p('M-6 -21L6 -21L4 -31L-5 -31Z',GOLD,'#554539',2)+
    p('M-9 -32L0 -38L9 -32Z',ROOF,INK,1.6)+
    oval(0,-23,15,17,GOLD,.10)+'</g>';
}
function tree(x,y,scale=1,shade=GREEN){
  return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+
    line('M0 8V33M0 19L-14 8M0 12L16 -3','#7d6448',4)+
    p('M-30 7Q-45 -6-27 -19Q-26 -39-8 -35Q1 -47 18 -29Q43 -26 37 -6Q51 10 25 16Q9 26 -9 16Q-32 22-30 7Z',
      shade,INK,2.5)+
    line('M-20 -18Q0 -31 22 -16M-12 0L10 -12','#8d9c7b',1.8,.52)+
    '</g>';
}
function hedge(x,y,w=45){return line('M'+(x-w/2)+' '+y+'q'+w/2+' -14 '+w+' 0','#77906d',6,.64);}
function reeds(x,y,scale=1){
  return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+
    line('M-10 8Q-17 -9-14 -26M0 11Q-3 -6 4 -30M12 10Q9 -4 15 -24','#83a58c',2.3)+
    line('M-14 -26l-1 -7M4 -30l1 -7M15 -24l1 -6','#d3b985',3.6)+
    '</g>';
}
function stone(x,y){
  return '<g transform="translate('+x+' '+y+')">'+
    p('M-12 14L-10 -15L-3 -21L10 -15L13 14Z','#89978d',INK,2.5)+
    line('M-8 -8l6 -5M5 -10l4 5','#d5c7ab',1.4,.65)+'</g>';
}

function landmark(kind){
  switch(kind){
    case 'coppice':
      return oval(0,29,63,13,'#324a3e',.55)+
        [-32,-3,29].map((x,i)=>
          line('M'+x+' 27Q'+(x-9+i*4)+' 3 '+(x+2)+' -41 M'+(x-5)+' 3l-18 -18 M'+(x-3)+' -17l12 -18',
            '#968165',3.7,.9)+
          oval(x,-22,21,17,i===1?'#426345':'#375449',.77)).join('')+
        line('M-51 32Q0 20 52 32','#b9ab80',2,.7);
    case 'bell-chapel':
      return oval(0,35,55,14,'#334b43',.65)+
        house(54,33,'#b8b9a9')+
        p('M-6 -11V-34L7 -48L19 -33V20H-6Z','#adb5a7',INK,2.8)+
        p('M-10 -33L7 -53L23 -33Z',ROOF,INK,2.2)+
        p('M1 -27Q7 -34 13 -27V-16H1Z','#324547',INK,1.7)+
        circle(7,-21,4,GOLD,'#634c38',1.3)+
        line('M7 -54V-64M0 -59H14','#dfc998',2.3)+
        p('M-4 33V14Q4 5 11 14V33Z','#50605b',INK,1.5)+
        window(-23,9);
    case 'north-gate':
      return oval(0,39,59,13,'#344643',.58)+
        p('M-46 35V-14L-34 -26L-19 -17V35Z','#98a19b',INK,2.9)+
        p('M20 35V-17L34 -26L46 -14V35Z','#98a19b',INK,2.9)+
        // A real passable opening on the established road; not a sealed wall.
        p('M-22 -17Q0 -38 22 -17V-7Q0 -25-22 -7Z','#aeb4a5',INK,2.5)+
        line('M-48 -18H-23M23 -18H48M-50 4H-28M29 4H50',MORTAR,2.3)+
        line('M-37 -27V-39M-24 -27V-39M25 -27V-39M39 -27V-39',OAK,2)+
        p('M-10 35V7Q0 -5 10 7V35Z','#2d4647',INK,2);
    case 'fold':
      return oval(0,31,65,14,'#446046',.59)+
        line('M-59 11L-44 -5H45L60 8V32H-60Z',OAK,3.4)+
        [-39,-14,14,39].map(x=>line('M'+x+' -4v38','#d4b68a',2.5)).join('')+
        [ [-24,12], [9,18], [35,8] ].map(([x,y])=>
          oval(x,y,12,8,'#ded7b6')+circle(x+10,y-2,5,'#b2a788',INK,1.5)+
          line('M'+(x-5)+' '+(y+8)+'v7M'+(x+7)+' '+(y+8)+'v6',INK,1.7)).join('')+
        line('M-61 30H60','#827357',2.4);
    case 'inn':
      return oval(0,42,64,13,'#2b4140',.65)+
        '<g transform="rotate(-6 0 0)">'+
        house(61,37,'#a8a18a')+
        p('M-34 0L-3 -34L30 0Z','#514c4a',INK,2.9)+
        line('M-25 2L-24 35M21 2L22 35M-27 15L27 15',OAK,3.2)+
        window(-19,6)+window(11,6)+
        p('M-6 37V19Q0 10 7 19V37Z','#574736',INK,2)+
        '</g>'+
        line('M35 -9H50V-18',OAK,2.8)+
        p('M43 -19L59 -19L55 -3L45 -3Z','#6e5946','#cab28e',2)+
        lantern(-42,27)+shingle('M-34 1L-2 -26L27 1');
    case 'bakers':
      return oval(0,37,71,14,'#374742',.58)+
        '<g transform="translate(-34 5) scale(.76)">'+house(41,34,'#b2ad93')+
          window(-14,10)+'</g>'+
        '<g transform="translate(7 -4)">'+house(43,33,'#b1a68b')+window(8,7)+
          p('M-4 33V13H6V33Z','#51433b',INK,1.6)+'</g>'+
        '<g transform="translate(45 7) scale(.7)">'+house(32,31,'#9e9882')+'</g>'+
        line('M-1 -14V-38','#544b43',5)+
        oval(5,-48,9,13,'#bbc7b4',.22)+
        oval(17,-56,13,9,'#bbc7b4',.14)+
        p('M-43 29Q-39 15-24 24L-22 35H-42Z','#655348',INK,1.7);
    case 'dovecote':
      return oval(0,39,64,16,'#3d5747',.69)+
        p('M-54 33Q-30 3 1 7Q33 0 56 33Z','#627851',INK,2.3)+
        p('M-19 28V-8Q-14 -19-6 -20L7 -20Q20 -11 19 28Z',
          '#a4aa9e',INK,2.7)+
        p('M-23 -7L0 -29L24 -7Z',ROOF,INK,2.6)+
        [-11,0,11].map(x=>circle(x,2,3.1,'#3b4e4c',INK,1.2)).join('')+
        [-6,8].map(x=>circle(x,14,3.1,'#3b4e4c',INK,1.2)).join('')+
        line('M-42 34L40 33','#c8bc95',2.2,.7);
    case 'watch':
      return oval(0,36,52,12,'#253f3d',.55)+
        p('M-24 34V-19L0 -29L24 -19V34Z','#6e7666',INK,2.6)+
        p('M-31 -19L0 -43L32 -19Z',ROOF,INK,2.8)+
        line('M-20 -10L19 29M19 -10L-20 29',OAK,3.1,.82)+
        p('M-8 34V15Q0 5 8 15V34Z',SHADOW,INK,2)+
        lantern(29,8);
    case 'market':
      return oval(0,33,64,15,'#6a7364',.38)+
        circle(0,30,11,'#a4a08a',INK,2)+
        p('M-7 22L-4 -21L4 -21L7 22Z','#b9b5a1',INK,2.6)+
        line('M0 -23V-43M-11 -33H11','#d6c4a0',3)+
        p('M-50 10L-35 -5L-20 10Z','#7a594e',INK,1.7)+
        p('M20 10L35 -5L50 10Z','#6e594a',INK,1.7)+
        line('M-52 12H-18M18 12H52','#c4ae87',2.8)+
        [-48,-32,32,47].map(x=>line('M'+x+' 13v18',OAK,2.2)).join('')+
        line('M-48 31Q0 40 48 31','#c2b79a',2,.63);
    case 'green':
      return oval(0,33,66,18,'#647d57',.65)+
        line('M-5 37V-7M-5 7L-20 -15M-3 -3L20 -21',OAK,6)+
        p('M-43 -5Q-50 -24-31 -38Q-17 -53 0 -42Q18 -54 38 -36Q56 -24 45 -7Q39 13 18 12Q-12 20-31 9Z',
          '#496e4f',INK,3)+
        line('M-29 -25Q0 -46 31 -25M-25 0Q0 -12 29 1','#9cad78',2,.58)+
        p('M-62 32Q0 14 62 32', 'none','#b4a37d',1.7)+
        circle(42,26,3.5,GOLD,'#805f45',1);
    case 'well':
      return oval(0,38,51,13,'#3d554e',.51)+
        p('M-22 13L-16 30Q0 39 17 30L23 13Z','#83928c',INK,2.6)+
        oval(0,12,24,10,'#b7bba8')+
        oval(0,10,17,6,'#23434d')+
        line('M-25 11V-28M25 11V-28',OAK,3.1)+
        p('M-32 -28L0 -49L32 -28Z',ROOF,INK,2.8)+
        circle(28,-6,6,'#a4aa94',INK,2)+
        line('M27 -6L38 -15M0 -26V5','#d4bc92',2);
    case 'stream':
      return oval(0,18,55,18,'#426e6f',.22)+
        line('M-49 15Q-23 0 0 15T50 14','#9fc0aa',2.4,.74)+
        reeds(-39,-1,.8)+reeds(27,1,.93)+
        p('M-10 12L3 4L21 8L8 21Z','#8d8266',INK,1.7)+
        line('M-17 28L-7 25M21 26L34 21','#bfb68a',1.8,.55);
    case 'stone-bridge':
      // The central A13–A17 legal road crosses the painted millstream at
      // (438,566). Its bearing is ~015° east of south (SVG rotation -15°).
      return '<g transform="rotate(-15)">'+
        oval(0,0,34,46,SHADOW,.78)+
        p('M-20 -40L20 -40L21 40L-20 40Z','#939f95',INK,2.6)+
        p('M-11 -39L12 -39L12 39L-11 39Z','#b8bdac',INK,1.5)+
        line('M-26 -41V41M26 -41V41','#c7c9b6',5)+
        line('M-8 -21H9M-8 1H9M-8 22H9',MORTAR,2.2,.75)+
        line('M-24 -37H-17M18 -37H25M-24 36H-17M18 36H25',OAK,2)+
        '</g>';
    case 'pond':
      return oval(0,22,67,25,'#345f64',.28)+
        // Stone sluice and mill outbuilding occupy the *north bank* of the
        // deliberately connected millpond, not an arbitrary dry field.
        '<g transform="translate(7 -12) scale(.72)">'+house(40,30,'#a3a696')+
        window(-17,9)+'</g>'+
        circle(-27,9,14,'none','#9f805d',3)+
        circle(-27,9,4,'#ac9369',INK,1.6)+
        line('M-27 -4V-2M-40 9H-36M-27 22V20M-14 9H-18',OAK,3)+
        p('M-56 25L-33 20L-13 27L-35 35Z','#98a29b',INK,2)+
        line('M-48 10V31M-4 15L-1 35','#b2baa3',2)+
        reeds(49,21,.7);
    case 'willow':
      return oval(0,31,61,18,'#294844',.5)+
        line('M0 35V-24M-2 -12L-26 -35M0 -5L29 -34',OAK,6)+
        p('M-42 -17Q-43 -43-20 -48Q-6 -62 12 -46Q39 -52 47 -28Q55 -4 28 6Q0 13-27 5Z',
          '#4a7056',INK,2.8)+
        [-40,-25,-8,8,27,42].map((x,i)=>
          line('M'+x+' '+(i%2?-25:-15)+'Q'+(x+5)+' 7 '+(x-3)+' 34','#81a487',2.7,.78)).join('')+
        line('M-48 36Q0 26 48 36','#a4ba9a',2,.72);
    case 'orchard':
      return oval(0,21,66,14,'#3c5b43',.5)+
        [-35,0,35].map((x,i)=>'<g transform="translate('+x+' '+(i%2*5)+') scale(.7)">'+
          tree(0,-1,1,'#54774a')+
          circle(-13,-8,4,'#a35f4a','#684b39',1)+
          circle(14,-15,3.7,'#b68250','#684b39',1)+
          circle(5,6,3,'#a86648','#684b39',1)+'</g>').join('')+
        line('M-61 29H60M-60 21v15M-20 25v11M21 24v11M59 22v14',OAK,2.1,.8);
    case 'smithy':
      return oval(0,26,61,14,'#354441',.62)+
        house(52,30,'#867b69')+
        p('M15 -12V-42H27V-12Z','#726b60',INK,2.2)+
        oval(28,-51,10,13,'#bfc2b0',.2)+
        oval(39,-65,14,8,'#bfc2b0',.12)+
        p('M-15 30L-7 12L4 12L11 30Z','#433a34',INK,2)+
        p('M-11 13L0 6L7 15L4 25L-10 26Z','#d49759','#a66843',1)+
        p('M31 31L40 22L53 23L59 30L52 34H31Z','#74817a',INK,2)+
        line('M38 17V33M25 12H49','#b8b2a0',2.6);
    case 'beacon':
      return oval(0,32,58,14,'#3a4d45',.58)+
        p('M-16 30L-12 -19L12 -19L16 30Z','#959f92',INK,3)+
        p('M-21 -20L0 -31L21 -20Z','#53605b',INK,2.5)+
        p('M-7 -31Q-21 -46-7 -55Q-8 -68 1 -71Q14 -61 8 -51Q17 -43 7 -31Z',
          '#e7aa61','#a06e4b',1.5)+
        p('M-3 -31Q-9 -45 3 -56Q10 -44 5 -31Z','#f4d98b','none',0)+
        line('M-24 33H24M-19 11H19',OAK,2.5)+
        lantern(-32,23);
    default: throw new Error('Missing Duskmere artwork for '+kind);
  }
}

/**
 * Southern watercourse. Its geometry is from WATERWAYS.woodland, shared
 * with bridge detection and node-bank clearance tests. A dammed expansion
 * near A14 forms the pond while leaving the real A14-A18 road on the west.
 */
function villageLandscape(){
  const channel=WATERWAYS.woodland?.[0];
  if(!channel||channel.id!=='duskmere-millstream')throw new Error('Missing Duskmere millstream');
  const stream=waterwayPath(channel);
  let scene='<defs>'+
    '<linearGradient id="region-woodland" x1=".05" y1="0" x2=".95" y2="1">'+
      '<stop stop-color="#4b564d"/><stop offset=".48" stop-color="#3a5150"/>'+
      '<stop offset="1" stop-color="#283e43"/></linearGradient>'+
    '<linearGradient id="duskmere-water" x1="0" y1="0" x2="1" y2=".45">'+
      '<stop stop-color="#31535b"/><stop offset=".55" stop-color="#5c8a81"/>'+
      '<stop offset="1" stop-color="#3b6468"/></linearGradient>'+
    '<radialGradient id="duskmere-lantern-glow">'+
      '<stop stop-color="#f0c47a" stop-opacity=".23"/>'+
      '<stop offset="1" stop-color="#f0c47a" stop-opacity="0"/></radialGradient>'+
    '<pattern id="duskmere-grain" width="32" height="32" patternUnits="userSpaceOnUse">'+
      '<circle cx="7" cy="11" r="1.2" fill="#c9c7ac" opacity=".12"/>'+
      '<circle cx="23" cy="26" r=".8" fill="#93b09b" opacity=".14"/></pattern>'+
    '</defs>'+
    '<rect width="1000" height="720" fill="url(#region-woodland)"/>'+
    // Three coherent village landscape zones.
    p('M0 0H1000V210Q900 237 800 189Q629 155 521 204Q360 175 230 221Q110 252 0 201Z',
      '#50634d','none',0,.34)+
    p('M0 261Q180 235 300 282Q425 318 539 261Q747 221 1000 293V513H0Z',
      '#68705a','none',0,.23)+
    p('M0 477Q280 467 416 480T1000 468V720H0Z',
      '#314b44','none',0,.41)+
    // Market Cross and Village Green: surface materials, not fake roads.
    oval(337,390,99,57,'#b1aea0',.14)+
    oval(577,398,123,78,'#637e58',.35)+
    oval(577,407,94,52,'#92a079',.12)+
    [0,1,2,3,4].map(i=>line('M265 '+(365+i*12)+'Q330 '+(374+i*10)+' 404 '+(364+i*11),
      '#c0b7a0',1.4,.24)).join('')+
    // North woods, apple farmland and gently sloped dovecote ridge.
    p('M10 35Q159 -8 298 35L297 172Q188 207 30 187Z','#27463e','none',0,.31)+
    oval(895,254,129,64,'#718266',.21)+
    oval(214,659,131,59,'#66845b',.16)+
    // Original stream, dark banks then a continuous shallow watercourse.
    '<path d="'+stream+'" fill="none" stroke="#182f35" stroke-width="40" stroke-opacity=".81" stroke-linejoin="round"/>'+
    '<path d="'+stream+'" fill="none" stroke="url(#duskmere-water)" stroke-width="24" stroke-opacity=".97" stroke-linejoin="round"/>'+
    '<path d="'+stream+'" fill="none" stroke="#a3c6ad" stroke-width="2.3" stroke-opacity=".43" stroke-dasharray="7 25"/>'+
    // Connected pond east of the A14-A18 crossing, not over that road.
    oval(772,571,74,38,'#1a393b',.66)+
    oval(772,571,66,30,'url(#duskmere-water)',.98)+
    line('M713 558Q750 530 813 552','#95a891',3.2,.53)+
    line('M720 585Q768 604 814 583','#b9baa0',2.2,.5)+
    // Stone-topped sluice between the millrace and water's eastern pond.
    p('M707 551L719 547L722 576L711 581Z','#aeb6a4',INK,2.1)+
    line('M715 542V587','#d2c6a5',1.7,.8);
  // Small supporting features placed by geographic purpose.
  for(const [x,y,s] of [[74,104,.61],[102,142,.54],[310,66,.66],
    [837,123,.64],[945,152,.57],[63,202,.62],[939,347,.48]])
    scene+=tree(x,y,s,'#36584b');
  for(const [x,y,s] of [[92,550,.65],[152,580,.67],[294,582,.74],
    [357,564,.72],[616,581,.69],[823,602,.76],[949,584,.79]])
    scene+=reeds(x,y,s);
  for(const [x,y,w] of [[275,276,57],[720,278,71],[112,443,66],[921,432,46]])
    scene+=hedge(x,y,w);
  // Irregular parcel walls below actual navigation lines.
  scene+=line('M75 316Q185 309 259 314M749 205Q831 193 936 212',
      '#ada58b',2,.25)+
    line('M53 624Q123 610 173 630M274 659Q373 653 414 670',
      '#bea888',2,.23);
  // Lantern pools suggest a lived-in village at dusk, not an abandoned marsh.
  for(const [x,y,r] of [[419,280,68],[662,293,58],[333,423,58],[804,428,43]])
    scene+=oval(x,y,r,56,'url(#duskmere-lantern-glow)',.45);
  scene+='<rect width="1000" height="720" fill="url(#duskmere-grain)" opacity=".42"/>';
  return scene;
}

export function renderDuskmereScenery(){
  const landmarks=DUSKMERE_SITES.map(site=>
    '<g class="duskmere-landmark duskmere-landmark-'+site.kind+'" '+
      'data-landmark-id="'+site.id+'" data-landmark-kind="'+site.kind+'" '+
      'transform="translate('+(site.x+site.artDx)+' '+(site.y+site.artDy)+')">'+
      '<title>'+site.name.replaceAll('&','&amp;').replaceAll("'","&apos;")+'</title>'+
      landmark(site.kind)+'</g>'
  ).join('');
  return '<g class="illustrated-scenery theme-scene-woodland" '+
      'data-world="duskmere" aria-hidden="true" clip-path="url(#duskmere-scene-clip)">'+
      '<defs><clipPath id="duskmere-scene-clip"><rect width="1000" height="720"/></clipPath></defs>'+
      villageLandscape()+
      '<g class="duskmere-landmarks">'+landmarks+'</g>'+
      '<rect x="10" y="10" width="980" height="700" rx="7" fill="none" '+
        'stroke="#b5bb96" stroke-opacity=".14" stroke-width="13"/>'+
    '</g>';
}
