import { WATERWAYS, waterwayPath } from './waterways.mjs';

/**
 * Ravenmarch County: the 36-place Expert map, with one coherent regional
 * landscape and thirty-six recognisable original dark-fantasy SVG landmarks.
 * All site IDs and coordinates match the existing untouched bearings graph.
 * This is public scenery: it does not inspect or reveal Monster state.
 */
const SITES=[
  ['E01','North Watch',222.6,95,'north-watch',-22,48,'northwest highlands'],
  ['E02','Raven Pass',350.1,95,'raven-pass',0,51,'north mountain route'],
  ['E03','Crown Ridge',477.7,95,'crown-ridge',1,53,'northern peaks'],
  ['E04','Frostmere',605.2,95,'frostmere',9,52,'northeast uplands'],
  ['E05','Highland Cairn',732.8,95,'highland-cairn',5,52,'highland route'],
  ['E06',"Widow's Wood",203.4,204,'widows-wood',-15,55,'northern woodland'],
  ['E07','Ashen Hamlet',331,204,'ashen-hamlet',10,56,'abandoned settlement'],
  ['E08',"Pilgrim's Rest",458.5,204,'pilgrims-rest',9,56,'northern road'],
  ['E09','Mourn Abbey',586.1,204,'mourn-abbey',5,54,'north central valley'],
  ['E10','Stone Quarry',713.7,204,'stone-quarry',8,54,'rocky foothills'],
  ['E11','Raven Keep',841.2,204,'raven-keep',2,52,'eastern highlands'],
  ['E12','West Ranger Post',95,313,'ranger-post',-37,47,'western county entry'],
  ['E13',"King's Milepost",222.6,313,'milepost',14,48,'ancient road'],
  ['E14','Wolf Hollow',350.1,313,'wolf-hollow',10,48,'western valley'],
  ['E15','Fallen Observatory',477.7,313,'observatory',12,47,'central escarpment'],
  ['E16','Heather Moor',605.2,313,'heather-moor',4,48,'east central upland'],
  ['E17','Iron Mine',732.8,313,'iron-mine',12,48,'eastern upland'],
  ['E18','East Watch',860.3,313,'east-watch',8,48,'eastern heights'],
  ['E19','Barrow Field',139.7,410,'barrow-field',7,31,'river valley fields'],
  ['E20','Foxglove Farm',267.2,410,'foxglove-farm',8,23,'north river farmland'],
  ['E21','Blackwater Bridge',394.8,410,'blackwater-bridge',9,66,'Blackwater crossing'],
  ['E22','Greywater Mill',522.3,410,'greywater-mill',9,35,'millrace and river'],
  ['E23','Old Battlefield',649.9,410,'battlefield',8,26,'central plain'],
  ['E24','Stormwatch Tower',777.4,410,'stormwatch',7,34,'eastern ridge'],
  ['E25','Eastwood Copse',905,410,'eastwood',-35,34,'eastern woods'],
  ['E26','Lowland Farm',158.8,549,'lowland-farm',12,48,'southwest floodplain'],
  ['E27','Reedmere Marsh',286.3,549,'reedmere',5,-30,'wet south bank'],
  ['E28','Blackwater Bank',413.9,549,'blackwater-bank',5,-30,'southern bridgehead'],
  ['E29','Pilgrim Shrine',541.5,549,'pilgrim-shrine',56,43,'south river road'],
  ['E30','Weeping Willow',669,549,'weeping-willow',7,-34,'river oxbow'],
  ['E31','Hollow Mere',796.6,549,'hollow-mere',68,36,'eastern lowland lake'],
  ['E32','South Orchard',267.2,640,'south-orchard',1,43,'southern farmland'],
  ['E33','Salt Road',394.8,640,'salt-road',10,42,'southern trade road'],
  ['E34','Stone Circle',522.3,640,'stone-circle',6,43,'frontier heath'],
  ['E35','Border Watch',649.9,640,'border-watch',10,42,'southern border'],
  ['E36','Frontier Gate',777.4,640,'frontier-gate',8,42,'far southeast exit']
];
export const RAVENMARCH_SITES=Object.freeze(SITES.map(
  ([id,name,x,y,kind,artDx,artDy,zone])=>
    Object.freeze({id,name,x,y,kind,artDx,artDy,zone})
));
export const RAVENMARCH_LANDMARKS=Object.freeze(
  Object.fromEntries(RAVENMARCH_SITES.map(site=>[site.id,site]))
);

