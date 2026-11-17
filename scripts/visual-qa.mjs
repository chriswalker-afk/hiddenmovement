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
    assert.match(await page.locator('#monster-intro-title').textContent(),/The Eclipse Herald/);
    assert.ok(await page.locator('.monster-encounter img').evaluate(async img=>{
      await img.decode();return img.naturalWidth>200;
    }),size.name+' monster artwork failed to load');
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
    assert.equal(await page.locator('#monster-intro-title').textContent(),expectedMonster);
    assert.ok(await page.locator('.monster-encounter img').evaluate(async img=>{
      await img.decode();return img.naturalWidth>200;
    }),difficulty+' monster portrait not available from packaged site');
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
  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  console.log('Visual QA succeeded for '+report.length+' layouts');
}catch(err){
  await writeFile('visual/layout-report.json',JSON.stringify(report,null,2));
  console.error(err);
  process.exitCode=1;
}finally{
  await browser.close();
}
