import { parseBearing, formatBearing } from './geometry.mjs';

/** Short self-contained learning sequence; works offline and without a teacher. */
export const LESSONS = Object.freeze([
  Object.freeze({
    id:'clockwise',
    title:'Clockwise from north',
    detail:'Start at north (000°), then rotate clockwise. East is 090°, south is 180° and west is 270°.',
    prompt:'The next village lies directly east. What is its three-figure bearing?',
    bearing:90,
    answer:90,
    explanation:'North is 000°. A quarter-turn clockwise is 090°, so east is 090°.'
  }),
  Object.freeze({
    id:'reverse',
    title:'Reverse bearings',
    detail:'The opposite direction is 180° away. Add or subtract 180° and use three digits.',
    prompt:'You travel from A to B on a bearing of 065°. What is the bearing of A from B?',
    bearing:65,
    answer:245,
    explanation:'065° + 180° = 245°. You reverse the direction when you swap “of A from B” and “of B from A”.'
  }),
  Object.freeze({
    id:'wording',
    title:'Which point is the starting point?',
    detail:'“The bearing of the Hunter from the Monster” starts at the Monster, not at the Hunter.',
    prompt:'The bearing of the Hunter from the Monster is 240°. What is the bearing of the Monster from the Hunter?',
    bearing:240,
    answer:60,
    explanation:'Reverse the 240° direction by subtracting 180°: 060°. Draw the bearing from the Hunter toward the Monster.'
  }),
  Object.freeze({
    id:'wrap',
    title:'Crossing north',
    detail:'A direction sector may cross 000°. A sector of 350° to 010° is only 20° wide, not 340°.',
    prompt:'A sector runs from 350° clockwise through north to 010°. What is its middle bearing?',
    bearing:0,
    answer:0,
    explanation:'Halfway from 350° to 010° clockwise is north, written 000°. Never use a negative bearing.'
  })
]);

export function checkLesson(step, text) {
  const lesson = LESSONS[step];
  if (!lesson) return {correct:false,message:'No lesson selected.'};
  const submitted = parseBearing(text);
  if (submitted === null)
    return {correct:false,message:'Use a three-figure bearing such as 090, 245 or 000.'};
  if (submitted !== lesson.answer)
    return {correct:false,message:'Not quite. Read where the bearing starts and measure clockwise from north.'};
  return {correct:true,message:'Correct: '+formatBearing(lesson.answer)+'! '+lesson.explanation};
}