const INK='#182832',ROCK='#829494',SNOW='#c2c6b6',
  FOREST='#36574a',PINE='#28473f',DARK='#273c40',
  STONE='#a3a99b',MOSS='#81967a',WOOD='#987c5c',
  GOLD='#ebc885',PLUM='#806981',WATER='#537b80',
  OCHRE='#998b69',ROOF='#4a5658',PALE='#c9c3a8';

function path(d,fill,stroke=INK,sw=2.4,opacity=1){
  return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+
    '" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+opacity+'"/>';
}
function line(d,color=WOOD,sw=2.2,opacity=1){
  return '<path d="'+d+'" fill="none" stroke="'+color+
    '" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+opacity+'"/>';
}
function oval(x,y,rx,ry,color,opacity=1){
  return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+
    '" fill="'+color+'" opacity="'+opacity+'"/>';
}
function rect(x,y,w,h,color,stroke=INK,sw=2){
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+
    '" fill="'+color+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
}
function circle(x,y,r,color,stroke=INK,sw=1.8){
  return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+
    '" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
}
function tree(x,y,s=1,shade=PINE){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    line('M0 11V30',WOOD,3.5)+
    path('M0 -37L-18 -11H-10L-23 8H-13L-27 22H27L13 8H23L10 -11H18Z',
      shade,INK,2.1)+
    line('M-9 -13L0 -28L10 -12M-16 9L0 -5L16 9','#9caf92',1.6,.5)+
    '</g>';
}
function deciduous(x,y,s=1,shade=FOREST){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    line('M0 13V33M0 8L-13 -9M0 -1L15 -14',WOOD,4)+
    path('M-30 -8Q-38 -27-20 -34Q-9 -52 6 -40Q26 -48 35 -28Q47 -15 30 -2Q22 15 4 10Q-15 20-30 -8Z',
      shade,INK,2.3)+
    line('M-24 -15Q0 -37 20 -15','#a0b08f',1.7,.52)+'</g>';
}
function rock(x,y,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    path('M-19 15L-13 -14L1 -25L18 -11L25 15Z',ROCK,INK,2.4)+
    path('M-13 -13L1 -25L4 -11L-1 15Z','#aab1a8','none',0,.36)+
    line('M7 -11L14 -5M-6 1L-10 11',PALE,1.4,.61)+'</g>';
}
function hut(w=45,h=30,tint=STONE){
  return path('M'+(-w/2)+' 0L0 -23L'+(w/2)+' 0Z',ROOF,INK,2.8)+
    rect(-w/2+4,0,w-8,h,tint,INK,2.6)+
    line('M'+(-w/2+4)+' 12H'+(w/2-4),WOOD,2,.58);
}
function door(x=-7,y=11,w=14,h=19){
  return path('M'+x+' '+(y+h)+'V'+(y+7)+
    'Q'+(x+w/2)+' '+y+' '+(x+w)+' '+(y+7)+
    'V'+(y+h)+'Z',DARK,INK,2);
}
function window(x,y){
  return rect(x,y,8,11,GOLD,INK,1.5)+
    line('M'+(x+4)+' '+y+'V'+(y+11)+'M'+x+' '+(y+6)+'h8',WOOD,1.1,.8);
}
function beacon(x=0,y=-43){
  return '<g transform="translate('+x+' '+y+')">'+
    path('M-7 1Q-21 -9-9 -23Q-10 -34 0 -40Q15 -25 9 -16Q19 -5 7 1Z',
      '#e5a66c','#815746',1.4)+
    path('M-4 0Q-9 -15 2 -25Q9 -15 4 0Z','#f2d39b','none',0)+
    line('M-13 4H13','#c8bb96',2.8)+'</g>';
}
function reeds(x,y,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    line('M-12 12Q-19 -4-17 -28M0 14Q-2 -12 4 -32M13 12Q10 -10 19 -26',MOSS,2.6)+
    line('M-17 -27v-7M4 -32v-7M19 -26l3 -7',OCHRE,3.8,.9)+'</g>';
}
function standingStone(x=0,y=0,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    path('M-12 19L-10 -21L0 -29L12 -20L15 19Z','#82918b',INK,2.4)+
    line('M-6 -13L0 -19L4 -9M4 5L9 10',PALE,1.5,.7)+'</g>';
}
function hill(rx=58,ry=17,tint=FOREST){
  return oval(0,32,rx,ry,tint,.49);
}
function palisade(){
  return [-49,-39,-29,30,40,50].map(x=>
    line('M'+x+' 35V-3','#9d8f70',4.5)+
    path('M'+(x-3)+' -3L'+x+' -12L'+(x+3)+' -3Z','#baa982',INK,1.2)).join('')+
    line('M-55 19H-23M25 19H56',WOOD,3.2);
}
function watchTower(height=53){
  return hill(49,11,DARK)+
    path('M-20 33L-18 '+(-height/2)+'H19L21 33Z',STONE,INK,2.6)+
    path('M-25 '+(-height/2)+'L0 '+(-height/2-18)+'L25 '+(-height/2)+'Z',
      ROOF,INK,2.7)+
    window(-4,-height/2+6)+door(-6,14,12,19)+
    line('M-18 7H18',PALE,2.4,.5);
}
function crest(){
  return path('M-38 25L-26 -12L-5 5L12 -33L33 -4L49 26Z',ROCK,INK,2.7)+
    path('M-26 -12L-13 4L-24 0Z M12 -33L24 -12L13 -17Z',SNOW,'none',0,.84)+
    line('M-38 25Q0 19 49 26','#9dac9b',2,.62);
}
function graveMound(x=0,y=0,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    path('M-25 18Q-5 -15 18 -8Q28 -3 29 18Z','#77846c',INK,2.2)+
    line('M0 -6V-20M-8 -14H8',STONE,2.8)+'</g>';
}
function gate(large=false){
  const half=large?37:30;
  return hill(65,13,DARK)+
    path('M'+(-half)+' 35V-19L'+(-half+12)+' -30L'+(-half+24)+' -20V35Z',
      STONE,INK,2.7)+
    path('M'+(half-24)+' 35V-20L'+(half-12)+' -30L'+half+' -19V35Z',
      STONE,INK,2.7)+
    path('M-19 -17Q0 -43 19 -17V-7Q0 -31-19 -7Z','#b0b8aa',INK,2.5)+
    path('M-13 35V-10Q0 -28 13 -10V35Z',DARK,INK,1.8)+
    palisade()+
    (large?beacon(0,-35):'');
}
function lake(rx=50,ry=19){
  return hill(rx+9,ry+6,'#435e57')+
    oval(0,22,rx,ry,'#37636b',.91)+
    oval(-7,16,rx*.73,ry*.54,'#70989a',.28)+
    line('M'+(-rx+10)+' 27Q0 18 '+(rx-7)+' 29','#c1ccb1',1.8,.58);
}

