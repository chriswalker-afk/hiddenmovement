import { WATERWAYS, waterwayPath } from './waterways.mjs';

/**
 * Rookgate District: 26 original city landmarks, aligned to the unchanged
 * 26-node / 46-road Tracker bearings graph. Site IDs, coordinates and their
 * names drive both map labels and scenery. No external images or fonts.
 *
 * North Canal passes between T01-T04 and T05-T09.
 * South Canal passes between T16-T21 and T22-T26.
 * All true crossings use riverRoadCrossings() on these same WATERWAYS.
 */
const SITES=[
  ['T01','Bell Tower',246.4,95,'bell-tower',54,10,'northern ward'],
  ['T02','North Barracks',397.8,95,'barracks',54,12,'northern ward'],
  ['T03','Cloth Market',549.2,95,'cloth-market',52,11,'north market'],
  ['T04','North Gate',700.6,95,'north-gate',55,10,'north wall'],
  ['T05','Canal Steps',223.7,254.3,'canal-steps',51,-27,'north canal bank'],
  ['T06','Ropewalk Yard',375.1,254.3,'ropewalk',51,-5,'north quay industries'],
  ['T07','Salt Wharf',526.5,254.3,'salt-wharf',54,-53,'north canal waterfront'],
  ['T08','Customs House',677.9,254.3,'customs',51,-20,'north customs court'],
  ['T09','East Wharf',829.3,254.3,'east-wharf',56,-54,'east canal basin'],
  ['T10','West Watch',95,367.5,'west-watch',-48,58,'western entry'],
  ['T11',"Tanner's Row",246.4,367.5,'tanners',52,54,'western trades'],
  ['T12','Lantern Square',397.8,367.5,'lantern-square',52,56,'city centre'],
  ['T13','Guildhall Court',549.2,367.5,'guildhall',52,56,'civic quarter'],
  ['T14','Foundry Yard',700.6,367.5,'foundry',54,55,'east industries'],
  ['T15','East Gate',852,367.5,'east-gate',55,53,'eastern wall'],
  ['T16','Rat Alley',148,485.8,'rat-alley',48,34,'southwest backstreets'],
  ['T17','Crow Market',299.4,485.8,'crow-market',52,35,'south market'],
  ['T18','Old Mint',450.8,485.8,'mint',50,36,'south civic quarter'],
  ['T19','Physic Garden',602.2,485.8,'physic-garden',52,34,'quiet south quarter'],
  ['T20','Prison Yard',753.6,485.8,'prison',52,34,'southeast ward'],
  ['T21','South Bastion',905,485.8,'bastion',-55,33,'south city wall'],
  ['T22','Ferry Landing',170.7,640,'ferry',54,-68,'south canal bank'],
  ['T23','South Watch',322.1,640,'south-watch',54,25,'south canal watch'],
  ['T24',"Miller's Wharf",473.5,640,'miller-wharf',51,-52,'south quay workshops'],
  ['T25','Flood Lock',624.9,640,'flood-lock',53,-69,'southeast waterworks'],
  ['T26','Fen Gate',776.3,640,'fen-gate',53,25,'southern outskirts']
];

export const ROOKGATE_SITES=Object.freeze(SITES.map(
  ([id,name,x,y,kind,artDx,artDy,zone])=>
    Object.freeze({id,name,x,y,kind,artDx,artDy,zone})
));
export const ROOKGATE_LANDMARKS=Object.freeze(
  Object.fromEntries(ROOKGATE_SITES.map(s=>[s.id,s]))
);

const INK='#19272d',SLATE='#46575b',STONE='#929b95',LIMESTONE='#b3b5a7',
  DARK='#2b4045',ROOF='#3a4a50',COPPER='#948269',GOLD='#e7c17e',
  WOOD='#887052',TEAL='#4d7778',LANTERN='#f4d18b',RED='#9e6857',
  MOSS='#6e8d77';

