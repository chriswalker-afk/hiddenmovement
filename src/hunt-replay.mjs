/**
 * Post-game replay. Reconstruct BOTH paths from recorded, ordered gameplay
 * events; never guess a hidden move from a clue or infer its destination.
 *
 * This module refuses to make replay frames from a live Hunter/Monster view.
 * The caller receives the chronological event log only once game.phase='over'.
 * Frame paths and mission-objective changes are prefixes, not full future
 * information, so students can discover the chase in the correct order.
 */
export function buildHuntReplay(view,map){
  if(view?.phase!=='over' || !map?.nodes || !map?.hunterStart ||
      !Array.isArray(view.trail) || !Array.isArray(view.replayHistory))return [];
  const monsterStart=view.trail[0]?.node;
  const hunterStart=map.hunterStart;
  if(!Object.hasOwn(map.nodes,monsterStart) ||
      !Object.hasOwn(map.nodes,hunterStart))return [];
  const name=id=>map.nodes[id]?.name||'Unknown location';
  const monsterName=typeof view.monsterName==='string'?view.monsterName:'The Monster';
  const hunterPath=[hunterStart],monsterPath=[monsterStart];
  const monsterSegments=[];
  const discoveredBeacons=[];
  let hunter=hunterStart,monster=monsterStart;
  const frames=[{
    index:0,round:0,role:'start',action:'start',hunter,monster,
    hunterPath:[...hunterPath],monsterPath:[...monsterPath],
    monsterSegments:[],beaconVisits:[],movement:'',
    heading:'The hunt begins',
    description:'The Hunter starts at '+name(hunter)+' while '+monsterName+
      ' waits unseen at '+name(monster)+'. Both starting positions are now revealed.'
  }];
  const events=view.replayHistory;
  for(const event of events) {
    if(!event || !['hunter','monster'].includes(event.role) ||
        !Number.isInteger(event.round) || event.round<1 ||
        !Object.hasOwn(map.nodes,event.node) || frames.length>250)continue;
    const isHunter=event.role==='hunter';
    const from=isHunter?hunter:monster;
    const dest=event.node;
    const action=event.action==='end-turn'&&isHunter?'end-turn':
      event.action==='lantern'&&isHunter?'lantern':'move';
    const movement=event.movement==='teleport'?'teleport':
      event.movement==='veil'?'veil':'';
    let heading,description;
    if(isHunter){
      if(action==='end-turn'){
        heading='The Hunter ends the turn';
        description='Round '+event.round+': the Hunter remains at '+name(hunter)+
          '. The Monster may move after this turn.';
      }else if(action==='lantern'){
        heading='The Signal Lantern is used';
        description='Round '+event.round+': the Hunter requests an additional clue at '+
          name(hunter)+' without changing location.';
      }else{
        hunter=dest;
        hunterPath.push(dest);
        heading='The Hunter searches '+name(dest);
        description='Round '+event.round+': the Hunter travels from '+name(from)+
          ' to '+name(dest)+'.';
      }
    }else{
      monster=dest;
      monsterPath.push(dest);
      monsterSegments.push({from,to:dest,movement});
      const isBeacon=view.scenario==='beacons'&&
        view.objectives?.beacons?.includes(dest);
      if(isBeacon&&!discoveredBeacons.includes(dest))discoveredBeacons.push(dest);
      const eventTypes=(view.publicEvents||[]).filter(e=>
        e && e.round===event.round).map(e=>e.type);
      if(movement==='teleport'){
        heading=monsterName+' teleports';
        description='Round '+event.round+': '+monsterName+' leaps from '+
          name(from)+' to '+name(dest)+
          '. The departure was publicly announced, but the destination was secret.';
      }else if(movement==='veil'){
        heading=monsterName+' uses the Veil';
        description='Round '+event.round+': '+monsterName+' slips from '+
          name(from)+' to '+name(dest)+', concealing the new trail.';
      }else{
        heading=monsterName+' moves unseen';
        description='Round '+event.round+': '+monsterName+' secretly travels from '+
          name(from)+' to '+name(dest)+'.';
      }
      if(eventTypes.includes('rumour'))description+=' A misleading local sighting was planted.';
      if(eventTypes.includes('beacon'))description+=' A signal beacon was extinguished.';
    }
    frames.push({
      index:frames.length,round:event.round,role:event.role,action,
      movement,hunter,monster,from,to:dest,
      hunterPath:[...hunterPath],monsterPath:[...monsterPath],
      monsterSegments:monsterSegments.map(part=>({...part})),
      beaconVisits:[...discoveredBeacons],heading,description
    });
  }
  // A legacy save may predate explicit end-turn events. The final recorded
  // position is still the actual outcome; frames show only known movements.
  if(frames.length===1){
    frames[0].description+=' No movement was recorded before the result.';
  }
  return frames;
}

/** Project ONE replay frame into an ended game view for the existing map. */
export function replayMapView(overView,frame){
  if(overView?.phase!=='over' || !frame)return null;
  return {
    ...overView,replay:true,
    hunter:frame.hunter,monster:frame.monster,
    hunterTrail:[...frame.hunterPath],
    trail:frame.monsterPath.map((node,i)=>({id:'replay-'+i,node})),
    replaySegments:frame.monsterSegments.map(part=>({...part})),
    beaconVisits:[...frame.beaconVisits]
  };
}

export function replayFrameCaption(frame,total){
  if(!frame)return 'No recorded moves';
  return 'Move '+frame.index+' of '+Math.max(0,total-1)+
    (frame.round?' · Round '+frame.round:' · Starting positions');
}
