import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, checkLesson } from '../src/tutorial.mjs';

test('four short bearings exercises teach clockwise north, reverse bearings and north wrap', () => {
  assert.deepEqual(LESSONS.map(x=>x.id),['clockwise','reverse','wording','wrap']);
  assert.deepEqual(LESSONS.map(x=>x.answer),[90,245,60,0]);
  assert.deepEqual(LESSONS.map(x=>checkLesson(LESSONS.indexOf(x),
    String(x.answer).padStart(3,'0')).correct),[true,true,true,true]);
  assert.equal(checkLesson(0,'90').correct,false);
  assert.equal(checkLesson(1,'065').correct,false);
  assert.equal(checkLesson(2,'060').correct,true);
  assert.equal(checkLesson(3,'360°').correct,true);
  assert.match(checkLesson(0,'090').message,/clockwise/);
  assert.match(checkLesson(2,'060').message,/Reverse/);
});

test('interactive browser experience: tutorial, evidence, map markings, maths and handoff security', async () => {
  const callbacks=new Map(),elements=new Map();
  const el=(id)=>{
    if(!elements.has(id))elements.set(id,{
      id,innerHTML:'',value:'',dataset:{},checked:true,
      addEventListener(type,callback){callbacks.set(id+':'+type,callback);},
      focus(){}
    });
    return elements.get(id);
  };
  const html=()=>el('app').innerHTML;
  const byData=(selector,attribute,key)=>{
    if(selector!==attribute)return [];
    return [...html().matchAll(new RegExp('data-'+key+'="([^"]+)"','g'))].map(match=>{
      const node=el(key+':'+match[1]);
      const normalized=key.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());
      node.dataset[normalized]=match[1];
      return node;
    });
  };
  globalThis.document={
    hidden:false,
    getElementById:el,
    querySelectorAll:selector=>{
      if(selector==='[data-hud-tab]') return [...html().matchAll(/data-hud-tab="([^"]+)"/g)].map(match=>{
        const node=el('hud-tab-'+match[1]);node.dataset.hudTab=match[1];return node;});
      if(selector==='[data-difficulty]') return ['intro','apprentice','tracker','expert'].map(id=>{
        const x=el('difficulty-'+id);x.dataset.difficulty=id;return x;});
      return [...byData(selector,'[data-node-note]','node-note'),
        ...byData(selector,'[data-clue-toggle]','clue-toggle'),
        ...byData(selector,'[data-spawn]','spawn')];
    },
    addEventListener(type,cb){callbacks.set('document:'+type,cb);}
  };
  globalThis.confirm=()=>true;
  const click=(id)=>{
    const fn=callbacks.get(id+':click');
    assert.equal(typeof fn,'function','Missing click '+id);
    fn({preventDefault(){}});
  };
  const submit=id=>{
    const fn=callbacks.get(id+':submit');
    assert.equal(typeof fn,'function','Missing submit '+id);
    fn({preventDefault(){}});
  };
  await import('../src/app.mjs');
  assert.match(html(),/INTERACTIVE BEARINGS TRAINING/);
  click('open-tutorial');
  assert.match(html(),/HOW TO HUNT/);
  assert.match(html(),/You are the Monster Hunter/);
  assert.doesNotMatch(html(),/world-svg/);
  click('guide-skip');
  assert.match(html(),/BEARINGS FIELD TRAINING/);
  el('lesson-answer').value='090';
  submit('lesson-form');
  assert.match(html(),/Correct: 090°/);
  click('lesson-next');
  assert.match(html(),/Reverse bearings/);
  el('lesson-answer').value='245';
  submit('lesson-form');
  assert.match(html(),/Correct: 245°/);
  click('tutorial-close');
  assert.match(html(),/SOLO HUNT/);

  click('guided-toggle'); // Opt into manual clue plotting during teaching; textual clues are always present.
  click('start-solo-select');
  click('difficulty-intro');
  assert.match(html(),/WATCHER SIGHTING/);
  click('hud-tab-stats');
  assert.match(html(),/MATHS FEEDBACK/);
  click('hud-tab-notes');
  assert.match(html(),/YOUR OWN NOTES/);
  click('hud-tab-clues');
  assert.match(html(),/COMBINE CLUES ON THE MAP/);
  assert.doesNotMatch(html(),/Your hidden trail/);

  click('plot-toggle');
  assert.match(html(),/possible locations/);
  assert.match(html(),/INCLUDE IN DEDUCTION/);
  const toggle=callbacks.get('clue-toggle:sighting-0:change');
  assert.equal(typeof toggle,'function','Clue selection checkbox must be interactive');
  toggle({target:{checked:false}});
  assert.match(html(),/Select a confirmed bearing or location clue/);
  const marker=el('node-note:A');
  assert.equal(typeof callbacks.get(marker.id+':click'),'function');
  click(marker.id);
  assert.match(html(),/marked-possible/);
  click(marker.id);
  assert.match(html(),/marked-ruled/);
  click('hud-tab-notes');
  click('clear-marks');
  assert.doesNotMatch(html(),/marked-ruled/);

  el('field-notes').value='Try the northern crossing';
  const onInput=callbacks.get('field-notes:input');
  assert.equal(typeof onInput,'function');
  onInput({target:{value:'Try the northern crossing'}});
  click('end-turn');
  assert.match(html(),/Try the northern crossing/);
  assert.match(html(),/2 <span>\/ 13/);
  assert.doesNotMatch(html(),/Your hidden trail/);

  click('brand-link');
  click('start-two');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/Try the northern crossing/);
  assert.doesNotMatch(html(),/world-svg/);
  click('reveal');
  assert.match(html(),/Choose your hiding place/);
  click('confirm-spawn');
  assert.match(html(),/Pass this device to the hunter and look away/);
  click('reveal');
  assert.match(html(),/Follow the trail/);
  click('open-tutorial-game');
  assert.match(html(),/HOW TO HUNT/);
  assert.match(html(),/You are the Monster Hunter/);
  document.hidden=true;
  callbacks.get('document:visibilitychange')();
  assert.match(html(),/Pass this device to the hunter and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  assert.doesNotMatch(html(),/YOUR OWN NOTES/);
});