function path(d,fill,stroke=INK,sw=2.5,opacity=1){
  return '<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+
    '" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+opacity+'"/>';
}
function line(d,color=COPPER,sw=2,opacity=1){
  return '<path d="'+d+'" fill="none" stroke="'+color+
    '" stroke-width="'+sw+'" stroke-linejoin="round" stroke-linecap="round" opacity="'+opacity+'"/>';
}
function rect(x,y,w,h,fill,stroke=INK,sw=2,rx=0){
  return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+
    '" rx="'+rx+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
}
function oval(x,y,rx,ry,fill,opacity=1){
  return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+
    '" fill="'+fill+'" opacity="'+opacity+'"/>';
}
function circle(x,y,r,fill,stroke=INK,sw=2){
  return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+
    '" stroke="'+stroke+'" stroke-width="'+sw+'"/>';
}
function house(width=43,height=30,facade=STONE){
  return path('M'+(-width/2)+' 1L0 -21L'+(width/2)+' 1Z',ROOF,INK,2.7)+
    rect(-width/2+3,1,width-6,height-1,facade,INK,2.6)+
    line('M'+(-width/2+3)+' 10H'+(width/2-3),COPPER,1.8,.68);
}
function window(x,y,w=8,h=11){
  return rect(x,y,w,h,LANTERN,INK,1.6,1)+
    line('M'+(x+w/2)+' '+y+'v'+h+' M'+x+' '+(y+h/2)+'h'+w,WOOD,1.1,.8);
}
function door(x,y,w=10,h=19){
  return path('M'+x+' '+(y+h)+'V'+(y+6)+
    'Q'+(x+w/2)+' '+(y-1)+' '+(x+w)+' '+(y+6)+
    'V'+(y+h)+'Z',DARK,INK,1.8);
}
function battlements(width=58,y=-28){
  let s=line('M'+(-width/2)+' '+y+'H'+(width/2),STONE,3);
  for(let x=-width/2;x<width/2-2;x+=11)
    s+=rect(x,y-8,7,9,LIMESTONE,INK,1.5);
  return s;
}
function lamp(x,y){
  return '<g transform="translate('+x+' '+y+')">'+
    line('M0 12V-21','#686859',2.9)+
    path('M-6 -21H6L4 -34H-4Z',LANTERN,'#62533e',2.1)+
    path('M-9 -35L0 -41L9 -35Z',ROOF,INK,1.8)+
    oval(0,-25,15,16,GOLD,.12)+'</g>';
}
function barrel(x,y,s=1){
  return '<g transform="translate('+x+' '+y+') scale('+s+')">'+
    path('M-9 -13Q0 -18 9 -13L8 12Q0 16-8 12Z','#846c51',INK,2.2)+
    line('M-8 -7H8M-8 7H8','#b59f7e',2.5)+
    oval(0,-13,9,4,'#a38c6c')+'</g>';
}
function crate(x,y,size=18){
  return rect(x,y,size,size,'#7e735f',INK,2)+
    line('M'+x+' '+y+'l'+size+' '+size+
      'M'+(x+size)+' '+y+'l-'+size+' '+size,'#b5a27c',2);
}
function pennant(x,y,color=RED){
  return line('M'+x+' '+(y+32)+'V'+(y-18),WOOD,2.3)+
    path('M'+x+' '+(y-18)+'l24 6-24 9Z',color,INK,1.5);
}
function waterRipples(){
  return line('M-47 17Q-23 8 0 16T49 13','#a3c7b5',2.2,.65)+
    line('M-32 27Q-8 20 19 28','#93b3ab',1.5,.45);
}
function pier(){
  return path('M-35 -8L33 -8L28 3L-35 3Z','#8b795f',INK,2.3)+
    [-26,-3,21].map(x=>
      line('M'+x+' -8V25',WOOD,4)+
      line('M'+(x-2)+' -5h9','#c3ae87',2)).join('')+
    line('M-34 13H28','#aa9275',2.2);
}
function boat(){
  return path('M-27 18Q-10 31 16 25L28 17Z','#69584b',INK,2.4)+
    path('M-15 15L17 15L8 5H-9Z','#a58e70',INK,1.7)+
    line('M0 5V-28',WOOD,2.7)+
    path('M2 -26L20 -17L3 -6Z','#b0a69a',INK,1.5);
}
function gate(large=false){
  const width=large?67:54,height=large?38:30;
  const half=width/2;
  return oval(0,height+3,half+19,12,DARK,.55)+
    path('M'+(-half)+' '+height+'V-20L'+(-half+11)+' -30L'+(-half+26)+' -20V'+height+'Z',
      STONE,INK,2.6)+
    path('M'+(half-25)+' '+height+'V-20L'+(half-10)+' -30L'+half+' -20V'+height+'Z',
      STONE,INK,2.6)+
    battlements(width,-27)+
    path('M-20 -18Q0 -41 20 -18V'+height+'H-20Z',DARK,INK,2.8)+
    path('M-14 '+height+'V-13Q0 -30 14 -13V'+height+'Z','#243a40',INK,1.6)+
    line('M-23 7H-15M15 7H23M-30 22H-23M23 22H29',LIMESTONE,2.1)+
    (large?line('M0 -29V-48','#e0c99d',3)+pennant(2,-45,COPPER):'');
}
function tower(height=59){
  return oval(0,39,41,11,DARK,.56)+
    path('M-21 36L-18 '+(-height/2)+'H18L21 36Z',STONE,INK,2.8)+
    battlements(48,-height/2)+
    window(-5,-height/2+11,10,13)+
    window(-5,8,10,13)+
    door(-7,20,14,16)+
    line('M-19 0H19',COPPER,2.3,.6);
}

