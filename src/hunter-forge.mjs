/**
 * Hunter Forge: deterministic, original modular 2-D inked-gothic character art.
 *
 * All colour/style tokens are from fixed allowlists. The renderer never reads
 * gameplay state, and cannot reveal hidden Monster information. Head, torso,
 * legs and complexion are independent layered SVG groups with one shared
 * palette so equipment remains visually cohesive across every combination.
 */
export const FORGE_HEADS=Object.freeze([
  Object.freeze({id:'hood',label:'Shadow Hood'}),
  Object.freeze({id:'brim',label:'Witchfinder Hat'}),
  Object.freeze({id:'helm',label:'Iron Visor'}),
  Object.freeze({id:'bare',label:'Windswept Hair'})
]);
export const FORGE_TORSOS=Object.freeze([
  Object.freeze({id:'coat',label:'Hunter Longcoat'}),
  Object.freeze({id:'cloak',label:'Ranger Cloak'}),
  Object.freeze({id:'gambeson',label:'Stitched Gambeson'}),
  Object.freeze({id:'armour',label:'Warden Armour'})
]);
export const FORGE_LEGS=Object.freeze([
  Object.freeze({id:'boots',label:'Trail Boots'}),
  Object.freeze({id:'greaves',label:'Iron Greaves'}),
  Object.freeze({id:'gaiters',label:'Marsh Gaiters'}),
  Object.freeze({id:'riding',label:'Riding Boots'})
]);
export const FORGE_PALETTES=Object.freeze([
  Object.freeze({id:'moss',label:'Moss & Leather',cloth:'#3f6158',dark:'#263d3a',light:'#779489',leather:'#78563c',metal:'#c5aa75',accent:'#b7c5a2'}),
  Object.freeze({id:'crimson',label:'Ash & Crimson',cloth:'#6e3942',dark:'#392832',light:'#a36366',leather:'#594337',metal:'#c4a78c',accent:'#dfa18c'}),
  Object.freeze({id:'midnight',label:'Midnight & Steel',cloth:'#354a61',dark:'#1e2c3e',light:'#7e92a1',leather:'#514d48',metal:'#b7c9ca',accent:'#b5c6c6'}),
  Object.freeze({id:'oxblood',label:'Bone & Oxblood',cloth:'#766c59',dark:'#403633',light:'#b6a990',leather:'#713c3b',metal:'#d7bb86',accent:'#e1c7ad'}),
  Object.freeze({id:'brass',label:'Bog & Brass',cloth:'#525c3b',dark:'#303a30',light:'#8c9764',leather:'#615039',metal:'#d2ac65',accent:'#bed1a5'}),
  Object.freeze({id:'slate',label:'Slate & Tan',cloth:'#59636a',dark:'#333d45',light:'#95a4a8',leather:'#a07e59',metal:'#c8b59a',accent:'#c0cfcd'})
]);
export const FORGE_COMPLEXIONS=Object.freeze([
  Object.freeze({id:'warm',label:'Warm',skin:'#bf9373',shade:'#775547',light:'#e6be97'}),
  Object.freeze({id:'deep',label:'Deep',skin:'#80543c',shade:'#4a352d',light:'#b18466'}),
  Object.freeze({id:'olive',label:'Olive',skin:'#a98564',shade:'#655441',light:'#d7b18a'}),
  Object.freeze({id:'fair',label:'Fair',skin:'#dfb698',shade:'#916a5a',light:'#f3d4ad'})
]);
export const DEFAULT_HUNTER=Object.freeze({head:'hood',torso:'coat',legs:'boots',palette:'moss',complexion:'warm'});
export const HUNTER_STORAGE_KEY='shadow-bearings.hunter-forge.v1';

const choices={head:FORGE_HEADS,torso:FORGE_TORSOS,legs:FORGE_LEGS,
  palette:FORGE_PALETTES,complexion:FORGE_COMPLEXIONS};
