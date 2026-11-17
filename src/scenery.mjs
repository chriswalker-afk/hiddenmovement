import { WATERWAYS, waterwayPath } from './waterways.mjs';
import { renderBlackfenScenery } from './blackfen.mjs';
import { renderDuskmereScenery } from './duskmere.mjs';

/**
 * Original hand-drawn-in-SVG scenery for each region. Art is intentionally
 * below the movement roads and node layer so clarity wins over decoration.
 */
const TONES={
  moor:    {top:'#1b3238',middle:'#29443d',bottom:'#142832',hill:'#41574d',
    water:'#315e70',waterLight:'#6999a0',line:'#83a08e',accent:'#d4b77c'},
  woodland:{top:'#243b35',middle:'#395244',bottom:'#1e3731',hill:'#547352',
    water:'#496d69',waterLight:'#99c0a3',line:'#adc3a1',accent:'#e4be77'},
  marsh:   {top:'#173b45',middle:'#32595a',bottom:'#193841',hill:'#4b7061',
    water:'#2b6774',waterLight:'#92c6bb',line:'#9cbeae',accent:'#dbcd97'},
  eclipse: {top:'#241e36',middle:'#3c324b',bottom:'#1a2436',hill:'#544663',
    water:'#423d65',waterLight:'#9c8bb3',line:'#bdabc9',accent:'#e3b99f'}
};
const curveLine=(path,stroke,width,opacity=.5,extras='')=>
  '<path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="'+width+
  '" stroke-opacity="'+opacity+'" stroke-linecap="round" '+extras+'/>';
function pine(x,y,scale=1){
  return '<g transform="translate('+x+' '+y+') scale('+scale+')" opacity=".62">'+
    '<path d="M0 16v13" stroke="#263e37" stroke-width="2"/>'+
    '<path d="M0-23L-14 9H-7L-18 20H18L7 9H14Z" fill="#173e3a" stroke="#83a88a" stroke-opacity=".26"/>'+
    '<path d="M0-20L-9 4M0-8L-12 16" stroke="#90b39a" stroke-opacity=".27"/>'+
    '</g>';
}
function reeds(x,y){
  return '<g transform="translate('+x+' '+y+')" opacity=".65" fill="none" stroke="#99bba1" stroke-width="2">'+
    '<path d="M-13 9Q-16-8-21-18M-7 9Q-2-10-6-30M0 9Q8-4 5-25M8 9Q14-5 17-16"/>'+
    '<path d="M-23-20l4 4M-8-32l4 6M4-27l3 6M17-19l3 5" stroke="#d6bf84" stroke-width="4"/>'+
    '</g>';
}
function ruin(x,y,size=1){
  return '<g transform="translate('+x+' '+y+') scale('+size+')" opacity=".47">'+
    '<path d="M-21 15V-11L-12-22L-5-10V6M5 6V-18L12-25L21-15V15" fill="none" stroke="#c2b3bb" stroke-width="5"/>'+
    '<path d="M-28 15H26M-25 23H22" stroke="#807789" stroke-width="7"/>'+
    '<path d="M-12-7h7M10-7h7" stroke="#333045" stroke-width="4"/>'+
    '</g>';
}
function concentric(x,y,rx,ry,color){
  return [0,1,2].map(i=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+(rx+i*18)+
    '" ry="'+(ry+i*12)+'" stroke="'+color+'" stroke-opacity="'+(.16-i*.035)+
    '" stroke-width="2" fill="none" stroke-dasharray="9 17"/>').join('');
}