function landmark(kind){
  switch(kind){
    case 'bell-tower':
      return oval(0,36,47,11,DARK,.6)+
        path('M-21 36L-18 -36L-12 -44L12 -44L20 -36L21 36Z',
          '#9ca8a2',INK,2.7)+
        path('M-23 -39L0 -61L23 -39Z',ROOF,INK,2.9)+
        rect(-10,-35,20,20,DARK,INK,2)+
        circle(0,-21,6,GOLD,'#6d6757',2)+
        line('M0 -35V-21 M-16 6H17M-17 21H17',LIMESTONE,2.1)+
        window(-5,-7,9,11)+door(-7,20,14,16)+
        line('M0 -61V-70M-6 -65H6',GOLD,2);
    case 'barracks':
      return oval(0,34,59,12,DARK,.57)+
        house(55,31,'#929d98')+window(-20,8)+window(12,8)+
        battlements(65,-10)+
        path('M-12 32V15H4V32Z',DARK,INK,2)+
        line('M-47 27L-39 7H-32V34M32 34V8H41L50 27','#b3aea0',3)+
        line('M-55 36H53',COPPER,3)+pennant(36,-24,COPPER)+
        line('M-18 -3V32','#6a7d73',2,.7);
    case 'cloth-market':
      return oval(0,34,64,13,DARK,.52)+
        [-40,-3,35].map((x,i)=>
          '<g transform="translate('+x+' '+(i%2)*3+')">'+
          path('M-17 7L0 -13L18 7Z',i%2?'#9b846a':'#8d625d',INK,1.8)+
          line('M-18 8H19M-14 8V29M15 8V29',WOOD,2.2)+
          rect(-13,15,26,8,i%2?'#cab590':'#bca49c',INK,1.4)+
          line('M-12 23H13','#d8c5a3',1.2)+'</g>').join('')+
        pennant(54,-24,'#b5a27c');
    case 'north-gate':return gate(true);
    case 'canal-steps':
      return oval(0,29,58,19,TEAL,.31)+
        // These broad worn steps descend north into the actual north canal.
        [-34,-22,-10,2,14].map((y,i)=>
          path('M'+(-36+i*3)+' '+y+'H'+(35-i*3)+
            'L'+(29-i*2)+' '+(y+9)+'H'+(-31+i*2)+'Z',
            i%2?'#a7afa6':'#87978e',INK,1.6)).join('')+
        line('M-40 -40V21M41 -41V22',COPPER,3)+
        waterRipples();
    case 'ropewalk':
      return oval(0,34,66,14,DARK,.52)+
        house(48,27,'#797c72')+
        rect(-45,12,16,15,'#81775f',INK,1.7)+
        [-34,-12,12,37].map((x,i)=>
          line('M'+x+' 33V'+(-24+i%2*5),WOOD,2.7)).join('')+
        [-21,-12,-3].map(d=>line('M-38 '+d+'Q0 '+(d+4)+' 44 '+d,
          '#c4af84',2.3)).join('')+
        oval(42,14,10,12,'#b49e75',.75);
    case 'salt-wharf':
      return oval(0,25,61,19,TEAL,.32)+pier()+
        barrel(-45,8,.8)+barrel(39,14,.9)+
        path('M-10 -17L17 -17L26 -1H-19Z','#c2bb9e',INK,1.8)+
        line('M-17 -10H20 M-11 -4H21','#ede4bd',1.4,.57)+
        waterRipples();
    case 'customs':
      return oval(0,38,65,12,DARK,.52)+
        house(56,35,'#aeb3a6')+window(-20,10)+window(12,10)+
        rect(-12,-17,23,10,ROOF,INK,1.9)+
        line('M-8 -12H7','#d5b887',1.8)+
        door(-6,20,12,15)+
        line('M39 28V-35M39 -33L55 -20L23 -20',WOOD,3.2)+
        line('M52 -20V15M47 15L58 15',COPPER,2.4)+
        crate(42,20,14);
    case 'east-wharf':
      return oval(0,23,62,17,TEAL,.38)+
        '<g transform="translate(-19 -10) scale(.78)">'+
        house(42,34,'#8f9586')+window(-14,10)+'</g>'+
        pier()+barrel(43,1,.76)+
        path('M18 24Q30 15 46 23L35 34H25Z','#706151',INK,2)+
        waterRipples();
    case 'west-watch':
      return tower(49)+lamp(29,14)+
        line('M-39 35H37','#9eaa99',2.5);
    case 'tanners':
      return oval(0,36,66,15,DARK,.52)+
        '<g transform="translate(-21 -4) scale(.76)">'+house(42,33,'#9a9182')+'</g>'+
        '<g transform="translate(23 0) scale(.73)">'+house(38,31,'#888b80')+'</g>'+
        [-33,-4,29].map((x,i)=>
          oval(x,26,13,7,i%2?'#78654d':'#85765c',.88)+
          line('M'+(x-10)+' 26H'+(x+10),INK,2.2)).join('')+
        line('M-41 8L-40 -7L-21 -9L-19 7','#b9a087',2.2);
    case 'lantern-square':
      return oval(0,29,68,22,'#a2a49b',.22)+
        [ [-35,4],[38,6] ].map(([x,y])=>lamp(x,y)).join('')+
        path('M-17 31L-14 14H14L17 31Z','#929d94',INK,2.5)+
        oval(0,14,17,7,'#b7bbac')+
        circle(0,13,7,'#4e7782',INK,1.6)+
        line('M-60 32Q0 16 60 32','#c8c3ae',2,.7)+
        line('M-10 -6L0 -23L10 -6','#c6b18b',1.5,.43);
    case 'guildhall':
      return oval(0,37,66,13,DARK,.54)+
        path('M-35 32V-5L-25 -22H24L36 -5V32Z','#b3b5a9',INK,2.7)+
        path('M-40 -7L0 -36L41 -7Z','#55615e',INK,2.9)+
        [-23,-9,9,23].map(x=>
          line('M'+x+' 3V30','#c8c6b1',4)).join('')+
        path('M-10 32V12Q0 2 10 12V32Z','#384b50',INK,1.8)+
        line('M-43 36H45M-42 41H42','#bca888',2.4)+
        window(-30,7,6,10)+window(24,7,6,10);
    case 'foundry':
      return oval(0,33,61,14,DARK,.58)+
        house(51,28,'#837f70')+
        path('M19 4V-42H32V5Z','#757769',INK,2.3)+
        oval(32,-52,12,12,'#c8c0a9',.25)+
        oval(42,-63,16,8,'#c3bcab',.16)+
        path('M-12 28L-8 9L2 7L13 27Z','#3c3834',INK,2.1)+
        path('M-8 18L0 6L7 19L2 29H-8Z','#db9a5e','#ac744f',1.5)+
        line('M-44 29L-35 21H-20M30 23H49',COPPER,3.1)+
        barrel(47,28,.54);
    case 'east-gate':return gate(false)+
      line('M43 4H56M43 17H55',STONE,3.1);
    case 'rat-alley':
      return oval(0,36,64,14,DARK,.62)+
        '<g transform="translate(-35 -6) scale(.8)">'+house(42,33,'#777c77')+
          window(-12,9)+'</g>'+
        '<g transform="translate(35 3) scale(.8)">'+house(39,36,'#777b73')+
          window(7,6)+'</g>'+
        path('M-12 36L-2 -6L11 -6L23 36Z','#22333a',INK,1.7)+
        line('M-4 15L17 13','#a7a08b',2,.6)+
        crate(-29,28,11)+
        circle(7,30,3.5,'#6d786c',INK,1);
    case 'crow-market':
      return oval(0,35,66,16,DARK,.5)+
        [-35,-5,29].map((x,i)=>
          '<g transform="translate('+x+' '+(i%2)*5+')">'+
          path('M-18 10L0 -12L18 10Z',i%2?'#625158':'#795756',INK,1.9)+
          line('M-17 10H17M-14 10V32M14 10V32',WOOD,2.5)+
          rect(-10,15,20,9,'#a18e79',INK,1.5)+'</g>').join('')+
        pennant(-44,-30,'#262d35')+pennant(40,-29,'#323237');
    case 'mint':
      return oval(0,38,61,11,DARK,.54)+
        path('M-35 33V-7L0 -29L36 -7V33Z','#959e98',INK,2.9)+
        path('M-41 -7L0 -39L41 -7Z',ROOF,INK,3)+
        [-24,-10,10,24].map(x=>
          rect(x-3,2,6,23,'#c4c2ac',INK,1)).join('')+
        door(-8,19,16,14)+
        circle(0,-15,7,GOLD,'#755f45',1.8)+
        line('M-43 36H44','#b5b39b',3);
    case 'physic-garden':
      return oval(0,32,63,17,'#3a6050',.56)+
        path('M-31 32V-9L0 -32L31 -9V32Z',
          '#648b78',INK,2.5,.68)+
        path('M-30 -9L0 -31L30 -9Z','#afb6a2',INK,2)+
        [-20,-7,7,20].map(x=>
          line('M'+x+' -8V28','#c6c7b0',1.9,.84)).join('')+
        line('M-27 14H27','#b4b8a9',1.8,.78)+
        [-50,-38,38,49].map((x,i)=>
          line('M'+x+' 33V'+(10+i%2*7),MOSS,2.7)+
          oval(x,10+i%2*7,8,9,'#567c5a',.72)).join('');
    case 'prison':
      return oval(0,39,62,12,DARK,.58)+
        rect(-39,-15,78,51,'#788581',INK,2.9)+
        battlements(79,-16)+
        rect(-12,10,24,25,DARK,INK,2.1)+
        [-21,-12,-3,6,15,24].map(x=>
          line('M'+x+' 10V34',STONE,2.4)).join('')+
        rect(-30,-1,11,10,'#243943',INK,1.5)+
        rect(21,-1,11,10,'#243943',INK,1.5)+
        line('M-30 -1L-19 9M21 9L32 -1','#b6bca8',1.3);
    case 'bastion':
      return oval(0,39,55,14,DARK,.59)+
        path('M-43 35Q-47 15-30 -10Q0 -38 30 -11Q49 9 43 35Z',
          '#8c9994',INK,3)+
        path('M-47 -6Q0 -54 47 -6L38 4Q0 -32-38 4Z',
          '#a4aea0',INK,2.6)+
        battlements(76,-14)+
        path('M-8 35V18Q0 7 8 18V35Z',DARK,INK,2.2)+
        line('M-40 29H-20M22 29H42','#c7baa1',2);
    case 'ferry':
      return oval(0,27,62,21,TEAL,.37)+pier()+
        '<g transform="translate(9 1) scale(.78)">'+boat()+'</g>'+
        lamp(-46,-1)+waterRipples();
    case 'south-watch':
      return tower(55)+lamp(29,12)+
        pennant(-17,-30,COPPER);
    case 'miller-wharf':
      return oval(0,32,67,20,TEAL,.28)+
        '<g transform="translate(-22 -6) scale(.85)">'+house(45,35,'#9aa194')+
        window(-16,10)+'</g>'+
        '<circle cx="26" cy="8" r="19" fill="none" stroke="#b49b72" stroke-width="4"/>'+
        circle(26,8,4,COPPER,INK,1.6)+
        [0,45,90,135].map(a=>
          '<line x1="26" y1="-9" x2="26" y2="25" stroke="#b29b77" stroke-width="2" transform="rotate('+a+' 26 8)"/>').join('')+
        pier()+barrel(48,13,.72);
    case 'flood-lock':
      return oval(0,25,65,22,TEAL,.34)+
        // Gate leaves span the real southern canal east of T19–T25 road.
        path('M-24 -32L0 -21L0 22L-24 33Z','#847969',INK,2.4)+
        path('M25 -32L0 -21L0 22L25 33Z','#897c65',INK,2.4)+
        line('M-28 -29L-7 -18M28 -29L7 -18','#c1b492',2.9)+
        line('M-23 -9L-3 -3M3 -3L23 -9M-21 13L-4 12M4 12L22 13','#b2a583',2.2)+
        circle(-29,-35,6,'#bdbbaa',INK,2)+circle(29,-35,6,'#bdbbaa',INK,2)+
        line('M-36 32V-31M37 32V-31','#a3b1a7',3.3)+
        waterRipples();
    case 'fen-gate':
      return gate(false)+
        path('M-59 35Q-45 22-32 33M32 33Q47 20 60 35',
          '#6e8064','none',0,.75);
    default:throw new Error('Missing Rookgate landmark '+kind);
  }
}