function landmark(kind){
  switch(kind){
    case 'north-watch':
      return watchTower(58)+beacon(0,-49)+
        line('M-34 34H34',PALE,2.1,.6);
    case 'raven-pass':
      return hill(61,20,'#52645a')+
        path('M-55 27L-29 -29L-10 -6L-5 26Z',ROCK,INK,2.4)+
        path('M9 26L22 -42L53 17L60 29Z','#6a8384',INK,2.5)+
        path('M-29 -29L-21 -10L-33 -16Z M22 -42L32 -18L20 -23Z',SNOW,'none',0,.8)+
        line('M-5 31L0 5L10 31','#b8a57f',3,.6)+
        tree(-49,9,.42)+tree(49,12,.37);
    case 'crown-ridge':
      return hill(67,17,'#52655d')+
        path('M-67 26L-39 -30L-21 -2L0 -48L24 -7L42 -33L68 26Z',
          '#748889',INK,2.6)+
        path('M-39 -30L-26 -9L-40 -15Z M0 -48L13 -23L-2 -29Z M42 -33L53 -12L38 -19Z',
          SNOW,'none',0,.76)+
        line('M-56 24H59','#c1c7ad',2,.4);
    case 'frostmere':
      return hill(65,16,'#647267')+lake(47,19)+
        rock(-49,16,.48)+rock(51,11,.55)+
        line('M-19 14Q0 7 21 14','#d9d7c4',1.7,.65);
    case 'highland-cairn':
      return hill(60,16,'#67735f')+
        [ [-20,18,.65],[5,8,.93],[19,-8,.65],[-4,-23,.43] ]
          .map(([x,y,s])=>rock(x,y,s)).join('')+
        line('M-35 29Q0 21 36 29',PALE,1.7,.7);
    case 'widows-wood':
      return hill(66,15,'#233e38')+
        tree(-35,5,1.1)+tree(0,-8,.89)+tree(35,8,1.02)+
        line('M-19 20Q0 11 16 28','#c0ae85',2,.52);
    case 'ashen-hamlet':
      return hill(67,14,'#424b44')+
        '<g transform="translate(-29 2) scale(.76)">'+hut(38,28,'#787769')+
          door()+'</g>'+
        '<g transform="translate(18 1) scale(.85)">'+hut(42,27,'#77746a')+
          path('M3 -20L13 -31L19 -12Z','#3c4441',INK,1.3)+'</g>'+
        line('M-48 29H50',WOOD,2.3,.7)+
        path('M-10 -25L-3 -40L3 -19Z','#47453d',INK,1.8)+
        oval(31,-43,14,8,'#b3afa5',.19);
    case 'pilgrims-rest':
      return hill(61,14,'#465247')+
        hut(50,31,'#a4a18d')+window(-18,9)+
        door(-3,10,12,20)+
        line('M32 32V-22M24 -15H40',STONE,2.6)+
        beacon(33,-23)+
        rect(-48,19,13,10,WOOD,INK,1.6);
    case 'mourn-abbey':
      return hill(66,13,'#465851')+
        path('M-38 32V-3L-17 -20L-1 -5V32Z',STONE,INK,2.7)+
        path('M5 32V-33L13 -47L24 -33V32Z','#92a49a',INK,2.6)+
        path('M28 32V-17L41 -26L47 -13V32Z','#778d82',INK,2.6)+
        line('M-43 34H52M14 -47V-55M7 -50H21',PALE,2.5)+
        path('M-11 32V12Q-3 4 6 12V32Z',DARK,INK,1.8)+
        path('M15 -18L23 -7L17 2Z',DARK,'none',0)+
        window(-34,7);
    case 'stone-quarry':
      return hill(62,15,'#475b57')+
        path('M-60 24L-42 -15L17 -24L57 5L42 36L-40 36Z',
          '#73807b',INK,2.7)+
        path('M-40 18L-25 -5L18 -9L39 8L20 25L-29 25Z',STONE,INK,1.8)+
        line('M-60 24L-40 18L-29 25M40 8L57 5M-25 -5L-16 8',
          PALE,2.1,.63)+
        rock(-49,30,.44)+rock(47,29,.45);
    case 'raven-keep':
      return hill(69,18,'#45544a')+
        path('M-52 30Q-32 6-14 1Q-4 -22 15 -15L54 25Z',
          '#697773',INK,2.5)+
        path('M-34 17V-27H-12V19Z',STONE,INK,2.8)+
        path('M2 14V-36H26V21Z','#9aaca4',INK,2.8)+
        path('M-39 -26L-23 -44L-7 -26Z M-3 -35L14 -56L31 -35Z',
          ROOF,INK,2.6)+
        line('M-36 13H29',PALE,2)+
        window(11,-15)+beacon(14,-55);
    case 'ranger-post':
      return hill(51,14,'#344c40')+hut(45,32,'#898c79')+
        window(-15,10)+door(-3,12,12,18)+
        line('M-32 34H32M-42 15L-35 3M33 17L42 5',WOOD,3)+
        beacon(-31,-19);
    case 'milepost':
      return hill(48,11,'#656b56')+
        path('M-9 28V-28L0 -38L11 -27V28Z',STONE,INK,2.4)+
        line('M-5 -17H6M-5 -9H6M-5 -1H6',INK,2)+
        path('M-8 22L-43 14L-45 24L-8 31Z','#8e7b5c',INK,1.9)+
        line('M14 24L43 11',PALE,2.2,.67);
    case 'wolf-hollow':
      return hill(59,21,'#254538')+
        path('M-57 23Q-31 -25 0 -16Q35 -25 58 24L39 38L-37 38Z',
          '#3a5946',INK,2.3)+
        path('M-32 19Q0 1 32 19Q14 31 -15 31Z',DARK,INK,1.8)+
        tree(-43,-4,.63)+tree(41,-2,.7)+
        line('M-12 27L-5 22M7 26L16 20',PALE,1.7,.58);
    case 'observatory':
      return hill(58,14,'#485656')+
        path('M-35 32V9Q-24 -27 2 -29Q28 -19 33 8V32Z',
          '#8f9e98',INK,2.7)+
        path('M-37 11Q-26 -33 3 -32Q21 -29 29 -16L17 -4L6 -17L-2 11Z',
          '#61747a',INK,2.6)+
        circle(20,-3,12,DARK,INK,2.1)+
        line('M-34 34H37M20 -15L31 -34M-3 12L10 2',
          PALE,2.1,.74)+
        door(-8,15,15,17);
    case 'heather-moor':
      return hill(65,21,'#66586c')+
        [-42,-28,-10,7,25,44].map((x,i)=>
          oval(x,15+i%3*6,13,6,i%2?'#91748f':'#96788d',.74)+
          line('M'+x+' 19v-11','#aaa39a',1.7,.54)).join('')+
        path('M-57 31Q-18 23 16 32T59 29','none','#bbaa98',1.8,.57);
    case 'iron-mine':
      return hill(62,16,'#555b51')+
        path('M-40 33L-25 -5L0 -22L28 -6L43 33Z',
          '#6c7470',INK,2.7)+
        path('M-14 33V9Q0 -9 14 9V33Z',DARK,INK,2.3)+
        line('M-40 -4L-7 -20L30 -2M-6 -20V35M31 -7V35',
          WOOD,3.2)+
        circle(33,-5,12,'none',PALE,2.5)+
        line('M33 -18V8M20 -5H46',WOOD,2)+
        rock(-42,34,.44);
    case 'east-watch':
      return watchTower(53)+
        line('M24 -26L42 -41M40 -45L49 -31',PALE,2.1)+
        beacon(0,-43);
    case 'barrow-field':
      return hill(67,14,'#64725a')+
        graveMound(-35,8,.81)+graveMound(9,6,1.06)+
        graveMound(43,11,.66)+
        line('M-57 30H54',PALE,1.7,.59);
    case 'foxglove-farm':
      return hill(64,13,'#637459')+
        hut(45,29,'#a49778')+window(-15,9)+door(-4,12,12,17)+
        line('M-53 28Q-32 20-20 28M21 29Q38 21 55 28',
          WOOD,2.3)+
        [-46,-38,39,47].map((x,i)=>
          line('M'+x+' 31V'+(11+i%2*5),MOSS,2)+
          oval(x,11+i%2*5,4,7,PLUM,.77)).join('');
    case 'blackwater-bridge':
      // E21 to E28 is a real road, with river crossing ~ (403.8,475.5).
      // The long bridge deck follows the road angle (~82° from +x): local
      // vertical artwork is rotated -8°, not placed across an invented route.
      return '<g transform="rotate(-8)">'+
        oval(0,1,34,49,DARK,.76)+
        path('M-19 -44H19V44H-19Z','#909f99',INK,2.7)+
        path('M-11 -44H11V44H-11Z','#b7beac',INK,1.6)+
        line('M-25 -45V45M25 -45V45','#c5c8b6',5.2)+
        line('M-8 -28H9M-8 -9H9M-8 12H9M-8 32H9',
          '#536860',2.2,.85)+
        line('M-25 -38H-16M17 -38H25M-25 39H-16M17 39H25',
          PALE,2.8)+'</g>';
    case 'greywater-mill':
      return hill(64,13,'#36595a')+hut(43,29,'#9ba598')+
        window(-16,9)+door(-3,13,10,16)+
        '<circle cx="29" cy="16" r="18" fill="none" stroke="#ad9270" stroke-width="4"/>'+
        circle(29,16,4,'#b5a380',INK,1.8)+
        [0,45,90,135].map(a=>
          '<line x1="29" y1="0" x2="29" y2="31" stroke="#c1aa83" '+
          'stroke-width="2" transform="rotate('+a+' 29 16)"/>').join('')+
        line('M-39 36Q12 43 61 34',WATER,2.7,.76);
    case 'battlefield':
      return hill(64,14,'#655e58')+
        path('M-45 20L-16 16L-6 29L-44 33Z','#6b6254',INK,2)+
        path('M12 27L31 15L44 30Z','#8c8170',INK,2)+
        line('M-33 29V-36M-5 29V-27M36 27V-31',WOOD,3)+
        path('M-31 -35L-7 -29L-30 -17Z','#6b595a',INK,1.5)+
        path('M-3 -27L16 -20L-2 -9Z','#8d7269',INK,1.5)+
        line('M-50 35H50','#a59a80',2,.6);
    case 'stormwatch':
      return watchTower(59)+
        path('M22 -51L33 -34L25 -36L37 -16',
          'none',PALE,2.9,.8)+
        line('M-34 34H35',PALE,1.8,.68);
    case 'eastwood':
      return hill(65,14,'#314b41')+
        tree(-36,7,1)+tree(-2,-4,.86)+tree(36,6,.93)+
        line('M-47 30Q-10 23 41 32',PALE,1.8,.55);
    case 'lowland-farm':
      return hill(63,13,'#596e53')+
        hut(45,31,'#a69c7f')+window(-15,9)+door(-3,12,12,19)+
        path('M-31 -7L0 -31L30 -7Z','#6b6250',INK,1.7)+
        line('M-58 28L-43 20L-30 27M31 27L47 21L58 29',
          PALE,2.1)+
        line('M-46 21V37M47 21V37',WOOD,2.5);
    case 'reedmere':
      return hill(64,17,'#315452')+
        oval(-16,20,48,18,'#3b686a',.71)+
        oval(31,26,31,13,WATER,.68)+
        reeds(-39,4,.85)+reeds(-8,-7,1.05)+reeds(42,6,.8)+
        line('M-30 27Q0 16 35 25','#a4b7a2',1.8,.69);
    case 'blackwater-bank':
      return hill(58,13,'#4b6357')+
        path('M-53 19Q-20 -2 18 9L57 23L49 38L-50 34Z',
          '#7b8c80',INK,2.2)+
        [-31,-12,23,43].map((x,i)=>oval(x,27-i%2*3,7,4,PALE,.69)).join('')+
        standingStone(27,4,.53)+
        line('M-50 15Q-5 9 44 14','#acc4b1',1.8,.58);
    case 'pilgrim-shrine':
      return hill(53,13,'#4d6254')+
        path('M-28 30V-7L0 -32L28 -7V30Z','#9ba49b',INK,2.5)+
        path('M-35 -7L0 -42L35 -7Z',ROOF,INK,2.5)+
        path('M-7 29V9Q0 1 7 9V29Z',DARK,INK,1.8)+
        line('M0 -42V-51M-8 -47H8',PALE,2.5)+
        window(-23,9)+
        line('M-38 35H37',WOOD,2.2);
    case 'weeping-willow':
      return hill(66,13,'#2f5550')+
        line('M0 35V-23M0 -8L-23 -33M0 -15L29 -33',WOOD,6)+
        path('M-49 -19Q-42 -48-19 -46Q0 -62 20 -46Q47 -49 53 -23Q57 1 31 6Q5 19-29 7Z',
          '#436f59',INK,2.8)+
        [-44,-33,-18,-4,10,23,38,49].map((x,i)=>
          line('M'+x+' '+(-25+i%2*6)+'Q'+(x+5)+' 7 '+(x-3)+' 35',
            '#8aad90',2.7,.85)).join('')+
        line('M-54 38Q0 25 54 38','#b6c4a8',2,.63);
    case 'hollow-mere':
      return hill(69,17,'#3e5a55')+lake(56,22)+
        reeds(-49,17,.56)+reeds(51,11,.61)+
        rock(38,25,.44)+
        line('M-25 18L-8 13M10 20L28 18',PALE,1.7,.54);
    case 'south-orchard':
      return hill(65,13,'#48684d')+
        [-34,0,35].map((x,i)=>
          '<g transform="translate('+x+' '+(i%2*5)+') scale(.66)">'+
          deciduous(0,0,1,'#527a54')+
          circle(-14,-9,3.8,'#a68057',INK,1)+
          circle(11,-14,4,'#a77d50',INK,1)+
          '</g>').join('')+
        line('M-59 30H60M-56 22V35M-18 24V35M20 24V35M58 22V35',
          WOOD,1.9,.83);
    case 'salt-road':
      return hill(57,13,'#6d6e56')+
        path('M-55 30Q-24 11 6 18L56 29','none','#c0ae83',4,.62)+
        line('M0 31V-29',WOOD,4)+
        path('M-5 -25L39 -29L39 -16L-5 -12Z','#9b8762',INK,2.2)+
        line('M-3 -18H28',PALE,1.7)+
        rock(-43,28,.36)+
        line('M-45 13L-49 30',MOSS,2.4);
    case 'stone-circle':
      return hill(67,13,'#65745e')+
        standingStone(-37,7,.75)+standingStone(-14,-1,.9)+
        standingStone(16,-5,1.08)+standingStone(41,5,.76)+
        standingStone(2,19,.54)+
        line('M-51 34Q0 19 55 34',PALE,1.9,.55);
    case 'border-watch':
      return hill(61,13,'#4b5f54')+
        watchTower(47)+
        line('M-53 31H-28M30 31H55',WOOD,3.4)+
        beacon(0,-40);
    case 'frontier-gate':return gate(true)+
        line('M-60 39H-35M35 39H60',PALE,2.4,.55);
    default:throw new Error('Missing Ravenmarch illustration for '+kind);
  }
}

