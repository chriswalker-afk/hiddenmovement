import test from 'node:test';
import assert from 'node:assert/strict';

test('browser UI: solo selection, hidden AI turns and sealed two-player handoffs',async()=>{
  const callbacks = new Map();
  const elements = new Map();
  const elt = id => {
    if (!elements.has(id)) {
      elements.set(id,{
        id,
        value:'',
        dataset: {},
        innerHTML:'',
        addEventListener(type,listener){callbacks.set(id+':'+type,listener);},
        focus(){}
      });
    }
    return elements.get(id);
  };
  const difficulties = ['intro','apprentice','tracker','expert'];
  globalThis.document = {
    hidden: false,
    getElementById: id => elt(id),
    querySelectorAll: selector => selector==='[data-difficulty]' ?
      difficulties.map(id=>{const e=elt('difficulty-'+id);e.dataset.difficulty=id;return e;}) : [],
    addEventListener(type,listener){callbacks.set('document:'+type,listener);}
  };
  globalThis.confirm = () => true;
  const click = id => {
    const callback=callbacks.get(id+':click');
    assert.equal(typeof callback,'function','Missing '+id+' click event');
    callback();
  };
  const html = () => elt('app').innerHTML;
  await import('../src/app.mjs');

  assert.match(html(),/SELECT DIFFICULTY/);
  assert.match(html(),/PASS &amp; PLAY/);
  click('start-solo-select');
  assert.match(html(),/FOUR PATHS INTO/);
  for(const difficulty of difficulties)
    assert.match(html(),new RegExp('data-difficulty="'+difficulty+'"'));
  click('difficulty-expert');
  assert.match(html(),/SOLO HUNT/);
  assert.match(html(),/THE ECLIPSE MARCHES/);
  assert.match(html(),/theme-eclipse/);
  assert.match(html(),/LOCATION INDEX/);
  assert.match(html(),/WATCHER SIGHTING/);
  assert.doesNotMatch(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/MONSTER ONLY/);
  assert.doesNotMatch(html(),/Your hidden trail/);
  const before=html();
  click('end-turn');
  assert.match(html(),/SOLO HUNT/);
  assert.match(html(),/2 <span>\/ 21/);
  assert.notEqual(html(),before,'Solo turn should advance without Monster role UI');
  assert.doesNotMatch(html(),/MONSTER ONLY/);
  assert.doesNotMatch(html(),/Pass this device/);

  // Incorrect bearings leave the Hunter safely on their current location.
  elt('bearing-input').value='888';
  const submit=callbacks.get('move-form:submit');
  assert.equal(typeof submit,'function');
  submit({preventDefault(){}});
  assert.match(html(),/No connected route is within/);

  // The original pass-and-play mode must still offer a fully sealed handoff.
  click('brand-link');
  assert.match(html(),/PASS &amp; PLAY/);
  click('start-two');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  assert.doesNotMatch(html(),/Watchtower/);
  click('reveal');
  assert.match(html(),/Choose your hiding place/);
  click('confirm-spawn');
  assert.match(html(),/Pass this device to the hunter and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  click('reveal');
  assert.match(html(),/Follow the trail/);
  click('end-turn');
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
  click('reveal');
  assert.match(html(),/Your hidden trail/);
  document.hidden = true;
  callbacks.get('document:visibilitychange')();
  assert.match(html(),/Pass this device to the monster and look away/);
  assert.doesNotMatch(html(),/world-svg/);
});