function rooftops(){
  let art='';
  // Small peripheral buildings knit the individual landmarks into continuous
  // wards, without faking another gameplay road or painting over canal water.
  const north=[[86,59,27],[144,91,23],[346,56,27],[501,57,24],
    [629,48,29],[826,77,26],[911,110,24]];
  const middle=[[68,275,24],[161,312,25],[308,282,27],[469,304,23],
    [618,309,25],[780,295,26],[956,310,24]];
  const south=[[56,430,23],[214,432,22],[361,431,23],[515,435,25],
    [675,440,24],[848,433,21],[966,467,23]];
  for(const [x,y,w] of [...north,...middle,...south]){
    art+='<g transform="translate('+x+' '+y+')" opacity=".42">'+
      path('M'+(-w)+' -9L0 '+(-w/2-19)+'L'+w+' -9L'+(w-4)+' 14H'+(-w+4)+'Z',
        '#586362',INK,2.3)+
      [-12,4].map(dx=>line('M'+dx+' -8V13','#c2b49a',1.4,.5)).join('')+
      '</g>';
  }
  // Roof clusters on north & south perimeter walls complete the urban mass.
  for(const [x,y] of [[40,55],[954,73],[57,668],[952,669],[123,660],[893,678]])
    art+=rect(x-23,y-11,45,22,'#475754','#283941',2)+
      line('M'+(x-23)+' '+(y-11)+'l22 -15l23 15','#89968b',2,.42);
  return art;
}