function terrainPainting(){
  const river=WATERWAYS.eclipse?.[0];
  if(!river||river.id!=='blackwater-river')
    throw new Error('Missing shared Blackwater river geometry');
  let svg='<defs>'+
    '<clipPath id="ravenmarch-scene-clip"><rect width="1000" height="720"/></clipPath>'+
    '<linearGradient id="region-eclipse" x1=".1" y1="0" x2=".8" y2="1">'+
      '<stop stop-color="#596b6c"/><stop offset=".38" stop-color="#3e5554"/>'+
      '<stop offset="1" stop-color="#273f43"/></linearGradient>'+
    '<linearGradient id="ravenmarch-river-water" x1="0" y1="0" x2="1" y2=".45">'+
      '<stop stop-color="#244b54"/><stop offset=".5" stop-color="#58848a"/>'+
      '<stop offset="1" stop-color="#365b65"/></linearGradient>'+
    '<radialGradient id="ravenmarch-fog">'+
      '<stop stop-color="#dae0c4" stop-opacity=".20"/>'+
      '<stop offset="1" stop-color="#b1c4bd" stop-opacity="0"/></radialGradient>'+
    '<pattern id="ravenmarch-grain" width="35" height="33" patternUnits="userSpaceOnUse">'+
      '<circle cx="8" cy="11" r=".8" fill="#ccceac" opacity=".12"/>'+
      '<circle cx="25" cy="23" r="1.3" fill="#aac0ad" opacity=".11"/>'+
      '<path d="M17 26l5-4" stroke="#b9c0a6" stroke-opacity=".11"/></pattern>'+
    '</defs>'+
    '<rect width="1000" height="720" fill="url(#region-eclipse)"/>'+
    // Northern highlands should read as one continuous mountain belt.
    path('M0 161L52 95L120 125L205 53L272 121L354 31L422 91L492 16L574 93L655 44L728 114L811 50L899 116L970 69L1030 111V0H0Z',
      '#73868a','none',0,.47)+
    path('M0 181L78 127L157 149L244 94L319 148L390 90L467 156L565 77L647 148L720 103L795 151L890 91L1000 159V252H0Z',
      '#4a6760','none',0,.32)+
    path('M194 68L205 53L220 73M342 53L354 31L376 65M479 38L492 16L513 52M642 70L655 44L675 77',
      'none','#e0e3ce',4,.35)+
    // Old northern wood, ruins belt, and foothill quarry zone.
    path('M0 188Q113 157 233 179Q361 210 413 196T672 192Q807 167 1010 197V280Q779 310 579 286Q322 269 0 302Z',
      '#294c40','none',0,.35)+
    path('M0 283Q167 270 287 303T579 301Q781 285 1015 313V427Q809 391 630 415Q379 435 200 416L0 426Z',
      '#716d57','none',0,.23)+
    // Central farms and heather moor are recognisably different materials.
    path('M100 348Q226 321 356 357L383 426H91Z','#88825e','none',0,.27)+
    path('M548 315Q640 291 754 332L828 433L534 424Z','#746477','none',0,.21)+
    // The Blackwater valley basin has a genuine low strip between row bands.
    path('M0 409Q235 398 465 415T1000 406V549Q760 551 523 527T0 542Z',
      '#294f4b','none',0,.44)+
    path('M0 534Q218 512 380 550Q574 555 745 537T1000 540V632H0Z',
      '#50674f','none',0,.27)+
    // Southern orchard and customs frontier territory.
    path('M0 612Q196 594 350 615T638 611Q828 604 1010 595V720H0Z',
      '#5e694e','none',0,.35)+
    path('M0 684Q171 666 322 676T671 672L1000 657V720H0Z',
      '#4e6254','none',0,.3);
  // Mountain foothill tree groups are tied to northwest forests and the
  // eastern keep; these are supporting textures, not extra named nodes.
  const sparse=[ [58,132,.67],[99,156,.62],[149,170,.59],[271,152,.61],
    [811,151,.6],[922,137,.64],[963,176,.66],
    [80,252,.61],[141,251,.62],[254,274,.7],[390,273,.57],
    [919,274,.63],[948,325,.52]];
  for(const [x,y,s] of sparse)svg+=tree(x,y,s);
  for(const [x,y,s] of [[74,575,.69],[102,597,.66],[237,552,.6],
    [343,539,.54],[752,542,.62],[916,564,.73],[957,592,.75]])
    svg+=reeds(x,y,s);
  // Field boundaries are parcel edges, not navigable hunter roads.
  svg+=line('M66 387Q141 372 214 387M74 414L224 422M185 361L183 423',
    '#beb38b',2.3,.27)+
    line('M321 347L339 411M428 343L439 411M556 377Q636 371 705 379',
    '#b9a58d',2,.20)+
    line('M102 621Q200 617 244 635M320 638L365 630M877 636Q933 620 986 638',
    '#b8b18f',2,.19);
  // River bank and water always share the geometry used by the game tests.
  const d=waterwayPath(river);
  svg+='<path d="'+d+'" fill="none" stroke="#162f37" stroke-width="'+
      (river.width+16)+'" stroke-opacity=".88" stroke-linejoin="round"/>'+
    '<path d="'+d+'" fill="none" stroke="#8c9e91" stroke-width="'+
      (river.width+8)+'" stroke-opacity=".44" stroke-linejoin="round"/>'+
    '<path d="'+d+'" fill="none" stroke="url(#ravenmarch-river-water)" stroke-width="'+
      river.width+'" stroke-opacity=".97" stroke-linejoin="round"/>'+
    '<path d="'+d+'" fill="none" stroke="#aec9bb" stroke-width="2.3" '+
      'stroke-opacity=".37" stroke-dasharray="7 24"/>';
  // Named local geography: a small Greywater millrace reaches the river at
  // x~531, and a damp oxbow curves toward the Weeping Willow.
  svg+=line('M559 416Q560 450 546 459',WATER,6,.44)+
    line('M713 478Q738 500 714 515Q695 525 688 512',WATER,5,.34)+
    // Stone walls on south border leave open gate at E36.
    line('M25 710H734M834 710H973','#a9ae93',6,.28)+
    line('M25 710H734M834 710H973',PALE,1.7,.43);
  // Haze adds scale to distant highlands while keeping names legible.
  svg+=oval(438,143,260,97,'url(#ravenmarch-fog)',.36)+
    oval(788,513,202,79,'url(#ravenmarch-fog)',.28)+
    '<rect width="1000" height="720" fill="url(#ravenmarch-grain)" opacity=".52"/>';
  return svg;
}

export function renderRavenmarchScenery(){
  const nodes=RAVENMARCH_SITES.map(site=>
    '<g class="ravenmarch-landmark ravenmarch-landmark-'+site.kind+'" '+
      'data-landmark-id="'+site.id+'" data-landmark-kind="'+site.kind+'" '+
      'transform="translate('+(site.x+site.artDx)+' '+(site.y+site.artDy)+')">'+
      '<title>'+site.name.replaceAll('&','&amp;').replaceAll("'","&apos;")+'</title>'+
      landmark(site.kind)+'</g>'
  ).join('');
  return '<g class="illustrated-scenery theme-scene-eclipse" '+
    'data-world="ravenmarch" aria-hidden="true" clip-path="url(#ravenmarch-scene-clip)">'+
      terrainPainting()+
      '<g class="ravenmarch-landmarks">'+nodes+'</g>'+
      '<rect x="10" y="10" width="980" height="700" rx="7" fill="none" '+
        'stroke="#b8bca6" stroke-opacity=".17" stroke-width="13"/>'+
    '</g>';
}
