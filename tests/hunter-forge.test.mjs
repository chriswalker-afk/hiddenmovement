import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  DEFAULT_HUNTER, HUNTER_STORAGE_KEY, FORGE_HEADS, FORGE_TORSOS,
  FORGE_LEGS, FORGE_PALETTES, FORGE_COMPLEXIONS, FORGE_CHOICES,
  normalizeHunter, loadHunter, saveHunter, randomHunter, renderHunterSvg
} from '../src/hunter-forge.mjs';

const memoryStore=()=>{
  const values=new Map();
  return {
    values,
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>{values.set(key,String(value));}
  };
};

test('Hunter Forge provides four genuinely selectable components and six coordinated palettes',()=>{
  assert.equal(FORGE_HEADS.length,4);
  assert.equal(FORGE_TORSOS.length,4);
  assert.equal(FORGE_LEGS.length,4);
  assert.equal(FORGE_PALETTES.length,6);
  assert.equal(FORGE_COMPLEXIONS.length,4);
  for(const options of Object.values(FORGE_CHOICES)){
    assert.equal(new Set(options.map(x=>x.id)).size,options.length);
    assert.ok(options.every(x=>x.id&&x.label));
  }
  assert.equal(FORGE_HEADS.length*FORGE_TORSOS.length*
    FORGE_LEGS.length*FORGE_PALETTES.length,384);
  for(const p of FORGE_PALETTES)
    for(const key of ['cloth','dark','light','leather','metal','accent'])
      assert.match(p[key],/^#[0-9a-f]{6}$/i);
});

test('stored appearance is strictly validated against known modular options',()=>{
  assert.deepEqual(normalizeHunter(null),DEFAULT_HUNTER);
  assert.deepEqual(normalizeHunter(['brim','armour']),DEFAULT_HUNTER);
  const attack={head:'"><script>alert(1)</script>',
    torso:'armour',legs:'greaves',palette:'midnight',complexion:'deep',
    hiddenMonster:'do-not-copy',unknown:'test'};
  const actual=normalizeHunter(attack);
  assert.deepEqual(actual,{
    head:'hood',torso:'armour',legs:'greaves',palette:'midnight',complexion:'deep'
  });
  assert.ok(!Object.hasOwn(actual,'hiddenMonster'));
  assert.ok(!Object.hasOwn(actual,'unknown'));
  const html=renderHunterSvg(attack);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('hiddenMonster'));
  assert.match(html,/data-hunter-part-torso="armour"/);
});

test('save and reload survive a browser session without altering existing game saves',()=>{
  const store=memoryStore();
  const chosen={head:'brim',torso:'cloak',legs:'gaiters',palette:'oxblood',complexion:'olive'};
  store.setItem('shadow-bearings.save.v1','important-existing-data');
  assert.equal(saveHunter(store,chosen),true);
  assert.deepEqual(loadHunter(store),chosen);
  assert.deepEqual(JSON.parse(store.getItem(HUNTER_STORAGE_KEY)),chosen);
  assert.equal(store.getItem('shadow-bearings.save.v1'),'important-existing-data');
  assert.deepEqual(loadHunter(memoryStore()),DEFAULT_HUNTER);
});

test('corrupt, blocked and hostile device storage fail safely',()=>{
  const store=memoryStore();
  store.setItem(HUNTER_STORAGE_KEY,'not JSON');
  assert.deepEqual(loadHunter(store),DEFAULT_HUNTER);
  store.setItem(HUNTER_STORAGE_KEY,JSON.stringify({head:'helm',torso:'fake'}));
  assert.deepEqual(loadHunter(store),{...DEFAULT_HUNTER,head:'helm'});
  const blocked={
    getItem:()=>{throw new Error('storage disabled');},
    setItem:()=>{throw new Error('quota exceeded');}
  };
  assert.deepEqual(loadHunter(blocked),DEFAULT_HUNTER);
  assert.equal(saveHunter(blocked,DEFAULT_HUNTER),false);
  assert.equal(saveHunter(null,DEFAULT_HUNTER),false);
});