function quayDetails(){
  let art='<g class="rookgate-quay-details" stroke-linecap="round">';
  // Stone-lined canal edges track the real two almost-horizontal Bezier flows.
  // Quay marks deliberately stay out of the 9 crossing bridge spans.
  for(const [y,band,sections] of [
    [175,48,[[35,200],[269,349],[422,496],[566,648],[724,1000]]],
    [571,36,[[40,123],[196,270],[349,425],[495,574],[650,729],[800,1000]]]
  ]){
    for(const [a,b] of sections){
      const k=(y===175)?'#c4b8a3':'#abae9e';
      art+=line('M'+a+' '+(y-band)+'H'+b,k,3,.44)+
        line('M'+a+' '+(y+band)+'H'+b,k,3,.36);
      for(let x=a+11;x<b-5;x+=27){
        art+=line('M'+x+' '+(y-band-2)+'v-7','#bbc1b0',1.6,.29)+
          line('M'+x+' '+(y+band+2)+'v7','#c5b99d',1.6,.25);
      }
    }
  }
  // Small canal rings and warehouse tie-points along actual quay banks.
  for(const [x,y] of [[113,217],[473,213],[623,212],[870,216],
    [85,609],[398,606],[546,605],[823,606]])
    art+=circle(x,y,4.5,'none','#aeb4a3',2.4);
  return art+'</g>';
}

