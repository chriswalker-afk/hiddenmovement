/**
 * A genuine manually operated 360-degree bearing protractor.
 * Zero is north; angles increase clockwise. It never reads or snaps to
 * roads, destinations or secret Monster positions.
 */
export const normalizeBearing = value => ((Math.round(value) % 360) + 360) % 360;

export function bearingFromPointer(x, y, originX, originY) {
  if (![x,y,originX,originY].every(Number.isFinite)) return null;
  if (Math.hypot(x-originX,y-originY) < 1) return null;
  return normalizeBearing(Math.atan2(x-originX,originY-y) * 180 / Math.PI);
}

const xy = (radius, degrees) => {
  const radians = degrees*Math.PI/180;
  return [+(Math.sin(radians)*radius).toFixed(2),+(-Math.cos(radians)*radius).toFixed(2)];
};
const pad = angle => String(normalizeBearing(angle)).padStart(3,'0')+'°';

/** SVG elements are paint-only except the drag handles. */
export function renderProtractor(x,y,bearing=0) {
  const value=normalizeBearing(bearing);
  const ticks=Array.from({length:72},(_,i)=>{
    const degrees=i*5, major=i%6===0, medium=i%3===0;
    const [x1,y1]=xy(major?101:medium?108:112,degrees);
    const [x2,y2]=xy(119,degrees);
    return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+
      '" class="'+(major?'protractor-tick-major':'protractor-tick')+'"/>';
  }).join('');
  const labels=Array.from({length:12},(_,i)=>{
    const degree=i*30,[tx,ty]=xy(86,degree);
    return '<text x="'+tx+'" y="'+(ty+3)+'" text-anchor="middle">'+pad(degree)+'</text>';
  }).join('');
  const [armX,armY]=xy(119,value);
  return '<g class="protractor-tool" role="group" aria-label="Manual 360-degree bearing protractor" '+
    'transform="translate('+x+' '+y+')">'+
    '<circle r="125" class="protractor-disc"/>'+
    '<circle r="120" class="protractor-rim"/>'+
    '<circle r="99" class="protractor-inner"/>'+
    ticks+labels+
    '<path d="M0-126V-137" class="protractor-north"/>'+
    '<text x="0" y="-144" text-anchor="middle" class="protractor-north-label">N</text>'+
    '<line x1="0" y1="0" x2="'+armX+'" y2="'+armY+'" class="protractor-arm"/>'+
    '<line x1="0" y1="0" x2="'+armX+'" y2="'+armY+
      '" class="protractor-arm-hit" data-protractor-rotate="true"/>'+
    '<circle cx="'+armX+'" cy="'+armY+'" r="14" class="protractor-tip" data-protractor-rotate="true"/>'+
    '<circle r="17" class="protractor-center-hit" data-protractor-move="true"/>'+
    '<path d="M-9 0H9M0-9V9" class="protractor-center-cross" pointer-events="none"/>'+
    '<text y="30" text-anchor="middle" class="protractor-reading">'+pad(value)+'</text>'+
    '</g>';
}
