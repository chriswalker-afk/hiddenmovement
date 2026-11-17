/**
 * Visual regression + viewport layout check.
 * Used only in CI; Playwright is not a runtime dependency of the game.
 */
import { chromium } from 'playwright';
import { MAPS } from '../src/map.mjs';
import {bearingBetween,formatBearing} from '../src/geometry.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.PREVIEW_URL||'http://127.0.0.1:8765/';
await mkdir('visual',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[];
const sizes=[
  {name:'desktop',width:1440,height:900},
  {name:'laptop',width:1366,height:768},
  {name:'mobile',width:390,height:844},
  {name:'landscape',width:844,height:390}
];
async function measure(page,label){
  const state=await page.evaluate(()=>{
    const rect=s=>{
      const el=document.querySelector(s);
      if(!el)return null;
      const box=el.getBoundingClientRect();
      return {top:Math.round(box.top),bottom:Math.round(box.bottom),left:Math.round(box.left),
        right:Math.round(box.right),height:Math.round(box.height),width:Math.round(box.width)};
    };
    const selectors=['.hud-screen','.hud-grid','.map-frame','.hud-move-panel',
      '#bearing-input','.bearing-entry button[type="submit"]','#end-turn',
      '.hud-tabs','.hud-footer','#save-exit','.hud-footer .feedback','#protractor-toggle'];
    return {
      width:innerWidth,height:innerHeight,
      scrollHeight:document.scrollingElement.scrollHeight,
      bodyScrollHeight:document.body.scrollHeight,
      parts:Object.fromEntries(selectors.map(s=>[s,rect(s)])),
      roadCount:document.querySelectorAll('.road-top').length,
      nodeCount:document.querySelectorAll('.nodes>.node').length
    };
  });
  report.push({label,...state});
  assert.ok(state.scrollHeight<=state.height+2,
    label+' document scrolls vertically ('+state.scrollHeight+' > '+state.height+')');
  assert.ok(state.roadCount>0,label+' missing map roads');
  assert.ok(state.nodeCount>=14,label+' missing map locations');
  for(const selector of ['.map-frame','#bearing-input',
    '.bearing-entry button[type="submit"]','#end-turn',
    '.hud-tabs','.hud-footer','#save-exit','.hud-footer .feedback','#protractor-toggle']){
    const box=state.parts[selector];
    assert.ok(box && box.height>5,label+' missing important control '+selector);
    assert.ok(box.top>=-3 && box.bottom<=state.height+3,
      label+' control '+selector+' clipped vertically: '+JSON.stringify(box));
  }
  const parent=state.parts['.hud-move-panel'];
  for(const selector of ['#bearing-input','.bearing-entry button[type="submit"]']){
    const box=state.parts[selector];
    assert.ok(box.left>=parent.left-3 && box.right<=parent.right+3,
      label+' bearing entry clipped horizontally: '+selector+' '+JSON.stringify({box,parent}));
  }
  assert.ok(Math.abs(state.parts['#save-exit'].top-
    state.parts['.hud-footer .feedback'].top)<=3,
    label+' save must share the same row as status, not consume extra height');
  assert.ok(state.parts['.map-frame'].height>=90,label+' map is too small to use');
}

// The same public finder must work in every region and viewport. It only
// highlights a place; it cannot move the Hunter, spend turns or leak a
// secret Monster location.
const consistencyChecks=[];
async function verifyLocationFinder(page,difficulty,shot){
  const map=MAPS[difficulty];
  const names=Object.values(map.nodes);
  const site=names[names.length-1];
  const hunterBefore=await page.locator('.hunter-board-piece')
    .getAttribute('data-hunter-board-node');
  const roundBefore=await page.locator('.round-indicator').textContent();
  const marksBefore=await page.locator('.node.marked-possible, .node.marked-ruled').count();
  const index=page.locator('details.location-index');
  assert.equal(await index.count(),1,difficulty+' needs an always-available finder');
  assert.equal(await page.locator('.node[data-map-node]').count(),names.length);
  await index.locator('summary').click();
  assert.equal(await index.locator('[data-map-locate]').count(),names.length,
    difficulty+' every place must be findable by name');
  assert.equal(await index.locator('.location-index-choice').last().getAttribute('aria-label'),
    'Highlight '+site.name+' on the map');
  await index.locator('[data-map-locate="'+site.id+'"]').click();
  assert.equal(await index.getAttribute('open'),null,
    'Finding a place should close the panel and reveal the map');
  assert.ok((await index.locator('summary').textContent()).includes(site.name.toUpperCase()));
  const found=page.locator('.world-svg .node.location-spotlight');
  assert.equal(await found.count(),1,'Only one node should glow');
  assert.equal(await found.getAttribute('data-map-node'),site.id,
    'Marker must correspond to public landmark name');
  assert.equal(await found.locator('.location-focus-ring').count(),1);
  assert.equal(await found.locator('.location-focus-ring')
    .evaluate(el=>getComputedStyle(el).strokeOpacity),'1');
  assert.equal(await index.locator('[data-map-locate="'+site.id+'"]')
    .getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.hunter-board-piece')
    .getAttribute('data-hunter-board-node'),hunterBefore,
    'The finder must not move the Hunter');
  assert.equal(await page.locator('.round-indicator').textContent(),roundBefore,
    'The finder must not spend a turn');
  assert.equal(await page.locator('.node.marked-possible, .node.marked-ruled').count(),marksBefore,
    'The finder must not alter deduction marks');
  assert.equal(await page.locator('.monster-location').count(),0,
    'The public finder must never reveal a hidden Monster');
  await page.screenshot({path:'visual/'+shot+'-finder.png',fullPage:false});
  consistencyChecks.push({difficulty,viewport:shot,located:site.id,
    count:names.length,unchangedHunter:hunterBefore,
    currentZoom:(await page.locator('.map-zoom-controls output').textContent()).trim()});
}
try{
  for(const size of sizes){
    const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#start-solo-select').click();
    await page.locator('[data-difficulty="expert"]').click();
    await page.locator('.monster-encounter').waitFor({state:'visible'});
    assert.match(await page.locator('#monster-intro-title').textContent(),/You are a Monster Hunter/);
    assert.match(await page.locator('.briefing-monster-name').textContent(),/THE ECLIPSE HERALD/);
    assert.match(await page.locator('.briefing-deadline').textContent(),/21 ROUNDS/);
    assert.ok(await page.locator('svg.briefing-hunter-illustration').evaluate(svg=>
      svg.viewBox.baseVal.width===320 && svg.querySelectorAll('[data-hunter-slot]').length===3 &&
      svg.getBoundingClientRect().width>60
    ),size.name+' custom Hunter artwork missing or collapsed');
    assert.ok(await page.locator('.briefing-quarry-portrait img').evaluate(async img=>{
      await img.decode();return img.naturalWidth>200;
    }),size.name+' monster artwork failed to load');
    const fullyReadable=await page.locator('.monster-encounter .encounter-copy')
      .evaluate(el=>el.scrollHeight<=el.clientHeight+6);
    assert.ok(fullyReadable,size.name+' monster introduction scrolls or clips its level heading');
    await page.screenshot({path:'visual/'+size.name+'-monster-intro.png',fullPage:false});
    await page.locator('#intro-begin').click();
    await page.locator('.hud-screen').waitFor({state:'visible'});
    if(size.name==='landscape'){
      assert.equal(await page.locator('.hud-mission-summary').evaluate(el=>
        getComputedStyle(el).display),'none',
        'On short landscape phones mission text must not overlap Follow the trail');
      assert.ok(await page.locator('.hud-status-main h1').evaluate(el=>{
        const b=el.getBoundingClientRect();return b.width>80 && b.right<innerWidth-80;
      }),'Main Hunter heading should stay legible in landscape');
    }
    // PR13: the same user-created Hunter is a real figurine on every map.
    const piece=page.locator('.world-svg .hunter-board-piece');
    assert.equal(await piece.count(),1,size.name+' missing Hunter board figurine');
    assert.equal(await piece.getAttribute('data-hunter-board-node'),MAPS.expert.hunterStart);
    assert.equal(await piece.getAttribute('data-hunter-palette'),'moss');
    assert.equal(await piece.locator('[data-hunter-slot]').count(),3);
    assert.equal(await piece.locator('animateTransform').count(),0);
    assert.equal(await piece.getAttribute('pointer-events'),'none');
    assert.equal(await page.locator('.node.hunter-location .person-symbol').count(),0,
      'Generic Hunter star must be replaced with customised character');
    assert.equal(await page.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0,
      'Default screen must not auto-plot clue bearings');
    await measure(page,size.name+'-expert');
    await page.screenshot({path:'visual/'+size.name+'-expert.png',fullPage:false});
    await page.locator('#protractor-toggle').click();
    assert.equal(await page.locator('#protractor-group').count(),1);
    await page.screenshot({path:'visual/'+size.name+'-protractor.png',fullPage:false});
    await page.locator('#hud-tab-notes').click();
    await page.screenshot({path:'visual/'+size.name+'-notes.png',fullPage:false});
    if(size.name==='mobile'){
      await page.locator('#protractor-toggle').click();
      await page.locator('#hud-tab-clues').click();
      for(let step=0;step<8;step++)
        await page.locator('#map-zoom-in').click();
      assert.equal((await page.locator('.map-zoom-controls output').textContent()).trim(),'300%',
        'Dense mobile maps need a readable 300% detail zoom');
      const pixelHeight=await page.locator('.nodes>.node .node-label').first()
        .evaluate(el=>el.getBoundingClientRect().height);
      assert.ok(pixelHeight>=10,
        'Dense labels must become readable at maximum zoom; measured '+pixelHeight+'px');
      await measure(page,'mobile-expert-detail-zoom');
      await page.screenshot({path:'visual/mobile-expert-detail-zoom.png',fullPage:false});
    }
    if(['desktop','mobile'].includes(size.name)){
      const map=MAPS.expert;
      const target=map.adjacency[map.hunterStart][0];
      const bearing=formatBearing(bearingBetween(map.nodes[map.hunterStart],map.nodes[target]))
        .replace('°','');
      await page.locator('#bearing-input').fill(bearing);
      await page.locator('.bearing-entry button[type="submit"]').click();
      await page.locator('[data-encounter="report"]').waitFor({state:'visible'});
      assert.match(await page.locator('.report-story').textContent(),
        /You search|You ask the locals|You confront the witnesses/);
      assert.ok(await page.locator('.report-art img').evaluate(async img=>{
        await img.decode();return img.naturalWidth>200;
      }),size.name+' search report portrait failed to load');
      await page.screenshot({path:'visual/'+size.name+'-search-report.png',fullPage:false});
      await page.locator('#report-continue').click();
      assert.equal(await page.locator('.hunter-board-piece').getAttribute('data-hunter-board-node'),target,
        size.name+' miniature must follow the exact reached node');
      assert.equal(await page.locator('.hunter-board-piece').getAttribute('data-animated'),'true',
        size.name+' miniature should animate the actual road traversal');
      assert.equal(await page.locator('.hunter-board-piece animateTransform').count(),1);
      await page.screenshot({path:'visual/'+size.name+'-hunter-board-move.png',fullPage:false});
      assert.equal(await page.locator('.node.hunter-location').getAttribute('data-node-note'),target,
        'Current node must remain available for map annotations');
    }
    assert.deepEqual(errors,[],size.name+' browser console exceptions');
    await page.close();
  }
  // All four difficulties: roads, nodes, and default Standard mode visibility.
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  for(const [difficulty,count] of [['intro',14],['apprentice',18],['tracker',26],['expert',36]]){
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#start-solo-select').click();
    await page.locator('[data-difficulty="'+difficulty+'"]').click();
    const expectedMonster={intro:'The Lantern Wisp',apprentice:'The Briar Shade',
      tracker:'The Mire Mimic',expert:'The Eclipse Herald'}[difficulty];
    assert.equal(await page.locator('#monster-intro-title').textContent(),'You are a Monster Hunter');
    assert.match(await page.locator('.briefing-monster-name').textContent(),new RegExp(expectedMonster.toUpperCase()));
    const rounds={intro:13,apprentice:15,tracker:18,expert:21}[difficulty];
    assert.match(await page.locator('.briefing-deadline').textContent(),new RegExp(rounds+' ROUNDS'));
    assert.match(await page.locator('.briefing-text').allTextContents().then(x=>x.join(' ')),/evidence/);
    assert.ok(await page.locator('svg.briefing-hunter-illustration').evaluate(svg=>
      svg.querySelectorAll('[data-hunter-slot]').length===3 &&
      svg.getBoundingClientRect().height>40
    ),difficulty+' custom Hunter portrait unavailable');
    assert.ok(await page.locator('.briefing-quarry-portrait img').evaluate(async img=>{
      await img.decode();return img.naturalWidth>200;
    }),difficulty+' monster portrait unavailable');
    await page.screenshot({path:'visual/monster-intro-'+difficulty+'.png',fullPage:false});
    await page.locator('#intro-begin').click();
    assert.equal(await page.locator('.nodes>.node').count(),count);
    assert.equal(await page.locator('.hunter-board-piece').count(),1,
      difficulty+' requires one identifiable Hunter figurine on its full map');
    const decks=await page.locator('.river-bridges .river-bridge').count();
    if(difficulty==='tracker')
      assert.equal(decks,9,
        'Rookgate must paint exactly four north-canal and five south-canal bridges');
    else if(difficulty==='expert')
      assert.equal(decks,5,
        'Ravenmarch uses five smaller Blackwater spans plus its bespoke bridge');
    else if(difficulty==='intro')
      assert.ok(decks>=2 && decks<=6,
        'Blackfen roads must cross the painted stream on actual, non-overlapping bridges');
    else if(difficulty==='apprentice')
      assert.equal(decks,2,
        'Duskmere must show the two real smaller crossings alongside its custom Stone Bridge');
    else assert.equal(decks,0,'Unexpected bridge decals on a map without a stream');
    if(difficulty==='intro'){
      assert.equal(MAPS.intro.title,'Blackfen Marsh');
      assert.equal(await page.locator('.blackfen-world').count(),0);
      assert.equal(await page.locator('.illustrated-scenery[data-world="blackfen"]').count(),1);
      assert.equal(await page.locator('.blackfen-landmark').count(),14,
        'All fourteen named locations need their own real landmark artwork');
      assert.equal(await page.locator('.blackfen-landmark-bridge').count(),1);
      assert.equal(await page.locator('.blackfen-landmark-landing').count(),1);
      assert.ok(await page.locator('.world-svg').getAttribute('aria-label')
        .then(s=>s.includes('Blackfen Marsh')));
      assert.equal(await page.locator('.world-svg .terrain-label').count(),0,
        'No generic region labels should contradict the actual location names');
      assert.equal(await page.locator('.world-svg .road-top').count(),29,
        'Renaming the map must preserve all bearings roads');
    }
    if(difficulty==='apprentice'){
      assert.equal(MAPS.apprentice.title,'Duskmere Village');
      assert.equal(await page.locator('.illustrated-scenery[data-world="duskmere"]').count(),1);
      assert.equal(await page.locator('.duskmere-landmark').count(),18,
        'Duskmere should give all eighteen named places unique artwork');
      assert.equal(await page.locator('.duskmere-landmark').evaluateAll(elements=>
        new Set(elements.map(el=>el.dataset.landmarkId)).size),18);
      for(const kind of ['bell-chapel','inn','market','green','stream',
        'stone-bridge','pond','willow','orchard','smithy','beacon'])
        assert.equal(await page.locator('.duskmere-landmark-'+kind).count(),1,
          kind+' has not been drawn beside its named place');
      assert.equal(await page.locator('.world-svg .road-top').count(),33,
        'Duskmere must preserve all 33 legal road bearings');
      assert.match(await page.locator('.map-heading h2').textContent(),/Duskmere Village/);
      assert.equal(await page.locator('.world-svg .terrain-label').count(),0);
      const bridge=await page.locator('.duskmere-landmark-stone-bridge').getAttribute('transform');
      assert.equal(bridge,'translate(438.4 565.8)',
        'Named Stone Bridge must align with the existing A13 to A17 creek crossing');
    }
    if(difficulty==='tracker'){
      assert.equal(MAPS.tracker.title,'Rookgate District');
      assert.equal(await page.locator('.illustrated-scenery[data-world="rookgate"]').count(),1);
      assert.equal(await page.locator('.rookgate-landmark').count(),26,
        'Every Rookgate city location must have original matching landmark art');
      assert.equal(await page.locator('.rookgate-landmark').evaluateAll(items=>
        new Set(items.map(el=>el.dataset.landmarkId)).size),26);
      for(const kind of ['bell-tower','barracks','cloth-market','north-gate','canal-steps',
        'ropewalk','salt-wharf','customs','east-wharf','west-watch','tanners',
        'lantern-square','guildhall','foundry','east-gate','rat-alley','crow-market',
        'mint','physic-garden','prison','bastion','ferry','south-watch',
        'miller-wharf','flood-lock','fen-gate'])
        assert.equal(await page.locator('.rookgate-landmark-'+kind).count(),1,
          'Missing or duplicated named city landmark '+kind);
      assert.equal(await page.locator('.world-svg .road-top').count(),46,
        'Rookgate must preserve all 46 valid bearing roads');
      assert.equal(await page.locator('.rookgate-city-bridge').count(),9,
        'Only the nine real road/canal crossings receive city bridge decks');
      assert.equal(await page.locator('.rookgate-quay-details').count(),1);
      assert.equal(await page.locator('.illustrated-scenery[data-world="rookgate"]')
        .getAttribute('clip-path'),'url(#rookgate-scene-clip)',
        'Canals must not draw outside the illustrated map bounds in landscape');
      assert.match(await page.locator('.map-heading h2').textContent(),/Rookgate District/);
      assert.equal(await page.locator('.world-svg .terrain-label').count(),0);
      assert.equal(await page.locator('.rookgate-landmark-flood-lock')
        .getAttribute('transform'),'translate(677.9 571)',
        'Flood Lock gates must actually sit across the southern canal');
    }
    if(difficulty==='expert'){
      assert.equal(MAPS.expert.title,'Ravenmarch County');
      assert.equal(await page.locator('.illustrated-scenery[data-world="ravenmarch"]').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark').count(),36,
        'Every Ravenmarch location must have its own original landmark artwork');
      assert.equal(await page.locator('.ravenmarch-landmark').evaluateAll(items=>
        new Set(items.map(el=>el.dataset.landmarkId)).size),36);
      assert.equal(await page.locator('.world-svg .road-top').count(),65,
        'Ravenmarch must preserve all 65 real bearing roads');
      assert.equal(await page.locator('.ravenmarch-river-bridge').count(),5,
        'Only the five smaller road crossings use generic bridges');
      assert.equal(await page.locator('.ravenmarch-landmark-blackwater-bridge').count(),1,
        'The E21–E28 crossing needs its own historically placed stone bridge');
      assert.equal(await page.locator('.ravenmarch-landmark-frontier-gate').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark-north-watch').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark-frostmere').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark-raven-keep').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark-reedmere').count(),1);
      assert.equal(await page.locator('.ravenmarch-landmark-hollow-mere').count(),1);
      assert.equal(await page.locator('.illustrated-scenery[data-world="ravenmarch"]')
        .getAttribute('clip-path'),'url(#ravenmarch-scene-clip)',
        'The regional landscape must not spill beyond the map on mobile');
      assert.match(await page.locator('.map-heading h2').textContent(),/Ravenmarch County/);
      assert.equal(await page.locator('.world-svg .terrain-label').count(),0,
        'Only actual named locations should label the map');
      const bridge=await page.locator('.ravenmarch-landmark-blackwater-bridge')
        .getAttribute('transform');
      assert.equal(bridge,'translate(403.8 476)');
    }
    const expectedNames=Object.values(MAPS[difficulty].nodes).map(n=>n.name);
    const displayedNames=await page.locator('.nodes>.node .node-label').allTextContents();
    assert.deepEqual(displayedNames,expectedNames,
      difficulty+' should show the actual location names, never only numeric identifiers');
    const labelGeometry=await page.evaluate(()=>{
      const svg=document.querySelector('.world-svg');
      const mapRect=svg.getBoundingClientRect();
      const rect=el=>{
        const r=el.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      };
      const labels=[...svg.querySelectorAll('.nodes>.node .node-label')]
        .map(el=>({name:el.textContent,rect:rect(el)}));
      const clipped=labels.filter(({rect:r})=>
        r.left<mapRect.left-2||r.right>mapRect.right+2||
        r.top<mapRect.top-2||r.bottom>mapRect.bottom+2).map(x=>x.name);
      const collisions=[];
      for(let i=0;i<labels.length;i++){
        for(let j=i+1;j<labels.length;j++){
          const a=labels[i].rect,b=labels[j].rect;
          const overlapX=Math.min(a.right,b.right)-Math.max(a.left,b.left);
          const overlapY=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
          if(overlapX>2&&overlapY>2)
            collisions.push(labels[i].name+' / '+labels[j].name);
        }
      }
      return {clipped,collisions};
    });
    assert.deepEqual(labelGeometry.clipped,[],difficulty+' has names off the visible map');
    if(difficulty!=='intro')
      assert.deepEqual(labelGeometry.collisions,[],
        difficulty+' has overlapping location labels');
    assert.ok(await page.locator('.clue-card').count()>0,
      'All modes should retain public opening sighting clues');
    assert.equal(await page.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0,
      'Bearings must never be drawn automatically on the map');
    await measure(page,'map-'+difficulty);
    await page.screenshot({path:'visual/map-'+difficulty+'.png',fullPage:false});
    await verifyLocationFinder(page,difficulty,'map-'+difficulty);
  }
  await page.close();

  // PR15 Blackfen Marsh: review the same complete 14-landmark map on a real
  // mobile viewport at both default zoom and a legible detailed zoom.
  const blackfen=await browser.newPage({viewport:{width:390,height:844}});
  const blackfenErrors=[];
  blackfen.on('pageerror',error=>blackfenErrors.push(String(error)));
  await blackfen.goto(url,{waitUntil:'domcontentloaded'});
  await blackfen.locator('#start-solo-select').click();
  await blackfen.locator('[data-difficulty="intro"]').click();
  assert.match(await blackfen.locator('.encounter-copy').textContent(),/BLACKFEN MARSH/i);
  await blackfen.locator('#intro-begin').click();
  await blackfen.locator('.hud-screen').waitFor({state:'visible'});
  assert.equal(await blackfen.locator('.blackfen-landmark').count(),14);
  assert.equal(await blackfen.locator('.blackfen-landmark').evaluateAll(elems=>
    new Set(elems.map(e=>e.dataset.landmarkId)).size),14);
  assert.equal(await blackfen.locator('.blackfen-landmark-swamp').count(),1);
  assert.equal(await blackfen.locator('.blackfen-landmark-mill').count(),1);
  assert.equal(await blackfen.locator('.blackfen-landmark-chapel').count(),1);
  assert.equal(await blackfen.locator('.blackfen-landmark-gate').count(),1);
  assert.equal(await blackfen.locator('.nodes>.node .node-label').count(),14);
  await measure(blackfen,'blackfen-mobile');
  await blackfen.screenshot({path:'visual/blackfen-mobile-map.png',fullPage:false});
  await blackfen.locator('#map-zoom-in').click();
  await blackfen.locator('#map-zoom-in').click();
  await measure(blackfen,'blackfen-mobile-zoom');
  await blackfen.screenshot({path:'visual/blackfen-mobile-zoom.png',fullPage:false});
    await verifyLocationFinder(blackfen,'intro','blackfen-mobile');
  // The canvas decorations are aria-hidden and never intercept map notes.
  assert.equal(await blackfen.locator('.node[data-node-note="M"]').count(),1);
  assert.equal(await blackfen.locator('.node[data-node-note="H"]').count(),1);
  assert.equal(await blackfen.locator('.illustrated-scenery').getAttribute('aria-hidden'),'true');
  assert.deepEqual(blackfenErrors,[],'Blackfen should render on mobile without exceptions');
  await blackfen.close();

  // PR16: review Duskmere's eighteen buildings and connected millstream on
  // portrait and landscape phones. Scenery cannot intercept numbered nodes,
  // clues or the player's customised board piece.
  for(const viewport of [
    {name:'mobile',width:390,height:844},
    {name:'landscape',width:844,height:390}
  ]){
    const village=await browser.newPage({viewport:{
      width:viewport.width,height:viewport.height}});
    const errors=[];
    village.on('pageerror',e=>errors.push(String(e)));
    await village.goto(url,{waitUntil:'domcontentloaded'});
    await village.locator('#start-solo-select').click();
    await village.locator('[data-difficulty="apprentice"]').click();
    assert.match(await village.locator('.encounter-copy').textContent(),/DUSKMERE VILLAGE/i);
    await village.locator('#intro-begin').click();
    await village.locator('.hud-screen').waitFor({state:'visible'});
    assert.equal(await village.locator('.duskmere-landmark').count(),18);
    assert.equal(await village.locator('.river-bridges .river-bridge').count(),2);
    assert.equal(await village.locator('.hunter-board-piece').count(),1);
    assert.equal(await village.locator('.nodes>.node .node-label').count(),18);
    assert.equal(await village.locator('.illustrated-scenery').getAttribute('aria-hidden'),'true');
    assert.equal(await village.locator('.node[data-node-note="A13"]').count(),1);
    assert.equal(await village.locator('.node[data-node-note="A14"]').count(),1);
    assert.equal(await village.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0);
    await measure(village,'duskmere-'+viewport.name);
    await village.screenshot({path:'visual/duskmere-'+viewport.name+'-map.png',fullPage:false});
    await village.locator('#map-zoom-in').click();
    await village.locator('#map-zoom-in').click();
    await measure(village,'duskmere-'+viewport.name+'-detail');
    await village.screenshot({path:'visual/duskmere-'+viewport.name+'-zoom.png',fullPage:false});
    await verifyLocationFinder(village,'apprentice','duskmere-'+viewport.name);
    assert.deepEqual(errors,[],viewport.name+' Duskmere browser errors');
    await village.close();
  }

  // PR17: review the full gothic canal city on phone portrait and landscape.
  // The nine bridge decks must coincide with real roads, while marker labels
  // remain tappable and the Hunter avatar stays on the correct public node.
  for(const viewport of [
    {name:'mobile',width:390,height:844},
    {name:'landscape',width:844,height:390}
  ]){
    const city=await browser.newPage({viewport:{
      width:viewport.width,height:viewport.height}});
    const errors=[];
    city.on('pageerror',error=>errors.push(String(error)));
    await city.goto(url,{waitUntil:'domcontentloaded'});
    await city.locator('#start-solo-select').click();
    await city.locator('[data-difficulty="tracker"]').click();
    assert.match(await city.locator('.encounter-copy').textContent(),/ROOKGATE DISTRICT/i);
    await city.locator('#intro-begin').click();
    await city.locator('.hud-screen').waitFor({state:'visible'});
    assert.equal(await city.locator('.illustrated-scenery[data-world="rookgate"]').count(),1);
    assert.equal(await city.locator('.rookgate-landmark').count(),26);
    assert.equal(await city.locator('.rookgate-landmark').evaluateAll(landmarks=>
      new Set(landmarks.map(item=>item.dataset.landmarkId)).size),26);
    assert.equal(await city.locator('.rookgate-city-bridge').count(),9);
    assert.equal(await city.locator('.world-svg .node-label').count(),26);
    assert.equal(await city.locator('.hunter-board-piece').count(),1);
    assert.equal(await city.locator('.node[data-node-note="T04"]').count(),1);
    assert.equal(await city.locator('.node[data-node-note="T23"]').count(),1);
    assert.equal(await city.locator('.node[data-node-note="T25"]').count(),1);
    assert.equal(await city.locator('.rookgate-landmark-flood-lock').count(),1);
    assert.equal(await city.locator('.illustrated-scenery').getAttribute('aria-hidden'),'true');
    assert.equal(await city.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0);
    await measure(city,'rookgate-'+viewport.name);
    await city.screenshot({path:'visual/rookgate-'+viewport.name+'-map.png',fullPage:false});
    await city.locator('#map-zoom-in').click();
    await city.locator('#map-zoom-in').click();
    await measure(city,'rookgate-'+viewport.name+'-detail');
    await city.screenshot({path:'visual/rookgate-'+viewport.name+'-zoom.png',fullPage:false});
    await verifyLocationFinder(city,'tracker','rookgate-'+viewport.name);
    assert.deepEqual(errors,[],viewport.name+' Rookgate rendering errors');
    await city.close();
  }

  // PR18 Ravenmarch County: the biggest map should stay legible at normal
  // and 150% zoom, in both portrait and short landscape phone viewports.
  for(const viewport of [
    {name:'mobile',width:390,height:844},
    {name:'landscape',width:844,height:390}
  ]){
    const county=await browser.newPage({viewport:{
      width:viewport.width,height:viewport.height}});
    const errors=[];
    county.on('pageerror',error=>errors.push(String(error)));
    await county.goto(url,{waitUntil:'domcontentloaded'});
    await county.locator('#start-solo-select').click();
    await county.locator('[data-difficulty="expert"]').click();
    assert.match(await county.locator('.encounter-copy').textContent(),/RAVENMARCH COUNTY/i);
    await county.locator('#intro-begin').click();
    await county.locator('.hud-screen').waitFor({state:'visible'});
    assert.equal(await county.locator('.illustrated-scenery[data-world="ravenmarch"]').count(),1);
    assert.equal(await county.locator('.ravenmarch-landmark').count(),36);
    assert.equal(await county.locator('.ravenmarch-landmark').evaluateAll(items=>
      new Set(items.map(el=>el.dataset.landmarkId)).size),36);
    assert.equal(await county.locator('.river-bridges .river-bridge').count(),5);
    assert.equal(await county.locator('.world-svg .road-top').count(),65);
    assert.equal(await county.locator('.world-svg .node-label').count(),36);
    assert.equal(await county.locator('.hunter-board-piece').count(),1);
    assert.equal(await county.locator('.node[data-node-note="E01"]').count(),1);
    assert.equal(await county.locator('.node[data-node-note="E21"]').count(),1);
    assert.equal(await county.locator('.node[data-node-note="E28"]').count(),1);
    assert.equal(await county.locator('.node[data-node-note="E36"]').count(),1);
    assert.equal(await county.locator('.ravenmarch-landmark-blackwater-bridge').count(),1);
    if(viewport.name==='mobile')
      assert.ok(await county.locator('.map-heading h2').evaluate(el=>
        el.scrollWidth<=el.clientWidth+1),
        'Show the full Ravenmarch County map name on ordinary portrait phones');
    assert.equal(await county.locator('.illustrated-scenery').getAttribute('aria-hidden'),'true');
    assert.equal(await county.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0);
    await measure(county,'ravenmarch-'+viewport.name);
    await county.screenshot({path:'visual/ravenmarch-'+viewport.name+'-map.png',fullPage:false});
    await county.locator('#map-zoom-in').click();
    await county.locator('#map-zoom-in').click();
    await measure(county,'ravenmarch-'+viewport.name+'-detail');
    await county.screenshot({path:'visual/ravenmarch-'+viewport.name+'-zoom.png',fullPage:false});
    await verifyLocationFinder(county,'expert','ravenmarch-'+viewport.name);
    assert.deepEqual(errors,[],viewport.name+' Ravenmarch rendering errors');
    await county.close();
  }

  // PR11 Hunter Forge: each selected part and palette persists, and the same
  // original figure appears on mission briefings, field training and HUD.
  for(const viewport of [
    {name:'desktop',width:1366,height:768},
    {name:'mobile',width:390,height:844}
  ]){
    const forge=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    const pageErrors=[];
    forge.on('pageerror',error=>pageErrors.push(String(error)));
    await forge.goto(url,{waitUntil:'domcontentloaded'});
    await forge.locator('#forge-open').click();
    assert.equal(await forge.locator('.forge-preview-portrait [data-hunter-slot]').count(),3);
    await forge.screenshot({path:'visual/hunter-forge-'+viewport.name+'-default.png',fullPage:true});
    for(const [part,value] of [
      ['head','brim'],['torso','armour'],['legs','greaves'],
      ['palette','midnight'],['complexion','deep']
    ]) {
      await forge.locator('[data-forge-part="'+part+'"][data-forge-value="'+value+'"]').click();
      assert.equal(await forge.locator('.forge-preview-portrait').getAttribute('data-hunter-'+
        (part==='head'||part==='torso'||part==='legs'?'part-'+part:part)),value);
      assert.equal(await forge.locator('[data-forge-part="'+part+'"][data-forge-value="'+value+'"]')
        .getAttribute('aria-pressed'),'true');
    }
    await forge.screenshot({path:'visual/hunter-forge-'+viewport.name+'-customised.png',fullPage:true});
    await forge.locator('#forge-save').click();
    assert.equal(await forge.locator('.forge-launch-art').getAttribute('data-hunter-part-head'),'brim');
    const saved=await forge.evaluate(()=>JSON.parse(localStorage.getItem('shadow-bearings.hunter-forge.v1')));
    assert.deepEqual(saved,{
      head:'brim',torso:'armour',legs:'greaves',palette:'midnight',complexion:'deep'
    });
    await forge.reload({waitUntil:'domcontentloaded'});
    assert.equal(await forge.locator('.forge-launch-art').getAttribute('data-hunter-palette'),'midnight');
    await forge.locator('#start-solo-select').click();
    assert.equal(await forge.locator('.forge-launch-art').getAttribute('data-hunter-part-legs'),'greaves');
    await forge.locator('[data-difficulty="apprentice"]').click();
    assert.equal(await forge.locator('svg.briefing-hunter-illustration')
      .getAttribute('data-hunter-part-head'),'brim');
    await forge.screenshot({path:'visual/hunter-forge-'+viewport.name+'-briefing.png',fullPage:false});
    await forge.locator('#intro-begin').click();
    assert.equal(await forge.locator('.hud-hunter-art').getAttribute('data-hunter-palette'),'midnight');
    const token=forge.locator('.hunter-board-piece');
    assert.equal(await token.count(),1,'Exactly one Hunter board figurine');
    assert.equal(await token.getAttribute('data-hunter-part-head'),'brim');
    assert.equal(await token.getAttribute('data-hunter-part-torso'),'armour');
    assert.equal(await token.getAttribute('data-hunter-part-legs'),'greaves');
    assert.equal(await token.getAttribute('data-hunter-palette'),'midnight');
    assert.equal(await token.getAttribute('data-hunter-complexion'),'deep');
    assert.equal(await token.locator('[data-hunter-slot]').count(),3);
    await forge.screenshot({
      path:'visual/hunter-board-piece-'+viewport.name+'-custom.png',fullPage:false});
    assert.equal(await forge.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0);
    await measure(forge,'forge-'+viewport.name+'-hud');
    await forge.screenshot({path:'visual/hunter-forge-'+viewport.name+'-hud.png',fullPage:false});
    assert.deepEqual(pageErrors,[],viewport.name+' Hunter Forge browser errors');
    await forge.close();
  }

  // Guided Tutorial Help teaches the real game, THEN the existing bearings
  // exercises. The in-game Coach must never auto-draw a bearing on the map.
  const help=await browser.newPage({viewport:{width:1366,height:768}});
  await help.goto(url,{waitUntil:'domcontentloaded'});
  await help.locator('#guided-toggle').click();
  await help.locator('#start-solo-select').click();
  await help.locator('[data-difficulty="intro"]').click();
  await help.locator('#intro-help').click();
  await help.locator('#guide-title').waitFor({state:'visible'});
  assert.match(await help.locator('#guide-title').textContent(),/Monster Hunter/);
  await help.screenshot({path:'visual/guided-how-to-hunt.png',fullPage:false});
  for(let i=0;i<6;i++)await help.locator('#guide-next').click();
  assert.match(await help.locator('#guide-title').textContent(),/turn-by-turn checklist/);
  await help.locator('#guide-practice').click();
  assert.match(await help.locator('#lesson-title').textContent(),/Clockwise from north/);
  await help.screenshot({path:'visual/guided-bearing-practice.png',fullPage:false});
  await help.locator('#tutorial-close').click();
  assert.equal(await help.locator('#monster-intro-title').textContent(),'You are a Monster Hunter');
  await help.locator('#intro-begin').click();
  assert.equal(await help.locator('#hud-tab-coach').getAttribute('aria-selected'),'true');
  await help.locator('.coach-panel').waitFor({state:'visible'});
  await help.screenshot({path:'visual/guided-contextual-coach.png',fullPage:false});
  await help.locator('#coach-reveal').click();
  assert.match(await help.locator('.coach-reveal-answer').textContent(),/Correct road bearing:/);
  assert.equal(await help.locator('.world-svg .clue-ray, .world-svg .clue-sector').count(),0,
    'Coach may reveal a worked bearing as text, but must never draw it automatically');
  await help.locator('#coach-open-protractor').click();
  assert.equal(await help.locator('#protractor-group').count(),1);
  await measure(help,'guided-hunt-with-protractor');
  await help.screenshot({path:'visual/guided-coach-with-protractor.png',fullPage:false});
  await help.close();

  // PR12: the actual, ended game automatically reveals chronological Hunter
  // and Monster moves, with immediately accessible Skip/Results and rewatch.
  for(const viewport of [
    {name:'desktop',width:1366,height:768},
    {name:'mobile',width:390,height:844},
    {name:'landscape',width:844,height:390}
  ]){
    const replay=await browser.newPage({viewport:{
      width:viewport.width,height:viewport.height},deviceScaleFactor:1});
    const pageErrors=[];
    replay.on('pageerror',err=>pageErrors.push(String(err)));
    await replay.goto(url,{waitUntil:'domcontentloaded'});
    await replay.locator('#start-solo-select').click();
    await replay.locator('[data-difficulty="intro"]').click();
    await replay.locator('#intro-begin').click();
    for(let i=0;i<16 && await replay.locator('.replay-screen').count()===0;i++){
      const end=replay.locator('#end-turn');
      assert.ok(await end.count(),viewport.name+' hunt did not finish');
      await end.click();
    }
    await replay.locator('.replay-screen').waitFor({state:'visible'});
    assert.equal(await replay.locator('[data-replay-actor="hunter"]').count(),1);
    assert.equal(await replay.locator('.hunter-board-piece[data-replay-actor="hunter"]').count(),1,
      "Replay should keep the player's own outfit as their board piece");
    assert.equal(await replay.locator('[data-replay-actor="monster"]').count(),1);
    assert.match(await replay.locator('.replay-heading h1').textContent(),/HUNT, REPLAYED/);
    assert.equal(await replay.locator('#replay-progress').count(),1);
    const total=Number(await replay.locator('#replay-progress').getAttribute('max'));
    assert.ok(total>=1,viewport.name+' replay has no recorded movements');
    const pause=await replay.locator('#replay-play-pause').textContent();
    if(pause.includes('PAUSE'))await replay.locator('#replay-play-pause').click();
    const frame=Number(await replay.locator('#replay-progress').inputValue());
    assert.ok(frame<total,viewport.name+' playback advanced too far before review');
    const geometry=await replay.evaluate(()=>{
      const rect=s=>{
        const el=document.querySelector(s);
        if(!el)return null;
        const b=el.getBoundingClientRect();
        return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,
          height:b.height,width:b.width};
      };
      return {height:innerHeight,width:innerWidth,
        scrollHeight:document.scrollingElement.scrollHeight,
        map:rect('.replay-map .map-frame'),
        panel:rect('.replay-panel'),skip:rect('#replay-skip'),
        previous:rect('#replay-prev'),next:rect('#replay-next'),
        story:rect('.replay-story'),locations:rect('.replay-locations')};
    });
    assert.ok(geometry.scrollHeight<=geometry.height+3,
      viewport.name+' endgame replay scrolled the full page');
    for(const key of ['map','panel','skip','previous','next']){
      const b=geometry[key];
      assert.ok(b&&b.height>18&&b.width>18,
        viewport.name+' replay control missing '+key);
      assert.ok(b.top>=-3&&b.bottom<=geometry.height+4,
        viewport.name+' replay control clipped '+key+': '+JSON.stringify(b));
    }
    assert.ok(geometry.map.height>=75,viewport.name+' replay map too small');
    assert.ok(geometry.story && geometry.locations &&
      geometry.story.bottom<=geometry.locations.top+2,
      viewport.name+' replay narrative overlaps the actor location cards: '+
        JSON.stringify({story:geometry.story,locations:geometry.locations}));
    await replay.screenshot({
      path:'visual/replay-'+viewport.name+'-initial.png',fullPage:false});
    await replay.locator('#replay-next').click();
    assert.equal(Number(await replay.locator('#replay-progress').inputValue()),frame+1,
      viewport.name+' next must advance exactly one recorded movement');
    assert.equal(await replay.locator('[data-replay-actor]').count(),2);
    await replay.screenshot({
      path:'visual/replay-'+viewport.name+'-step.png',fullPage:false});
    await replay.locator('#replay-progress').evaluate((input,max)=>{
      input.value=String(max);
      input.dispatchEvent(new Event('input',{bubbles:true}));
    },total);
    assert.equal(Number(await replay.locator('#replay-progress').inputValue()),total);
    assert.ok((await replay.locator('.replay-complete').textContent()).includes('final move'));
    await replay.screenshot({
      path:'visual/replay-'+viewport.name+'-last.png',fullPage:false});
    await replay.locator('#replay-skip').click();
    assert.ok(await replay.locator('#play-again').isVisible(),
      viewport.name+' skip did not reach original results');
    assert.ok(await replay.locator('#main-menu').isVisible());
    assert.ok(await replay.locator('#replay-watch-again').isVisible());
    await replay.screenshot({
      path:'visual/replay-'+viewport.name+'-results.png',fullPage:false});
    await replay.locator('#replay-watch-again').click();
    assert.equal(await replay.locator('.replay-screen').count(),1,
      viewport.name+' rewatch did not restart');
    assert.equal(await replay.locator('[data-replay-actor]').count(),2);
    await replay.locator('#replay-skip').click();
    await replay.locator('#main-menu').click();
    assert.ok(await replay.locator('#start-solo-select').isVisible(),
      viewport.name+' menu unavailable after replay');
    assert.deepEqual(pageErrors,[],viewport.name+' replay console exceptions');
    await replay.close();
  }

  // PR20 — complete ACTION-DRIVEN first-turn tutorial, not a snapshot-only
  // assertion. Check the actual arrows, protractor positioning, evidence,
  // manual optional deduction, both legal moves and the SECRET Monster phase.
  const guidedChecks=[];
  for(const viewport of [
    {name:'desktop',width:1280,height:800},
    {name:'portrait',width:390,height:844},
    {name:'landscape',width:844,height:390}
  ]){
    const guided=await browser.newPage({viewport:{
      width:viewport.width,height:viewport.height
    }});
    const errors=[];
    guided.on('pageerror',error=>errors.push(String(error)));
    await guided.goto(url,{waitUntil:'domcontentloaded'});
    await guided.locator('#guided-toggle').click();
    await guided.locator('#start-solo-select').click();
    await guided.locator('[data-difficulty="intro"]').click();
    assert.match(await guided.locator('.encounter-copy').textContent(),/GUIDED MODE/);
    await guided.locator('#intro-begin').click();
    const step=async key=>{
      assert.equal(await guided.locator('#guided-tour').getAttribute('data-guided-step'),key,
        'Walkthrough did not reach '+key+' on '+viewport.name);
      assert.ok(await guided.locator('#guided-tour-arrow').isVisible());
      assert.equal(await guided.locator('#guided-tour-skip').count(),1);
      assert.equal(await guided.locator('.guided-tour-target').count(),1,
        'Exactly one active lesson control should be highlighted');
    };
    await step('enable-protractor');
    assert.equal(await guided.locator('#protractor-group').count(),0);
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-enable.png',fullPage:false});
    await guided.locator('#protractor-toggle').click();
    await step('place-protractor');
    assert.equal(await guided.locator('#protractor-group').count(),1);
    assert.ok((await guided.locator('#protractor-group').getAttribute('transform'))!==
      'translate(100 380)','Guided protractor must first need positioning');
    if(viewport.name==='desktop'){
      const handle=await guided.locator('.protractor-center-hit').boundingBox();
      const hunter=await guided.locator('.node.hunter-location .node-ring').boundingBox();
      assert.ok(handle&&hunter,'Drag handle and Hunter location marker must be visible');
      await guided.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
      await guided.mouse.down();
      await guided.mouse.move(hunter.x+hunter.width/2,hunter.y+hunter.height/2,{steps:12});
      await guided.mouse.up();
    }else{
      // The CENTER control is a genuinely supported non-drag alternative
      // for touch, keyboard, reduced dexterity and small screens.
      await guided.locator('#guided-tour-center').click();
    }
    await step('open-clue');
    assert.equal(await guided.locator('.guided-tour-companion').count(),0);
    await guided.locator('#hud-tab-clues').click();
    await step('read-bearing');
    assert.equal(await guided.locator('.clue-card.guided-tour-target').count(),1);
    assert.equal(await guided.locator('.sighting-card').count(),1);
    assert.equal(await guided.locator('.clue-ray,.clue-sector').count(),0,
      'A tutorial may not automatically plot the hidden Monster direction');
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-clue.png',fullPage:false});
    await guided.locator('#guided-tour-next').click();
    await step('enable-deduction');
    assert.equal(await guided.locator('#plot-toggle.guided-tour-target').count(),1);
    await guided.locator('#plot-toggle').click();
    await step('explain-deduction');
    assert.ok(await guided.locator('.clue-ray,.clue-sector').count()>0);
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-deduction.png',fullPage:false});
    await guided.locator('#guided-tour-next').click();
    await step('first-move');
    const map=MAPS.intro;
    const first=map.adjacency[map.hunterStart][0];
    const firstBearing=formatBearing(bearingBetween(
      map.nodes[map.hunterStart],map.nodes[first])).slice(0,3);
    await guided.locator('#bearing-input').fill(firstBearing);
    await guided.locator('#move-form button[type="submit"]').click();
    assert.equal(await guided.locator('.report-encounter .guided-search-note').count(),1);
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-search.png',fullPage:false});
    await guided.locator('#report-continue').click();
    await step('second-move');
    const homeBearing=formatBearing(bearingBetween(
      map.nodes[first],map.nodes[map.hunterStart])).slice(0,3);
    await guided.locator('#bearing-input').fill(homeBearing);
    await guided.locator('#move-form button[type="submit"]').click();
    await guided.locator('#report-continue').click();
    await step('end-turn');
    assert.equal(await guided.locator('#move-form,#bearing-input').count(),0,
      'Exhausted Guided Hunter must not see an inert bearing form');
    assert.equal(await guided.locator('#protractor-toggle,#protractor-group,.protractor-keys').count(),0,
      'Exhausted Guided Hunter must not see any protractor control');
    assert.equal(await guided.locator('#end-turn.monster-turn-cta.guided-tour-target').count(),1,
      'Guided Coach must highlight the new primary Monster-phase button');
    assert.match(await guided.locator('#end-turn').textContent(),/BEGIN MONSTER.S HIDDEN MOVEMENT/);
    assert.match(await guided.locator('.turn-complete-explainer').textContent(),/has NOT moved yet/);
    assert.match(await guided.locator('.turn-marker strong').textContent(),/1\s*\/\s*13/);
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-end-turn.png',fullPage:false});
    await guided.locator('#end-turn').click();
    await step('monster-moved');
    assert.match(await guided.locator('.turn-marker strong').textContent(),/2\s*\/\s*13/,
      'The Monster turn should advance the round without revealing its position');
    assert.equal(await guided.locator('.monster-location').count(),0,
      'No Guided step may reveal the secret Monster after its turn');
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-monster-turn.png',fullPage:false});
    await guided.locator('#hud-tab-clues').click();
    assert.equal(await guided.locator('#guided-tour').getAttribute('data-guided-step'),'independent');
    assert.match(await guided.locator('#guided-tour h3').textContent(),/on your own/i);
    await guided.screenshot({path:'visual/guided-'+viewport.name+'-independent.png',fullPage:false});
    await guided.locator('#guided-tour-next').click();
    assert.equal(await guided.locator('#guided-tour').count(),0,
      'First-turn walkthrough should end permanently after independence message');
    assert.equal(await guided.locator('.hunter-board-piece').count(),1);
    assert.equal(await guided.locator('.coach-panel').count(),0,
      'After tutorial Clues can remain open; Coach is optional');
    assert.deepEqual(errors,[],'Guided '+viewport.name+' threw a browser exception');
    guidedChecks.push({viewport:viewport.name,steps:'complete',
      twoValidMoves:true,monsterLocation:'hidden'});
    await guided.close();
  }
  // Skipping removes only guided instruction; normal gameplay and Coach
  // controls remain and the Hunter is never silently moved.
  const skipGuide=await browser.newPage({viewport:{width:390,height:844}});
  await skipGuide.goto(url,{waitUntil:'domcontentloaded'});
  await skipGuide.locator('#guided-toggle').click();
  await skipGuide.locator('#start-solo-select').click();
  await skipGuide.locator('[data-difficulty="apprentice"]').click();
  await skipGuide.locator('#intro-begin').click();
  await skipGuide.locator('#guided-tour-skip').click();
  assert.equal(await skipGuide.locator('#guided-tour').count(),0);
  assert.equal(await skipGuide.locator('.hunter-board-piece').count(),1);
  assert.equal(await skipGuide.locator('#hud-tab-coach').count(),1);
  await skipGuide.close();
  // Pass-and-play: a monster-specific bearing prompt is visible ONLY when
  // the Monster has revealed their own screen. Handoffs remain completely
  // opaque, and the Hunter receives only a public post-turn explanation.
  const duo=await browser.newPage({viewport:{width:1280,height:800}});
  await duo.goto(url,{waitUntil:'domcontentloaded'});
  await duo.locator('#guided-toggle').click();
  await duo.locator('#start-two').click();
  assert.equal(await duo.locator('.world-svg,#guided-tour').count(),0);
  await duo.locator('#reveal').click();
  const hiding=await duo.locator('#spawn-select').inputValue();
  await duo.locator('#confirm-spawn').click();
  assert.equal(await duo.locator('.world-svg,#guided-tour').count(),0);
  await duo.locator('#reveal').click();
  assert.equal(await duo.locator('#guided-tour').getAttribute('data-guided-step'),
    'enable-protractor');
  await duo.locator('#end-turn').click();
  assert.equal(await duo.locator('.world-svg,#guided-tour').count(),0);
  await duo.locator('#reveal').click();
  assert.equal(await duo.locator('#guided-tour').getAttribute('data-guided-step'),
    'monster-wait');
  assert.match(await duo.locator('#guided-tour h3').textContent(),/Monster movement/);
  assert.equal(await duo.locator('#bearing-input.guided-tour-target').count(),1);
  await duo.screenshot({path:'visual/guided-pass-and-play-monster.png',fullPage:false});
  const monsterTarget=MAPS.intro.adjacency[hiding][0];
  const bearing=formatBearing(bearingBetween(
    MAPS.intro.nodes[hiding],MAPS.intro.nodes[monsterTarget])).slice(0,3);
  await duo.locator('#bearing-input').fill(bearing);
  await duo.locator('#move-form button[type="submit"]').click();
  assert.equal(await duo.locator('.world-svg,#guided-tour').count(),0);
  await duo.locator('#reveal').click();
  assert.equal(await duo.locator('#guided-tour').getAttribute('data-guided-step'),
    'monster-moved');
  assert.equal(await duo.locator('.monster-location').count(),0);
  await duo.locator('#hud-tab-clues').click();
  assert.equal(await duo.locator('#guided-tour').getAttribute('data-guided-step'),
    'independent');
  await duo.close();
  guidedChecks.push({viewport:'multi-handoff',steps:'complete',
    privacy:'sealed',monsterGuide:'role-only'});
  await writeFile('visual/guided-walkthrough.json',JSON.stringify(guidedChecks,null,2));

  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  await writeFile('visual/four-world-consistency.json',JSON.stringify(consistencyChecks,null,2));
  console.log('Visual QA succeeded for '+report.length+' layouts and '+
    consistencyChecks.length+' finder passes');
}catch(err){
  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  await writeFile('visual/four-world-consistency.json',JSON.stringify(consistencyChecks,null,2));
  console.error(err);
  process.exitCode=1;
}finally{
  await browser.close();
}
