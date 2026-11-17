import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAPS } from '../src/map.mjs';

const stylesheet = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const cssWithoutComments = stylesheet.replace(/\/\*[\s\S]*?\*\//g, '');
const cssRules = [...cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

test('map theme CSS cannot repaint a foreground SVG rectangle over roads and nodes', () => {
  const opaqueDirectRects = cssRules
    .filter(([, selector, body]) =>
      selector.includes('.world-svg') &&
      />\s*rect(?::first-of-type)?\b/.test(selector) &&
      /\bfill\s*:/.test(body))
    .map(([, selector]) => selector.trim());
  assert.deepEqual(opaqueDirectRects, [],
    'Direct SVG <rect> fills can cover the roads and nodes after the scenery layer');
});

test('all four map difficulties include visible route/node markup above scenery', async () => {
  const callbacks = new Map();
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      id, value: '', innerHTML: '', dataset: {}, checked: false,
      addEventListener(type, callback) { callbacks.set(id + ':' + type, callback); },
      focus() {}
    });
    return elements.get(id);
  };
  const html = () => el('app').innerHTML;
  globalThis.localStorage = {
    getItem: () => null,
    setItem() {},
    removeItem() {}
  };
  globalThis.document = {
    hidden: false,
    getElementById: el,
    querySelectorAll(selector) {
      if (selector === '[data-difficulty]')
        return Object.keys(MAPS).map(id => {
          const element = el('difficulty-' + id);
          element.dataset.difficulty = id;
          return element;
        });
      return [];
    },
    addEventListener(type, callback) { callbacks.set('document:' + type, callback); }
  };
  globalThis.confirm = () => true;
  const click = id => {
    const handler = callbacks.get(id + ':click');
    assert.equal(typeof handler, 'function', 'Missing click for ' + id);
    handler({ preventDefault() {} });
  };

  await import('../src/app.mjs');

  for (const [difficulty, map] of Object.entries(MAPS)) {
    if (difficulty !== 'intro') click('start-solo-select');
    else click('start-solo-select');
    click('difficulty-' + difficulty);

    const markup = html();
    assert.match(markup, new RegExp('class="world-svg theme-' + map.theme + '"'));
    assert.match(markup, new RegExp('class="illustrated-scenery theme-scene-' + map.theme + '"'));
    assert.match(markup, /<g class="roads">/);
    assert.match(markup, /<g class="nodes">/);
    assert.match(markup, /<g class="map-finish" pointer-events="none"/);

    const renderedEdges = [...markup.matchAll(/class="road-top"/g)].length;
    const renderedNodes = [...markup.matchAll(/data-node-note="[^"]+"/g)].length;
    assert.equal(renderedEdges, map.edges.length, difficulty + ' must draw all connected roads');
    assert.equal(renderedNodes, Object.keys(map.nodes).length,
      difficulty + ' must draw all selectable locations');

    const sceneryPosition = markup.indexOf('<g class="illustrated-scenery');
    const roadsPosition = markup.indexOf('<g class="roads">');
    const nodesPosition = markup.indexOf('<g class="nodes">');
    const finalDecorationPosition = markup.indexOf('<g class="map-finish"');
    assert.ok(sceneryPosition < roadsPosition &&
      roadsPosition < nodesPosition && nodesPosition < finalDecorationPosition,
      difficulty + ' must paint scenery first, roads and nodes next, then transparent decoration');

    // The very last SVG overlay is non-opaque: it may add texture, not a fill.
    const end = markup.slice(finalDecorationPosition, markup.indexOf('</svg>', finalDecorationPosition));
    assert.match(end, /fill="none"/);
    assert.match(end, /fill="url\(#moor-grain\)"/);
    assert.doesNotMatch(end, /fill="#[\dA-Fa-f]{3,8}"/);

    click('brand-link');
  }
});
