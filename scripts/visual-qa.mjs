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
    const decks=await page.locator('.river-bridges .river-bridge').count();
    if(['tracker','expert'].includes(difficulty))
      assert.ok(decks>=4 && decks<=18,
        difficulty+' must mark crossings as bridges instead of floating roads');
    else assert.equal(decks,0,
      'Other maps should not acquire accidental river bridge markers');
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
  }
  await page.close();

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

  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  console.log('Visual QA succeeded for '+report.length+' layouts');
}catch(err){
  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  console.error(err);
  process.exitCode=1;
}finally{
  await browser.close();
}