export const FORGE_CHOICES=Object.freeze(choices);

export function normalizeHunter(raw) {
  const result={};
  for(const [part,options] of Object.entries(choices)){
    const supplied=raw && typeof raw==='object' && !Array.isArray(raw) ? raw[part] : null;
    result[part]=options.some(option=>option.id===supplied)?supplied:DEFAULT_HUNTER[part];
  }
  return result;
}
export function loadHunter(store) {
  try {
    const serialized=store?.getItem(HUNTER_STORAGE_KEY);
    return serialized?normalizeHunter(JSON.parse(serialized)):normalizeHunter(null);
  } catch {
    return normalizeHunter(null);
  }
}
export function saveHunter(store,raw) {
  try {
    if(!store?.setItem)return false;
    store.setItem(HUNTER_STORAGE_KEY,JSON.stringify(normalizeHunter(raw)));
    return true;
  } catch {
    return false;
  }
}
export function randomHunter(random=Math.random){
  const result={};
  for(const [key,options] of Object.entries(choices)){
    const next=Number(random());
    const n=Number.isFinite(next)?Math.max(0,Math.min(.99999999,next)):0;
    result[key]=options[Math.floor(n*options.length)].id;
  }
  return result;
}
function chosen(list,id){return list.find(x=>x.id===id);}
function line(path,color,width=3,opacity=1){
  return '<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="'+width+
    '" stroke-linecap="round" stroke-linejoin="round" opacity="'+opacity+'"/>';
}
function legsArt(kind,p) {
  const ink='#101d25',leather=p.leather,metal=p.metal;
  let result='<g data-hunter-slot="legs" data-style="'+kind+'" stroke-linejoin="round">';
  if(kind==='riding'){
    result+='<path d="M115 288 L151 287 L146 385 L137 423 L87 422 L91 399 Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="8"/>'+
      '<path d="M167 289 L202 286 L230 398 L221 426 L175 421 L164 374Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="8"/>'+
      '<path d="M95 366L143 365L133 411L86 413Z M175 367L215 363L228 419L177 417Z" fill="'+leather+'" stroke="'+ink+'" stroke-width="5"/>';
  }else{
    result+='<path d="M111 290 L153 290 L145 388 L132 415 L88 408 L99 362Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="8"/>'+
      '<path d="M163 290 L205 289 L216 363 L232 411 L185 415 L169 382Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="8"/>';
  }
  result+='<path d="M88 395 Q104 389 132 395 L138 424 Q108 437 68 422 L68 411Z" fill="'+leather+'" stroke="'+ink+'" stroke-width="7"/>'+
    '<path d="M184 400Q208 389 229 395L247 416Q231 436 187 430L174 416Z" fill="'+leather+'" stroke="'+ink+'" stroke-width="7"/>'+
    line('M73 416L131 417 M182 423L243 419',p.light,3,.7);
  if(kind==='greaves'){
    result+='<path d="M100 335L143 324L137 384L99 400L94 371Z M174 324L214 338L229 395L186 392L178 362Z" fill="'+metal+'" stroke="'+ink+'" stroke-width="6"/>'+
      '<path d="M99 354L139 347M181 350L215 359" stroke="'+p.light+'" stroke-width="4"/>'+
      '<circle cx="114" cy="371" r="5" fill="'+p.dark+'"/><circle cx="208" cy="376" r="5" fill="'+p.dark+'"/>';
  }else if(kind==='gaiters'){
    result+='<path d="M98 345L142 348L137 395L96 405Z M174 347L217 350L224 408L184 407Z" fill="'+p.light+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M98 353L141 366M98 374L138 383M178 361L216 372M182 385L222 396',leather,4);
  }else if(kind==='boots'){
    result+='<path d="M100 367L142 367L139 400L94 402Z M178 366L216 364L225 402L186 405Z" fill="'+leather+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M103 379L138 384M182 381L216 377',metal,3);
  }
  result+=line('M103 306L114 329 M195 305L198 332',p.light,3,.5)+'</g>';
  return result;
}
function torsoArt(kind,p) {
  const ink='#101c25';
  let result='<g data-hunter-slot="torso" data-style="'+kind+'" stroke-linejoin="round">';
  if(kind==='coat'){
    result+='<path d="M110 177Q77 187 69 216L80 309L53 395L104 412L155 334L207 409L260 387L229 292L244 226Q242 187 200 175Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="9"/>'+
      '<path d="M102 193L146 168L164 230L130 330L76 391L99 273Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="5"/>'+
      '<path d="M178 172L208 196L224 282L246 387L202 393L159 326L162 237Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="5"/>'+
      '<path d="M145 183L161 216L175 183L182 250L164 319L147 248Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M86 306L72 376M223 306L243 373',p.light,4,.8)+
      line('M106 226L126 274M204 218L194 270',p.metal,3,.7);
  }else if(kind==='cloak'){
    result+='<path d="M121 171Q66 181 58 224L55 406Q92 431 137 397L157 331L180 398Q238 438 277 400L258 227Q244 186 204 174Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="9"/>'+
      '<path d="M88 221Q109 193 156 184L169 302L131 390L73 403Z M176 179Q234 183 242 223L266 399L204 393L159 306Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="6"/>'+
      '<path d="M111 191L163 249L214 191L200 242L159 289L120 248Z" fill="'+p.light+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M83 281L70 382M238 281L261 384',p.accent,3,.55);
  }else if(kind==='gambeson'){
    result+='<path d="M112 174Q83 176 74 210L90 329Q158 357 229 323L245 216Q234 183 204 173Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="9"/>'+
      '<path d="M101 215L137 199L152 324L112 326Z M173 195L209 211L203 325L162 329Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M98 238L210 279M100 262L208 302M116 202L200 239M125 318L208 320',p.light,4,.75)+
      '<path d="M107 332L133 359L214 337L226 326Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="5"/>';
  }else{
    result+='<path d="M106 174Q75 181 70 214L90 320Q157 341 229 319L245 216Q240 181 202 171Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="9"/>'+
      '<path d="M111 192L159 176L210 193L220 286L162 316L103 286Z" fill="'+p.metal+'" stroke="'+ink+'" stroke-width="7"/>'+
      '<path d="M122 214L161 199L197 215L205 266L161 291L116 271Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="5"/>'+
      '<path d="M82 214L112 196L122 234L85 247Z M207 195L240 215L240 251L204 230Z" fill="'+p.metal+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M130 222L151 213M173 214L191 222M126 273L159 293L195 273',p.light,4,.85);
  }
  // Shoulders, sleeves and a utilitarian belt visibly unite the variants.
  result+='<path d="M102 197Q76 198 67 241L58 292L91 312L112 240Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="7"/>'+
    '<path d="M217 195Q244 200 252 239L259 295L228 314L209 247Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="7"/>'+
    '<path d="M87 301Q155 318 230 302L232 319Q160 342 84 321Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="5"/>'+
    '<rect x="146" y="309" width="27" height="24" rx="4" fill="'+p.metal+'" stroke="'+ink+'" stroke-width="4"/>'+
    '<rect x="154" y="315" width="12" height="12" rx="2" fill="'+p.dark+'"/>'+
    line('M69 259L84 277 M240 255L251 279',p.light,4,.7)+
    '<path d="M58 290L48 321L69 334L91 306Z M230 309L251 336L273 323L260 290Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="5"/>'+
    '<path d="M51 317L64 350L91 331L79 314Z" fill="'+p.skin+'" stroke="'+ink+'" stroke-width="5"/>'+
    '<path d="M245 319L232 344L258 357L272 334Z" fill="'+p.skin+'" stroke="'+ink+'" stroke-width="5"/>';
  // A small lantern and field map are common to every Hunter, giving the
  // character a consistent game identity while clothing remains modular.
  result+='<path d="M56 344L54 373M45 373L66 373" stroke="'+ink+'" stroke-width="6"/>'+
    '<path d="M39 370L71 370L76 410L34 410Z" fill="'+p.metal+'" stroke="'+ink+'" stroke-width="6"/>'+
    '<path d="M45 380L65 380L67 401L43 401Z" fill="#f1d794" stroke="'+p.leather+'" stroke-width="4"/>'+
    '<path d="M48 360Q55 347 62 360" fill="none" stroke="'+p.metal+'" stroke-width="5"/>'+
    '<path d="M248 352L278 348L285 383L257 390Z" fill="#d9c7a1" stroke="'+ink+'" stroke-width="5"/>'+
    line('M257 356L272 365L260 376L277 379',p.leather,2.5,.9);
  result+='</g>';
  return result;
}
function headArt(kind,p,skin) {
  const ink='#101b22';
  let result='<g data-hunter-slot="head" data-style="'+kind+'" stroke-linejoin="round">';
  result+='<path d="M143 161L143 198L181 198L183 163Z" fill="'+skin.skin+'" stroke="'+ink+'" stroke-width="6"/>'+
    '<path d="M137 108Q156 87 186 106Q202 127 198 165Q187 190 162 194Q138 181 130 155Z" fill="'+skin.skin+'" stroke="'+ink+'" stroke-width="7"/>'+
    '<path d="M137 153L128 157L140 169 M198 149L207 151L196 165" fill="'+skin.shade+'" stroke="'+ink+'" stroke-width="4"/>'+
    line('M148 149L158 147 M177 147L188 149',ink,4)+
    line('M165 152L162 167L171 168',skin.shade,3)+
    line('M151 177Q165 186 182 175',skin.shade,2.5)+
    line('M143 124L149 117M184 118L191 124',skin.light,4,.7);
  if(kind==='hood'){
    result+='<path d="M159 80Q104 88 105 160L130 212L144 184L128 151Q129 119 151 113L189 116Q201 144 193 171L180 199L205 211L228 165Q229 105 185 82Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="8"/>'+
      '<path d="M123 127Q151 90 197 111L188 125Q154 114 133 148Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="4"/>'+
      line('M111 155L133 184M211 144L199 184',p.light,4,.75);
  }else if(kind==='brim'){
    result+='<path d="M110 130Q123 81 132 71L201 73Q224 106 213 128Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="7"/>'+
      '<path d="M128 103L215 102L209 120L123 122Z" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="4"/>'+
      '<path d="M69 129Q156 105 256 131Q240 152 155 147Q88 155 69 129Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="7"/>'+
      line('M107 128Q160 139 226 129',p.metal,3,.8);
  }else if(kind==='helm'){
    result+='<path d="M119 125Q111 80 151 74Q193 68 214 100L208 164L191 174L193 130Q165 114 132 138L134 180L117 169Z" fill="'+p.metal+'" stroke="'+ink+'" stroke-width="8"/>'+
      '<path d="M125 136L207 132L199 151L133 156Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="6"/>'+
      '<path d="M159 79L162 132" stroke="'+p.light+'" stroke-width="7"/>'+
      '<circle cx="123" cy="158" r="6" fill="'+p.dark+'"/><circle cx="208" cy="157" r="6" fill="'+p.dark+'"/>';
  }else{
    result+='<path d="M124 149Q112 99 147 92Q165 76 187 87Q220 99 205 144Q197 128 184 121L176 132L148 116Q136 136 124 149Z" fill="'+p.dark+'" stroke="'+ink+'" stroke-width="7"/>'+
      '<path d="M134 103L121 90L147 92 M192 91L217 85L205 108" fill="'+p.cloth+'" stroke="'+ink+'" stroke-width="5"/>'+
      line('M177 161L188 168',skin.shade,2.5);
  }
  result+='<path d="M142 186Q166 201 187 185" fill="none" stroke="'+skin.shade+'" stroke-width="3" opacity=".7"/>'+
    '<path d="M142 201L125 216L160 231L203 213L184 200L167 215Z" fill="'+p.leather+'" stroke="'+ink+'" stroke-width="5"/>'+
    '</g>';
  return result;
}
/**
 * Render a self-contained SVG in a full figure or cropped bust composition.
 * No user-provided HTML, paths, colours or labels are ever interpolated.
 */
