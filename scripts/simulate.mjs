/**
 * Reproducible playtest baseline:
 * a simple Hunter bot that sees ONLY the role-specific public view.
 *
 * Run: npm run simulate
 * Optional: SIM_GAMES=200 npm run simulate
 *
 * This is NOT a proof of balanced difficulty. It helps catch unwinnable
 * maps and gives a repeatable reference before human classroom playtests.
 */
import { DIFFICULTIES, createGame, beginGame, hunterMove, endHunterTurn, viewForCurrentScreen } from '../src/engine.mjs';
import { MAPS } from '../src/map.mjs';
import { bearingBetween, angularDifference, graphDistance, formatBearing } from '../src/geometry.mjs';

const number = Math.max(5, Math.min(500, Number(process.env.SIM_GAMES) || 60));

function chasePublicEvidence(view, map, visits, seed) {
  const nodes=Object.keys(map.nodes);
  const latest=view.clues[0] || null;
  const age=latest? Math.max(0,view.round-1-latest.observedRound):Infinity;
  let possible;
  if(latest){
    const original=nodes.filter(id=>{
      if(id===latest.place)return false;
      const bearing=bearingBetween(map.nodes[latest.place],map.nodes[id]);
      return angularDifference(bearing,latest.sectorCenter) <= latest.halfWidth+1e-6;
    });
    // Allow the target to have travelled since the clue was observed.
    possible=nodes.filter(id=>original.some(old=>graphDistance(old,id,map)<=age));
  }
  if(!possible?.length) possible=nodes;
  const from=view.hunter;
  const targets=possible.filter(id=>id!==from);
  if(!targets.length) return map.adjacency[from][0];
  let bestScore=Infinity, target=targets[0];
  for(const id of targets){
    const score=graphDistance(from,id,map) + (visits[id]||0)*.65 +
      ((seed+id.length*11)%17)*.008;
    if(score<bestScore){bestScore=score;target=id;}
  }
  const moves=map.adjacency[from];
  return moves.map(id=>({
    id,
    score:graphDistance(id,target,map)*3+(visits[id]||0)*.48+
      ((seed+id.charCodeAt(0)*7)%11)*.007
  })).sort((a,b)=>a.score-b.score)[0].id;
}

function simulate(difficulty,seed){
  const game=createGame({mode:'solo',difficulty,seed});
  beginGame(game);
  const map=MAPS[difficulty], visits={[game.hunter]:1};
  let hunterMoves=0;
  while(game.phase==='hunter'){
    for(let step=0;step<game.config.hunterSteps && game.phase==='hunter';step++){
      const view=viewForCurrentScreen(game);
      const next=chasePublicEvidence(view,map,visits,seed+game.round*9+step);
      const bearing=bearingBetween(map.nodes[view.hunter],map.nodes[next]);
      const result=hunterMove(game,formatBearing(bearing));
      if(!result.ok)throw Error(difficulty+': illegal hunter-bot move '+result.message);
      hunterMoves++;
      visits[next]=(visits[next]||0)+1;
    }
    if(game.phase==='hunter')endHunterTurn(game);
  }
  return {
    win:game.winner==='hunter',
    rounds:game.round,
    moves:hunterMoves,
    traces:game.clues.filter(c=>c.type==='trace').length,
    sightings:game.clues.filter(c=>c.type==='sighting').length
  };
}

console.log('Shadow Bearings · solo benchmark (public-evidence baseline, not human performance)');
console.log('Seeds per difficulty:',number);
console.log('Difficulty  Nodes  Hunter wins  Avg rounds  Avg traces  Avg sightings');
for(const difficulty of Object.keys(DIFFICULTIES)){
  const results=Array.from({length:number},(_,i)=>simulate(difficulty,1000+i*337));
  const average=k=>(results.reduce((sum,x)=>sum+x[k],0)/results.length).toFixed(1);
  const wins=results.filter(x=>x.win).length;
  console.log(
    difficulty.padEnd(11),
    String(Object.keys(MAPS[difficulty].nodes).length).padEnd(6),
    String(wins+'/'+number).padEnd(12),
    average('rounds').padEnd(11),
    average('traces').padEnd(11),
    average('sightings')
  );
}