test('randomise works even with deterministic or out-of-range RNG input',()=>{
  assert.deepEqual(randomHunter(()=>0),{
    head:'hood',torso:'coat',legs:'boots',palette:'moss',complexion:'warm'
  });
  assert.deepEqual(randomHunter(()=>1),{
    head:'bare',torso:'armour',legs:'riding',palette:'slate',complexion:'fair'
  });
  assert.deepEqual(randomHunter(()=>NaN),DEFAULT_HUNTER);
  assert.deepEqual(randomHunter(()=>-100),DEFAULT_HUNTER);
});

test('all individual head, torso and leg variants produce a real layered drawing',()=>{
  const defaults=renderHunterSvg(DEFAULT_HUNTER);
  for(const [slot,choices] of Object.entries({
    head:FORGE_HEADS,torso:FORGE_TORSOS,legs:FORGE_LEGS
  })){
    for(const option of choices){
      const html=renderHunterSvg({...DEFAULT_HUNTER,[slot]:option.id});
      assert.match(html,/<svg[^>]*role="img"/);
      assert.ok(html.includes('data-hunter-slot="'+slot+'"'));
      assert.ok(html.includes('data-hunter-part-'+slot+'="'+option.id+'"'));
      assert.match(html,new RegExp('data-style="'+option.id+'"'));
      if(option.id!==DEFAULT_HUNTER[slot])assert.notEqual(html,defaults);
    }
  }
});

test('palette and complexion recolour the hunter while bust keeps identical components',()=>{
  const base={head:'brim',torso:'armour',legs:'greaves',palette:'moss',complexion:'warm'};
  const full=renderHunterSvg(base);
  const bust=renderHunterSvg(base,{bust:true,className:'small-portrait'});
  assert.match(bust,/viewBox="0 65 320 258"/);
  assert.match(bust,/class="small-portrait"/);
  assert.match(full,/data-hunter-view="figure"/);
  for(const key of ['data-hunter-part-head="brim"','data-hunter-part-torso="armour"',
    'data-hunter-part-legs="greaves"','data-hunter-palette="moss"'])
    assert.ok(bust.includes(key));
  assert.ok(!full.includes('<image'));
  for(const option of FORGE_PALETTES){
    const html=renderHunterSvg({...base,palette:option.id});
    assert.match(html,new RegExp('data-hunter-palette="'+option.id+'"'));
    assert.ok(html.includes(option.cloth));
  }
  for(const option of FORGE_COMPLEXIONS){
    const html=renderHunterSvg({...base,complexion:option.id});
    assert.match(html,new RegExp('data-hunter-complexion="'+option.id+'"'));
    assert.ok(html.includes(option.skin));
  }
});

test('PR11 wires the live character into home, difficulty, briefing, tutorial and HUD, but leaves board tokens for PR12',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  const pkg=readFileSync(new URL('../package.json',import.meta.url),'utf8');
  for(const identifier of ['forgeLaunchHtml','forgeHtml','bindForge','forge-open',
    'forge-save','forge-cancel','forge-randomise','forge-reset','forge-session-button',
    'briefing-hunter-illustration','hud-hunter-avatar','guide-character-art'])
    assert.ok(app.includes(identifier),identifier+' should be wired up');
  assert.match(app,/renderHunterSvg\(hunterAppearance,\{className:'briefing-hunter-illustration'\}\)/);
  assert.match(app,/renderHunterSvg\(hunterAppearance,\{bust:true,className:'hud-hunter-art'\}\)/);
  assert.match(app,/if\(view.phase\.startsWith\('pass-'\)\)/);
  assert.match(app,/mount\.innerHTML=handoffHtml\(view\.phase\)/);
  assert.match(css,/\.forge-workspace\{/);
  assert.match(css,/\.forge-option\[aria-pressed=true\]/);
  assert.match(pkg,/src\/hunter-forge\.mjs/);
});