export function renderHunterSvg(raw,options={}){
  const v=normalizeHunter(raw);
  const palette=chosen(FORGE_PALETTES,v.palette);
  const tone=chosen(FORGE_COMPLEXIONS,v.complexion);
  const p={...palette,skin:tone.skin};
  const viewBox=options.bust?'0 65 320 258':'0 0 320 450';
  const variant=options.bust?'bust':'figure';
  const className=options.className && /^[a-z0-9_ -]+$/i.test(options.className)
    ?options.className:'forge-character';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="'+className+'" viewBox="'+viewBox+
    '" role="img" aria-label="Your hunter: '+chosen(FORGE_HEADS,v.head).label+
    ', '+chosen(FORGE_TORSOS,v.torso).label+', '+chosen(FORGE_LEGS,v.legs).label+
    ', '+palette.label+'" data-hunter-part-head="'+v.head+
    '" data-hunter-part-torso="'+v.torso+'" data-hunter-part-legs="'+v.legs+
    '" data-hunter-palette="'+v.palette+'" data-hunter-complexion="'+v.complexion+
    '" data-hunter-view="'+variant+'" focusable="false">'+
    '<title>Your custom Monster Hunter</title>'+
    '<rect width="320" height="450" fill="#111e27"/>'+
    '<path d="M0 70Q151 -25 320 64L320 450H0Z" fill="#223640"/>'+
    '<path d="M19 448L19 95Q30 25 160 23Q287 24 301 95L301 448" fill="none" stroke="'+p.metal+'" stroke-width="3" opacity=".2"/>'+
    '<circle cx="176" cy="157" r="113" fill="'+p.accent+'" opacity=".1"/>'+
    '<path d="M0 296L39 279L52 294L98 266L119 299L160 278L206 296L259 261L320 302L320 450H0Z" fill="#172b33" opacity=".76"/>'+
    '<path d="M14 450L48 382L77 418L110 368L146 419L178 375L220 415L274 370L320 421V450Z" fill="#0c1d27" opacity=".82"/>'+
    line('M14 211L25 180M297 208L283 172M29 258L43 233M291 254L280 230',p.accent,3,.24)+
    '<ellipse cx="161" cy="424" rx="112" ry="19" fill="#071720" opacity=".84"/>'+
    legsArt(v.legs,p)+torsoArt(v.torso,p)+headArt(v.head,p,tone)+
    // Fine hand-inked strokes, plus asymmetric etched highlights.
    line('M23 440L44 419M273 428L296 411M47 86L61 66M264 70L279 87',p.accent,2,.42)+
    '<path d="M4 4H316V446H4Z" fill="none" stroke="'+p.metal+'" stroke-width="5" opacity=".35"/>'+
    '</svg>';
}


