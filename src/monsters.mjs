/**
 * Public monster personalities. These are *identities*, not secret state.
 * Portrait SVGs are original bundled game assets and require no image CDN.
 * Monster abilities apply to the matching Solo difficulty; human Pass & Play
 * currently uses the Intro board and its powerless Lantern Wisp.
 */
export const MONSTERS=Object.freeze({
  intro:Object.freeze({
    id:'lantern-wisp',name:'The Lantern Wisp',title:'The Lost Light',
    home:'Blackfen Marsh',art:'./assets/monsters/lantern-wisp.svg',
    flavour:'A lonely glow drifts from the drowned reeds to the old stones. Follow it across Blackfen before the last lantern goes dark.',
    powerTitle:'No special power',powerText:'A straightforward first hunt: learn the roads, read bearing clues and catch the Wisp.',
    teleport:null,decoy:null,tint:'#e7d49e'
  }),
  apprentice:Object.freeze({
    id:'briar-shade',name:'The Briar Shade',title:'The Vanishing Thorn',
    home:'Duskmere Village',art:'./assets/monsters/briar-shade.svg',
    flavour:'A shadow slips between Duskmere’s crooked lanes, orchards and shuttered windows. Follow the thorn-marked trail before it vanishes.',
    powerTitle:'Briar Step',powerText:'Can leap 2–3 roads every 4 monster turns. Its previous location is revealed each time.',
    teleport:Object.freeze({firstRound:4,cooldown:4,minHops:2,maxHops:3}),decoy:null,tint:'#b2d1a0'
  }),
  tracker:Object.freeze({
    id:'mire-mimic',name:'The Mire Mimic',title:'The False Witness',
    home:'Rookgate District',art:'./assets/monsters/mire-mimic.svg',
    flavour:'From Rookgate’s canal steps to the shadowed markets, witnesses swear they saw familiar faces. Some sightings are planted lies.',
    powerTitle:'False Sighting',powerText:'Can plant an unconfirmed location report every 4 monster turns. Visit the place to expose it.',
    teleport:null,decoy:Object.freeze({firstRound:3,cooldown:4}),tint:'#9ed0cd'
  }),
  expert:Object.freeze({
    id:'eclipse-herald',name:'The Eclipse Herald',title:'The Twin Deception',
    home:'Ravenmarch County',art:'./assets/monsters/eclipse-herald.svg',
    flavour:'From Raven Keep to the Blackwater crossing, shadows race across the county. The Herald can vanish between roads or leave behind a false witness.',
    powerTitle:'Eclipse Shift & Phantom Echo',
    powerText:'Can leap 2–3 roads, revealing its origin (5-turn cooldown), or plant a false sighting (4-turn cooldown).',
    teleport:Object.freeze({firstRound:4,cooldown:5,minHops:2,maxHops:3}),
    decoy:Object.freeze({firstRound:3,cooldown:4}),tint:'#d4afd7'
  })
});

export function monsterFor(difficulty='intro'){
  return MONSTERS[difficulty]||MONSTERS.intro;
}

export function initialMonsterCooldowns(difficulty='intro'){
  const m=monsterFor(difficulty);
  return {teleportReadyRound:m.teleport?.firstRound??null,
    decoyReadyRound:m.decoy?.firstRound??null};
}
