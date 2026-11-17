import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAPS} from '../src/map.mjs';
import {
  DEFAULT_HUNTER,FORGE_HEADS,FORGE_TORSOS,FORGE_LEGS,
  FORGE_PALETTES,FORGE_COMPLEXIONS,normalizeHunter,
  renderHunterBoardPiece,renderHunterSvg
} from '../src/hunter-forge.mjs';

const at=(raw=DEFAULT_HUNTER,options={})=>renderHunterBoardPiece(raw,{
  x:320,y:235,node:'B',...options
});

test('miniature shares every modular drawing group with Hunter Forge portraits',()=>{
  const full=renderHunterSvg(DEFAULT_HUNTER);
  const miniature=at();
  for(const label of ['data-hunter-slot="head"','data-hunter-slot="torso"',
    'data-hunter-slot="legs"','data-hunter-part-head="hood"',
    'data-hunter-part-torso="coat"','data-hunter-part-legs="boots"',
    'data-hunter-palette="moss"','data-hunter-complexion="warm"'])
    assert.ok(full.includes(label) && miniature.includes(label),label);
  assert.match(miniature,/<svg x="-25" y="-66" width="50" height="70"/);
  assert.match(miniature,/data-hunter-board-node="B"/);
  assert.match(miniature,/pointer-events="none"/);
  assert.ok(!miniature.includes('data-replay-actor='));
  assert.ok(!miniature.includes('<foreignObject'));
});

test('all Hunter Forge appearance parts and complexion choices affect the live board figure',()=>{
  const baseline=at();
  for(const [key,options] of [
    ['head',FORGE_HEADS],['torso',FORGE_TORSOS],['legs',FORGE_LEGS],
    ['palette',FORGE_PALETTES],['complexion',FORGE_COMPLEXIONS]
  ]){
    for(const option of options){
      const actual=at({...DEFAULT_HUNTER,[key]:option.id});
      assert.ok(actual.includes('data-hunter-'+
        (['head','torso','legs'].includes(key)?'part-'+key:key)+'="'+option.id+'"'));
      assert.ok(actual.includes('data-hunter-slot="head"'));
      assert.ok(actual.includes('data-hunter-slot="torso"'));
      assert.ok(actual.includes('data-hunter-slot="legs"'));
      assert.ok(actual.includes('<title>Your Hunter:'));
      if(option.id!==DEFAULT_HUNTER[key])assert.notEqual(actual,baseline);
    }
  }
});

test('board figure only interpolates allowlisted colours and strictly bounded map positions',()=>{
  assert.equal(at(DEFAULT_HUNTER,{x:-1}),'');
  assert.equal(at(DEFAULT_HUNTER,{x:1001}),'');
  assert.equal(at(DEFAULT_HUNTER,{x:Infinity}),'');
  assert.equal(at(DEFAULT_HUNTER,{y:NaN}),'');
  assert.equal(at(DEFAULT_HUNTER,{y:-12}),'');
  assert.equal(at(DEFAULT_HUNTER,{y:721}),'');
  const hostile=at({head:'<script>alert(1)</script>',torso:'armour',
    legs:'riding',palette:'crimson',complexion:'deep',malicious:'<img>'},{
    node:'"><script>alert(1)</script>',x:22,y:31,
    fromX:24,fromY:50,animate:true
  });
  assert.ok(!hostile.includes('<script>'));
  assert.ok(!hostile.includes('<img>'));
  assert.match(hostile,/data-hunter-part-head="hood"/);
  assert.match(hostile,/data-hunter-part-torso="armour"/);
  assert.match(hostile,/data-hunter-board-node=""/);
  assert.match(hostile,/data-animated="true"/);
  assert.ok(hostile.includes('type="translate"'));
  assert.deepEqual(normalizeHunter({head:'xxx'}),DEFAULT_HUNTER);
});

test('SVG animation follows only the actual old and new map location and can be disabled',()=>{
  const moving=at(DEFAULT_HUNTER,{x:410,y:510,fromX:320,fromY:235,animate:true});
  assert.match(moving,/data-animated="true"/);
  assert.match(moving,/<animateTransform[^>]*type="translate"/);
  assert.match(moving,/from="346 303"/);
  assert.match(moving,/to="436 578"/);
  const staticPiece=at(DEFAULT_HUNTER,{x:410,y:510,fromX:320,fromY:235});
  assert.match(staticPiece,/data-animated="false"/);
  assert.ok(!staticPiece.includes('<animateTransform'));
  assert.ok(!at(DEFAULT_HUNTER,{x:320,y:235,fromX:320,fromY:235,animate:true})
    .includes('<animateTransform'));
  const clamped=at(DEFAULT_HUNTER,{
    x:360,y:235,fromX:320,fromY:235,animate:true,durationMs:99999
  });
  assert.match(clamped,/dur="900ms"/);
  const quick=at(DEFAULT_HUNTER,{
    x:360,y:235,fromX:320,fromY:235,animate:true,durationMs:5
  });
  assert.match(quick,/dur="160ms"/);
});

test('miniature anchors inside the full map near northern, southern and eastern edges',()=>{
  const east=at(DEFAULT_HUNTER,{x:964,y:450});
  assert.match(east,/transform="translate\(938 518\)"/);
  const north=at(DEFAULT_HUNTER,{x:300,y:40});
  assert.match(north,/transform="translate\(326 108\)"/);
  const south=at(DEFAULT_HUNTER,{x:300,y:680});
  assert.match(south,/transform="translate\(378 672\)"/);
  assert.match(at(DEFAULT_HUNTER,{replay:true}),/data-replay-actor="hunter"/);
  for(const map of Object.values(MAPS)){
    const start=map.nodes[map.hunterStart];
    const piece=at(DEFAULT_HUNTER,{x:start.x,y:start.y,node:map.hunterStart});
    assert.match(piece,/class="hunter-board-piece"/);
  }
});

test('board rendering and successful-move animation stay in public map rendering only',()=>{
  const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
  const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
  for(const phrase of [
    'renderHunterBoardPiece(hunterAppearance,',
    'view.phase===\'hunter\' && pendingHunterMotion.to===view.hunter',
    'if(view.phase.startsWith(\'pass-\'))',
    'pendingHunterMotion={from:before,to:after}',
    'if(!searchReportOpen)pendingHunterMotion=null;',
    'replay:view.replay===true',
    'hunterPiece+',
    'pendingHunterMotion=null;'
  ])assert.ok(app.includes(phrase),phrase);
  assert.ok(!app.includes('person-symbol">✦</text>'));
  assert.match(css,/\.hunter-board-piece\{pointer-events:none/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(app,/monsterPortrait\(view\.difficulty/);
});
