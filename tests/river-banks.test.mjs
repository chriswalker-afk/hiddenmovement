import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, validateMap } from '../src/map.mjs';
import { WATERWAYS, riverCenterlineDistance, waterwayPath, riverRoadCrossings } from '../src/waterways.mjs';
import { renderScenery } from '../src/scenery.mjs';
import { angularDifference, bearingBetween } from '../src/geometry.mjs';

const AFFECTED={
  tracker:['T06','T07','T14','T15','T16','T17','T20'],
  expert:['E22','E23','E26','E27','E31']
};

test('all 62 tracker and expert locations are safely on land, not on a painted waterway',()=>{
  let checked=0;
  for(const [difficulty,theme] of [['tracker','marsh'],['expert','eclipse']]){
    const map=MAPS[difficulty];
    for(const node of Object.values(map.nodes)){
      for(const channel of WATERWAYS[theme]) {
        // wave() paints a dark bank underlay at (width + 16), plus the visible
        // r=19 game node: require 10 world units of additional free space.
        const clearance=riverCenterlineDistance(node,channel)-
          (channel.width+16)/2-19;
        assert.ok(clearance>=10,
          difficulty+' '+node.id+' '+node.name+
          ' is too close to '+channel.id+'; clearance '+clearance.toFixed(1));
        checked++;
      }
    }
    for(const id of AFFECTED[difficulty])
      assert.ok(map.nodes[id],difficulty+' should retain '+id+' rather than silently deleting it');
    assert.equal(validateMap(map).length,0,
      difficulty+' illegal bearings after riverside repositioning: '+validateMap(map).join('; '));
  }
  assert.equal(checked,26*2+36,'Every node/channel pair checked');
});

test('the river shape used in tests is the actual illustrated path',()=>{
  for(const theme of ['marsh','eclipse']){
    const artwork=renderScenery(theme);
    for(const channel of WATERWAYS[theme]){
      const path=waterwayPath(channel);
      assert.ok(path.startsWith('M'));
      assert.equal((path.match(/C/g)||[]).length,channel.segments.length);
      assert.ok(artwork.includes('d="'+path+'"'),
        theme+' must paint the same path measured by the water clearance checks');
      assert.ok(artwork.includes('stroke-width="'+channel.width+'"'));
    }
  }
});

test('riverside node shifts do not delete roads, introduce crossings or duplicate locations',()=>{
  for(const [difficulty,expectedNodes,expectedEdges] of [
    ['tracker',26,46],['expert',36,65]
  ]){
    const map=MAPS[difficulty];
    const nodes=Object.values(map.nodes);
    assert.equal(nodes.length,expectedNodes);
    assert.equal(map.edges.length,expectedEdges);
    assert.equal(new Set(nodes.map(n=>n.name)).size,expectedNodes);
    const orientation=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    for(let i=0;i<map.edges.length;i++){
      const [a,b]=map.edges[i];
      const n=map.nodes[a],other=map.nodes[b];
      assert.ok(Number.isFinite(bearingBetween(n,other)));
      for(let j=i+1;j<map.edges.length;j++){
        const [c,d]=map.edges[j];
        if(new Set([a,b,c,d]).size<4)continue;
        const cNode=map.nodes[c],dNode=map.nodes[d];
        const crosses=orientation(n,other,cNode)*orientation(n,other,dNode)<0 &&
          orientation(cNode,dNode,n)*orientation(cNode,dNode,other)<0;
        assert.equal(crosses,false,
          difficulty+' road '+a+'-'+b+' unexpectedly crosses '+c+'-'+d);
      }
    }
    for(const n of nodes){
      const routes=map.adjacency[n.id].map(id=>bearingBetween(n,map.nodes[id]));
      for(let i=0;i<routes.length;i++)
        for(let j=i+1;j<routes.length;j++)
          assert.ok(angularDifference(routes[i],routes[j])>=12,
            difficulty+' has an ambiguous bearing from '+n.name);
    }
  }
});


test('every drawn water crossing is a bridge on an existing road, never an extra game route',()=>{
  for(const [difficulty,theme] of [['tracker','marsh'],['expert','eclipse']]){
    const map=MAPS[difficulty];
    const before=map.edges.length;
    const bridges=riverRoadCrossings(map);
    assert.ok(bridges.length>=4 && bridges.length<=18,
      difficulty+' should mark a small number of intentional crossings');
    const seen=new Set();
    for(const bridge of bridges){
      assert.ok(map.edges.some(([a,b])=>a===bridge.from&&b===bridge.to),
        difficulty+' bridge is not supported by a real connected road');
      assert.ok(WATERWAYS[theme].some(ch=>ch.id===bridge.channel));
      assert.ok(Number.isFinite(bridge.x)&&Number.isFinite(bridge.y)&&
        Number.isFinite(bridge.angle));
      assert.ok(bridge.span>30&&bridge.span<=135);
      assert.ok(bridge.x>=40&&bridge.x<=960&&bridge.y>=80&&bridge.y<=670);
      const key=bridge.from+'-'+bridge.to+'/'+bridge.channel;
      assert.ok(!seen.has(key),difficulty+' repeated a bridge on '+key);
      seen.add(key);
    }
    assert.equal(map.edges.length,before,'bridge decals must not change graph topology');
  }
});
