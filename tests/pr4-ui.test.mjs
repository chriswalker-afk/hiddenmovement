import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY } from '../src/persistence.mjs';

test('PR4 browser flow: mission cards, safe save/resume, power usage, zoom and opaque handoffs',async()=>{
  const callbacks=new Map(),elements=new Map(),values=new Map();
  const el=id=>{
    if(!elements.has(id))elements.set(id,{
      id, value:'',checked:false,dataset:{},innerHTML:'',
      addEventListener(type,cb){callbacks.set(id+':'+type,cb);},
      focus(){}
    });
    return elements.get(id);
  };
  const html=()=>el('app').innerHTML;
  globalThis.localStorage={
    getItem:k=>values.get(k)||null,
    setItem:(k,v)=>{values.set(k,v);},
    removeItem:k=>{values.delete(k);}
  };
  globalThis.confirm=()=>true;
  globalThis.document={
    hidden:false,
    getElementById:el,
    querySelectorAll:selector=>{
      const match=/^\[data-([a-z-]+)\]$/.exec(selector);
      if(!match)return [];
      const prop=match[1].replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
      const attr='data-'+match[1];
      return [...html().matchAll(new RegExp(attr+'="([^"]+)"','g'))].map(m=>{
        const item=el(attr+'-'+m[1]);item.dataset[prop]=m[1];return item;
      });
    },
    addEventListener:(type,cb)=>callbacks.set('document:'+type,cb)
  };
  const click=id=>{
    const fn=callbacks.get(id+':click');
    assert.equal(typeof fn,'function','No click handler for '+id);
    fn({preventDefault(){}});
  };
  await import('../src/app.mjs');

  assert.match(html(),/EXPLORE STORY MISSIONS/);
  assert.match(html(),/home-art/);
  assert.match(html(),/SHADOW BEARINGS/);
  click('scenario-select');
  assert.match(html(),/The Last Gate/);
  assert.match(html(),/Lanternfall/);
  click('data-mission-solo-escape');
  assert.match(html(),/SOLO HUNT/);
  assert.match(html(),/THE LAST GATE/);
  click('data-difficulty-apprentice');
  assert.match(html(),/theme-woodland/);
  assert.match(html(),/STORY MISSION/);
  assert.match(html(),/SIGNAL LANTERN/);
  assert.match(html(),/GATE/);
  assert.doesNotMatch(html(),/Your hidden trail/);
  assert.match(html(),/map-zoom-in/);
  click('map-zoom-in');
  assert.match(html(),/125%/);
  assert.match(html(),/width:125%/);
  click('use-lantern');
  assert.match(html(),/SIGNAL LANTERN/);
  assert.match(html(),/1 MOVE LEFT/);
  assert.equal(values.has(STORAGE_KEY),true,'Active solo hunt auto-saved');
  const notes=el('field-notes');
  notes.value='I should block the bridge';
  callbacks.get('field-notes:input')({target:{value:notes.value}});
  click('save-exit');
  assert.match(html(),/RESUME SAFELY/);
  assert.doesNotMatch(html(),/I should block the bridge/);
  assert.doesNotMatch(html(),/world-svg/);
  click('resume-hunt');
  assert.match(html(),/I should block the bridge/);
  assert.match(html(),/THE LAST GATE/);
  assert.doesNotMatch(html(),/Your hidden trail/);

  click('brand-link');
  assert.match(html(),/EXPLORE STORY MISSIONS/);
  click('scenario-select');
  click('data-mission-multi-beacons');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  click('reveal');
  assert.match(html(),/Choose your hiding place/);
  assert.match(html(),/BEACON/);
  click('confirm-spawn');
  assert.match(html(),/Pass this device to the hunter and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  click('reveal');
  assert.match(html(),/Lanternfall/);
  click('save-exit');
  assert.match(html(),/RESUME SAFELY/);
  assert.doesNotMatch(html(),/world-svg/);
  click('resume-hunt');
  assert.match(html(),/Pass this device to the hunter and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  assert.doesNotMatch(html(),/PRIVATE INFORMATION/);
  click('reveal');
  click('end-turn');
  assert.match(html(),/Pass this device to the monster and look away/);
  click('reveal');
  assert.match(html(),/USE THE VEIL/);
  click('save-exit');
  click('resume-hunt');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  assert.doesNotMatch(html(),/PRIVATE INFORMATION/);
  click('reveal');
  assert.match(html(),/Your hidden trail/);
  document.hidden=true;
  callbacks.get('document:visibilitychange')();
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
});