function cityBackground(){
  const channels=WATERWAYS.marsh;
  if(!channels||channels.length!==2||channels[0].id!=='northern-river'||
     channels[1].id!=='southern-creek')
    throw new Error('Rookgate requires both shared canal geometries');
  let svg='<defs>'+
    '<linearGradient id="region-marsh" x1="0" y1="0" x2=".8" y2="1">'+
      '<stop stop-color="#3b4a4e"/><stop offset=".51" stop-color="#364a50"/>'+
      '<stop offset="1" stop-color="#253d43"/></linearGradient>'+
    '<linearGradient id="rookgate-canal-water" x1="0" y1="0" x2="1" y2=".35">'+
      '<stop stop-color="#234751"/><stop offset=".45" stop-color="#41747b"/>'+
      '<stop offset="1" stop-color="#315b65"/></linearGradient>'+
    '<radialGradient id="rookgate-glow">'+
      '<stop stop-color="#edc27b" stop-opacity=".23"/>'+
      '<stop offset="1" stop-color="#edc27b" stop-opacity="0"/></radialGradient>'+
    '<pattern id="rookgate-cobble" width="35" height="23" patternUnits="userSpaceOnUse">'+
      '<path d="M0 3H35M0 14H35M9 3V14M27 14V23" fill="none" '+
      'stroke="#b5b1a2" stroke-width="1.3" stroke-opacity=".12"/>'+
      '<circle cx="5" cy="20" r=".9" fill="#d4c4a1" opacity=".16"/></pattern>'+
    '</defs>'+
    '<rect width="1000" height="720" fill="url(#region-marsh)"/>'+
    // Coherent city wards: roofed north, paved market/civic centre, south docks.
    path('M0 0H1000V137H0Z','#323b40','none',0,.66)+
    path('M0 218H1000V531H0Z','#475458','none',0,.38)+
    path('M0 610H1000V720H0Z','#3d4743','none',0,.54)+
    '<rect width="1000" height="720" fill="url(#rookgate-cobble)" opacity=".78"/>'+
    path('M63 305Q345 275 552 301T968 293L972 464Q710 442 469 464T50 456Z',
      '#888e82','none',0,.09)+
    oval(401,392,119,74,'#b3aa91',.10)+
    oval(546,401,113,67,'#8f9b90',.09)+
    // City north wall and defensive districts.
    line('M30 35H722M790 35H966','#8a958e',11,.45)+
    line('M30 35H721M790 35H966','#c1bbaa',2.5,.37)+
    line('M33 52H719M794 52H957','#5f7470',4,.35)+
    line('M961 37V348M962 456V686','#859790',10,.33)+
    line('M961 37V348M962 456V686','#c6c1ae',2.3,.35)+
    line('M30 679H785M869 679H966','#819084',9,.36)+
    line('M30 679H785M869 679H966','#baaf96',2.4,.4);
  // Crowded but subordinate building masses, away from main playable markers.
  svg+=rooftops();
  // The quays are physically beneath the waterfront sites and contain the
  // same waterways used for legal bridge-deck placement.
  for(const ch of channels){
    const d=waterwayPath(ch);
    svg+='<path d="'+d+'" fill="none" stroke="#182d34" stroke-width="'+(ch.width+18)+
      '" stroke-opacity=".86" stroke-linejoin="round"/>'+
      '<path d="'+d+'" fill="none" stroke="#84928c" stroke-width="'+(ch.width+10)+
      '" stroke-opacity=".48" stroke-linejoin="round"/>'+
      '<path d="'+d+'" fill="none" stroke="url(#rookgate-canal-water)" stroke-width="'+
      ch.width+'" stroke-opacity=".98" stroke-linejoin="round"/>'+
      '<path d="'+d+'" fill="none" stroke="#9abbb1" stroke-width="2.3" '+
      'stroke-opacity=".28" stroke-dasharray="7 23"/>';
  }
  svg+=quayDetails();
  // Urban dockyard rather than rural reeds: cargo platforms, waterline moorings
  // and connected quays on the true northern/southern canals.
  for(const [x,y,w] of [[88,214,43],[466,213,34],[835,214,51],
    [88,609,40],[397,606,36],[826,608,42]])
    svg+=rect(x-w/2,y-4,w,9,'#8c7d68',INK,1.7)+
      line('M'+(x-w/2+4)+' '+(y+6)+'v12M'+(x+w/2-5)+' '+(y+6)+'v12',WOOD,2.3,.71);
  // Warm streetlight glow and small freestanding lampposts.
  for(const [x,y] of [[120,289],[346,318],[600,287],[800,326],
    [193,453],[450,455],[695,455],[896,445]]){
    svg+=oval(x,y,50,40,'url(#rookgate-glow)',.43);
    svg+='<g transform="translate('+x+' '+y+') scale(.57)">'+lamp(0,0)+'</g>';
  }
  return svg+'<rect width="1000" height="720" fill="url(#rookgate-cobble)" opacity=".16"/>';
}

export function renderRookgateScenery(){
  const landmarks=ROOKGATE_SITES.map(s=>
    '<g class="rookgate-landmark rookgate-landmark-'+s.kind+
      '" data-landmark-id="'+s.id+'" data-landmark-kind="'+s.kind+
      '" transform="translate('+(s.x+s.artDx)+' '+(s.y+s.artDy)+')">'+
      '<title>'+s.name.replaceAll('&','&amp;').replaceAll("'","&apos;")+'</title>'+
      landmark(s.kind)+'</g>'
  ).join('');
  return '<g class="illustrated-scenery theme-scene-marsh" '+
    'data-world="rookgate" aria-hidden="true">'+
      cityBackground()+
      '<g class="rookgate-landmarks">'+landmarks+'</g>'+
      '<rect x="10" y="10" width="980" height="700" rx="7" fill="none" '+
      'stroke="#a9aa97" stroke-opacity=".18" stroke-width="13"/>'+
    '</g>';
}