/**
 * Miniature Hunter Forge board piece. This is the SAME modular figure, not a
 * second independent costume set: head, torso, legs, complexion and palette
 * use the exact drawing helpers as the character creator and the briefings.
 *
 * Positions are map coordinates, not screen pixels. The portrait intentionally
 * sits to the right of its node so the centre remains a usable touch target.
 * Optional SVG movement uses the actual previous/current connected locations.
 * No foreign HTML, user-defined paths or unvalidated coordinates enter SVG.
 */
export function renderHunterBoardPiece(raw,options={}){
  const v=normalizeHunter(raw);
  const palette=chosen(FORGE_PALETTES,v.palette);
  const tone=chosen(FORGE_COMPLEXIONS,v.complexion);
  const p={...palette,skin:tone.skin};
  const x=Number(options.x),y=Number(options.y);
  if(!Number.isFinite(x)||!Number.isFinite(y)||
      x<0||x>1000||y<0||y>720)return '';
  const fromX=Number(options.fromX),fromY=Number(options.fromY);
  const motion=options.animate===true&&Number.isFinite(fromX)&&
    Number.isFinite(fromY)&&fromX>=0&&fromX<=1000&&fromY>=0&&fromY<=720&&
    (fromX!==x||fromY!==y);
  const duration=Number(options.durationMs);
  const ms=Number.isFinite(duration)?Math.min(900,Math.max(160,Math.round(duration))):380;
  const attrs=' data-hunter-part-head="'+v.head+
    '" data-hunter-part-torso="'+v.torso+
    '" data-hunter-part-legs="'+v.legs+
    '" data-hunter-palette="'+v.palette+
    '" data-hunter-complexion="'+v.complexion+'"';
  const replay=options.replay===true?' data-replay-actor="hunter"':'';
  // Keep the figurine inside the map's boundary, including the outermost
  // expert nodes. Prefer the node's right side, or left near the east edge.
  const anchored=(px,py)=>{
    // Below the centre on normal rows: the name is always above the marker.
    // Bottom rows move the miniature sideways, so its feet stay on the map.
    const bottom=py>625;
    return [
      px+(bottom?(px>850?-78:78):(px>905?-26:26)),
      py+(bottom?-8:68)
    ];
  };
  const fromPoint=anchored(fromX,fromY);
  const toPoint=anchored(x,y);
  const from=fromPoint[0]+' '+fromPoint[1];
  const to=toPoint[0]+' '+toPoint[1];
  const animation=motion?
    '<animateTransform attributeName="transform" attributeType="XML" type="translate" '+
    'from="'+from+'" to="'+to+'" dur="'+ms+'ms" begin="0s" fill="freeze"/>' : '';
  return '<g class="hunter-board-piece" pointer-events="none"'+attrs+replay+
    ' data-hunter-board-node="'+(typeof options.node==='string'&&
      /^[A-Z0-9_-]{1,20}$/.test(options.node)?options.node:'')+
    '" data-animated="'+motion+'" transform="translate('+to+')">'+
    '<title>Your Hunter: '+chosen(FORGE_HEADS,v.head).label+', '+
      chosen(FORGE_TORSOS,v.torso).label+', '+
      chosen(FORGE_LEGS,v.legs).label+', '+palette.label+'</title>'+
    animation+
    '<ellipse cx="0" cy="6" rx="24" ry="8" fill="#08141b" opacity=".72"/>'+
    '<path d="M0 -71 L27 -59 L29 -5 Q27 9 0 13 Q-27 9 -29 -5 L-27 -59Z" '+
      'fill="#10252d" stroke="'+p.metal+'" stroke-width="3.2"/>'+
    '<path d="M0 -65 L23 -55 L24 -6 Q22 5 0 9 Q-22 5 -24 -6 L-23 -55Z" '+
      'fill="'+p.dark+'" stroke="#0b1922" stroke-width="1.5"/>'+
    '<svg x="-25" y="-66" width="50" height="70" viewBox="33 68 255 365" '+
      'overflow="hidden" aria-hidden="true">'+
      legsArt(v.legs,p)+torsoArt(v.torso,p)+headArt(v.head,p,tone)+
    '</svg>'+
    '<path d="M-25 -44 L-28 -55 L-18 -60 M25 -44 L28 -55 L18 -60" '+
      'fill="none" stroke="'+p.accent+'" stroke-width="2" opacity=".75"/>'+
    '<circle cx="0" cy="6" r="5.5" fill="'+p.accent+
      '" stroke="#18272e" stroke-width="2"/>'+
    '</g>';
}