export function renderScenery(theme='moor') {
  if(theme==='moor')return renderBlackfenScenery();
  if(theme==='woodland')return renderDuskmereScenery();
  const t=TONES[theme]||TONES.moor;
  let extra='';
  const shore='M-60 135 C65 170 120 110 263 175 S515 266 603 315 S814 424 1060 355';
  const creek='M-50 540C120 495 230 565 365 479S607 401 734 484S865 556 1060 500';
  const wave=(path,width)=>{
    return curveLine(path,'#122934',width+16,.57)+
      curveLine(path,t.water,width,.75)+
      curveLine(path,t.waterLight,2,.35,'stroke-dasharray="4 23"');
  };
  if(theme==='moor'){
    extra+=wave(shore,58);
    extra+='<path d="M-30 590Q70 550 150 588T320 584V740H-30Z" fill="#60705a" opacity=".14"/>';
    for(const [x,y,sc] of [[82,96,1.2],[137,102,.9],[188,66,.8],[280,99,.75],
      [385,61,.95],[90,555,1],[170,611,.8],[285,646,1.1],[450,605,.9],
      [694,88,.9],[855,176,1.3],[923,602,1.1],[766,625,.9],[482,478,.8]])
      extra+=pine(x,y,sc);
    extra+=concentric(150,570,72,34,t.line)+concentric(823,638,68,25,t.line);
    extra+='<path d="M788 64a49 49 0 1 1-2 0" fill="none" stroke="#d9c68b" stroke-opacity=".13" stroke-width="8"/>';
  }else if(theme==='woodland'){
    extra+=wave(creek,32);
    extra+='<path d="M-30 95Q185 6 321 128T646 67T1024 138V-20H-30Z" fill="#6b8052" opacity=".21"/>';
    extra+='<path d="M-50 623Q116 567 258 631T606 639T1050 590V760H-50Z" fill="#809269" opacity=".12"/>';
    for(let i=0;i<32;i++){
      const x=65+(i*97)%900,y=36+(i*163)%640;
      extra+=pine(x,y,.56+(i%5)*.18);
    }
    extra+=concentric(410,583,140,65,t.line)+concentric(842,221,76,33,t.line);
    extra+='<g opacity=".24" stroke="#d6c98e" stroke-width="3" fill="none">'+
      '<path d="M60 640q60-45 123 8m150-560q80-30 140 13m275 523q85-31 142 5"/>'+
      '</g>';
  }else if(theme==='marsh'){
    // River channels pass between real location rows rather than through
    // the centre of the game nodes. Every crossing road remains traversable.
    extra+=WATERWAYS.marsh.map(ch=>wave(waterwayPath(ch),ch.width)).join('');
    for(let i=0;i<22;i++){
      const x=45+(i*139)%920,y=54+(i*167)%615;
      extra+=reeds(x,y);
    }
    for(const [x,y,rx,ry] of [[100,650,81,31],[330,68,120,35],[812,605,150,49],[870,175,65,28],[530,537,60,20]]){
      extra+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="#7ba890" opacity=".11"/>'+
        concentric(x,y,Math.max(12,rx-23),Math.max(10,ry-8),t.line);
    }
    for(let i=0;i<15;i++) {
      const x=65+(i*181)%880,y=70+(i*113)%570;
      extra+='<path d="M'+x+' '+y+'q12-11 23 0q-10 11-23 0Z" fill="#a5b7a0" opacity=".25"/>';
    }
  }else{
    extra+='<path d="M-30 118Q168 45 313 149T659 98T1020 155V-20H-30Z" fill="#795969" opacity=".15"/>';
    extra+='<path d="M-40 595Q158 538 348 618T763 591T1030 636V760H-40Z" fill="#78566b" opacity=".22"/>';
    extra+=WATERWAYS.eclipse.map(ch=>wave(waterwayPath(ch),ch.width)).join('');
    extra+='<g transform="translate(893 112)" opacity=".32"><circle r="49" fill="#dfc0ad"/>'+
      '<circle cx="20" cy="-17" r="44" fill="#372b46"/></g>';
    for(const [x,y,sc] of [[90,90,.7],[238,94,.62],[493,68,1.2],[883,215,.95],
      [925,618,.75],[680,653,.7],[409,622,1.1],[144,634,.95]]) extra+=ruin(x,y,sc);
    for(const [x,y] of [[75,266],[307,590],[638,116],[764,542],[952,326]])
      extra+='<path d="M'+x+' '+y+'l-18 21 30 14-12 38" fill="none" stroke="#b49ab0" stroke-opacity=".24" stroke-width="3"/>';
    extra+=concentric(820,627,65,31,t.line);
  }
  return '<g class="illustrated-scenery theme-scene-'+theme+'" aria-hidden="true">'+
    '<defs><linearGradient id="region-'+theme+'" x1="0" x2=".85" y1="0" y2="1">'+
    '<stop offset="0" stop-color="'+t.top+'"/><stop offset=".57" stop-color="'+t.middle+'"/>'+
    '<stop offset="1" stop-color="'+t.bottom+'"/></linearGradient>'+
    '<radialGradient id="fog-'+theme+'"><stop stop-color="#e2e6ca" stop-opacity=".13"/>'+
    '<stop offset="1" stop-color="#e2e6ca" stop-opacity="0"/></radialGradient></defs>'+
    '<rect width="1000" height="720" fill="url(#region-'+theme+')"/>'+
    '<path d="M0 87Q220 20 420 85T1000 62V0H0Z" fill="'+t.hill+'" opacity=".16"/>'+
    '<path d="M0 604Q209 550 431 608T1000 595V720H0Z" fill="'+t.hill+'" opacity=".18"/>'+
    extra+
    '<ellipse cx="390" cy="290" rx="390" ry="228" fill="url(#fog-'+theme+')"/>'+
    '<ellipse cx="817" cy="540" rx="280" ry="120" fill="url(#fog-'+theme+')"/>'+
    '<rect width="1000" height="720" fill="none" stroke="'+t.accent+'" stroke-opacity=".06" stroke-width="22"/>'+
    '</g>';
}

