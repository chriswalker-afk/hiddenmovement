/**
 * Only publicly visible turn information controls the Hunter/Monster handoff.
 * An exhausted Hunter keeps the deduction notebook but cannot measure or
 * submit another road bearing until a new round has actually begun.
 */
export function bearingToolsAvailable(view) {
  return !!view && (view.phase==='monster' ||
    (view.phase==='hunter' && view.stepsLeft>0));
}

export function hunterTurnTransition(view) {
  if (!view || view.phase!=='hunter') return null;
  const finalRound=view.round>=view.maxRounds;
  if(view.stepsLeft>0) return {
    ready:false,
    button:finalRound?'FINISH FINAL ROUND EARLY':'END HUNTER TURN EARLY',
    hint:finalRound
      ?'You may finish the final round before using every move.'
      :view.mode==='solo'
        ?'You can finish early. The Monster moves only when you end your turn.'
        :'You can finish early. The device is concealed before the Monster moves.'
  };
  if(finalRound) return {
    ready:true,
    eyebrow:'HUNTER MOVEMENT COMPLETE',
    title:'The final round is over',
    button:'FINISH FINAL ROUND · SEE RESULTS',
    hint:'No moves remain and no further Monster movement occurs. Press below to end the hunt and see the result.',
    next:'results'
  };
  if(view.mode==='multi') return {
    ready:true,
    eyebrow:'HUNTER MOVEMENT COMPLETE',
    title:'Ready to hand over?',
    button:'HAND OVER FOR MONSTER’S HIDDEN MOVE',
    hint:'You have used both Hunter moves. The Monster has NOT moved yet. Press below to hide the map before passing the device to the Monster player.',
    next:'handoff'
  };
  return {
    ready:true,
    eyebrow:'HUNTER MOVEMENT COMPLETE',
    title:'Ready for the Monster?',
    button:'BEGIN MONSTER’S HIDDEN MOVEMENT',
    hint:'You have used both Hunter moves. The Monster has NOT moved yet. Review your evidence if you wish, then press below to start its secret move. Your next Hunter round will begin afterwards.',
    next:'secret-move'
  };
}
