const assert = require('node:assert/strict');
const fs = require('node:fs');
const brand = fs.readFileSync('watch/Companion/TreksorBrand.swift','utf8');
const workout = fs.readFileSync('watch/Companion/Workout.swift','utf8');
const mobile = fs.readFileSync('theme/architect.ts','utf8');
for (const literal of ['background = color(0x05080D)','surface = color(0x111820)','gold = color(0xD7B877)']) {
  assert(brand.includes(literal),'Watch Architect identity must retain '+literal);
}
assert(mobile.includes("appearance: 'navy' | 'midnight' = 'midnight'"),'Mobile must use the restored midnight palette');
for (const part of ['Text("SETS")','numberEditor("KG"','"REPS"','VideoPlayer(player:movie)','COMPLETE SET','TimelineView(.periodic']) {
  assert(workout.includes(part),'Watch workout must show '+part);
}
assert(workout.includes('link.requestVideo('),'Video is requested on demand');
assert(workout.includes('stopMovie();link.closeWorkout()'),'Leaving Watch gym must stop video');
console.log('PASS: Architect premium palette and minimal watch workout presentation');