export function renderTitleArt() {
  return '<svg class="home-art" viewBox="0 0 900 270" aria-hidden="true" focusable="false">'+
    '<defs><radialGradient id="coverMoon"><stop stop-color="#e6d6a6" stop-opacity=".66"/>'+
      '<stop offset="1" stop-color="#e6d6a6" stop-opacity="0"/></radialGradient>'+
      '<linearGradient id="coverGround" x2="0" y2="1"><stop stop-color="#355750"/>'+
      '<stop offset="1" stop-color="#112b32"/></linearGradient></defs>'+
    '<circle cx="455" cy="75" r="80" fill="url(#coverMoon)"/>'+
    '<circle cx="455" cy="75" r="31" fill="#dbcfaa" opacity=".78"/>'+
    '<path d="M0 204Q160 147 285 193T533 166T900 196V270H0Z" fill="#284c49"/>'+
    '<path d="M0 237Q150 203 266 230T503 211T720 237T900 211V270H0Z" fill="url(#coverGround)"/>'+
    '<path d="M390 228v-103l28-17v-23l38-20 34 19v25l25 18v101Z" fill="#132e35" stroke="#9bad91" stroke-opacity=".34" stroke-width="2"/>'+
    '<path d="M432 220v-53a22 22 0 0 1 44 0v53Z" fill="#a5a27b" opacity=".6"/>'+
    '<path d="M421 96h68M409 131h97" stroke="#a6aa90" stroke-opacity=".46" stroke-width="3"/>'+
    '<path d="M0 255q170-25 310 3t283-5t307-4" fill="none" stroke="#a0c4b9" opacity=".3" stroke-width="4"/>'+
    [90,145,200,712,754,802].map((x,i)=>pine(x,200-(i%2)*18,i%3===0?2.1:1.5)).join('')+
    '<path d="M340 210Q455 181 570 210" fill="none" stroke="#e0bd80" stroke-width="3" stroke-opacity=".2"/>'+
    '</svg>';
}
