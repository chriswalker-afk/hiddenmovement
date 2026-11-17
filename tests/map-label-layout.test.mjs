import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, validateMap } from '../src/map.mjs';
import { angularDifference, bearingBetween } from '../src/geometry.mjs';

const EXPECTED_NODES={intro:14,apprentice:18,tracker:26,expert:36};
const EXPECTED_EDGES={intro:29,apprentice:33,tracker:46,expert:65};

test('all four maps have unique, meaningful names for every node',()=>{
  for(const [id,map] of Object.entries(MAPS)){
    const nodes=Object.values(map.nodes);
    assert.equal(nodes.length,EXPECTED_NODES[id]);
    const names=nodes.map(n=>n.name);
    assert.ok(names.every(n=>typeof n==='string'&&n.trim().length>=4),
      id+' must not contain empty or placeholder names');
    assert.equal(new Set(names).size,names.length,id+' duplicated location names');
    if(id!=='intro') {
      assert.ok(nodes.every(n=>/^\d{2}$/.test(n.label)),id+' location index must stay two-digit');
      assert.ok(nodes.every(n=>n.name!==n.label),id+' numbers are not node names');
    }
  }
});

test('every generated map fills the same practical board footprint as Intro',()=>{
  for(const id of ['apprentice','tracker','expert']){
    const nodes=Object.values(MAPS[id].nodes);
    const x=nodes.map(n=>n.x),y=nodes.map(n=>n.y);
    const x1=Math.min(...x),x2=Math.max(...x);
    const y1=Math.min(...y),y2=Math.max(...y);
    assert.ok(x1>=90 && x1<=105,id+' should reach the left map edge');
    assert.ok(x2>=895 && x2<=910,id+' should reach the right map edge');
    assert.ok(y1>=90 && y1<=105,id+' should reach the top map edge');
    assert.ok(y2>=630 && y2<=650,id+' should reach the lower map edge');
    assert.ok(x2-x1>=790,id+' network does not fill enough of the width');
    assert.ok(y2-y1>=530,id+' network does not fill enough of the height');
    assert.ok(nodes.every(n=>n.x>=60&&n.x<=940&&n.y>=65&&n.y<=660));
  }
});

test('rebalancing geometry retains the road topology and safe bearings',()=>{
  for(const [id,map] of Object.entries(MAPS)){
    assert.equal(map.edges.length,EXPECTED_EDGES[id],id+' topology changed');
    assert.equal(validateMap(map).length,0,
      id+': '+validateMap(map).join('; '));
    for(const [a,b] of map.edges) {
      assert.ok(map.adjacency[a].includes(b),id+' missing edge '+a+'-'+b);
      assert.ok(map.adjacency[b].includes(a),id+' missing reverse edge '+a+'-'+b);
      assert.ok(Number.isFinite(bearingBetween(map.nodes[a],map.nodes[b])));
    }
    // Even after rescaling, a player can distinguish all outgoing exits.
    for(const node of Object.values(map.nodes)){
      const angles=map.adjacency[node.id].map(target=>bearingBetween(node,map.nodes[target]));
      for(let i=0;i<angles.length;i++)
        for(let j=i+1;j<angles.length;j++)
          assert.ok(angularDifference(angles[i],angles[j])>=12,
            id+' has indistinguishable routes at '+node.id);
    }
  }
});

test('rebalanced maps retain non-crossing roads',()=>{
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const crosses=(a,b,c,d)=>{
    const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);
    return abC*abD<0 && cdA*cdB<0;
  };
  for(const [id,map] of Object.entries(MAPS)){
    const e=map.edges;
    for(let i=0;i<e.length;i++)
      for(let j=i+1;j<e.length;j++){
        const [a,b]=e[i],[c,d]=e[j];
        if(new Set([a,b,c,d]).size<4)continue;
        assert.equal(crosses(map.nodes[a],map.nodes[b],map.nodes[c],map.nodes[d]),false,
          id+' unexpected crossing between '+a+'-'+b+' and '+c+'-'+d);
      }
  }
});
