// Regenerate the demo training history against Pablo's real 3-day full body split.
// Weigh-ins, nutrition and InBody entries carry over unchanged from seed.base.js.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const OLD = eval(fs.readFileSync(path.join(dir, 'seed.base.js'), 'utf8') + '; SEED');

// [name, sets, repLo, repHi, muscleGroup, workingLoadKg, plateStepKg]
const PROGRAM = [
  {id: 'A', name: 'Full Body A', ex: [
    ['Barbell Squat', 3, 5, 5, 'Quads', 110, 5],
    ['Barbell Bench Press', 3, 5, 5, 'Chest', 85, 5],
    ['Barbell Hip Thrust', 3, 8, 10, 'Hamstrings/Glutes', 120, 5],
    ['Chest-Supported DB Row (neutral grip)', 3, 8, 10, 'Back', 30, 2],
    ['DB Lateral Raise', 3, 10, 12, 'Shoulders', 12, 2],
    ['Cable Rope Tricep Extension', 3, 10, 12, 'Triceps', 32, 2],
    ['DB Hammer Curl (neutral grip)', 2, 10, 12, 'Biceps', 18, 2],
  ]},
  {id: 'B', name: 'Full Body B', ex: [
    ['Plyo Push-Up (fists)', 3, 5, 5, 'Triceps (power)', 0, 0],
    ['Barbell Squat', 3, 8, 10, 'Quads', 95, 5],
    ['Barbell Incline Bench Press', 3, 5, 8, 'Chest', 70, 5],
    ['1-Arm DB Row', 3, 8, 10, 'Back', 34, 2],
    ['Machine Leg Curl (prone)', 3, 8, 10, 'Hamstrings', 45, 5],
    ['Cable Rope Face Pull', 3, 10, 12, 'Shoulders (rear delt)', 25, 2],
    ['Incline DB Curl (neutral grip)', 2, 10, 12, 'Biceps', 14, 2],
  ]},
  {id: 'C', name: 'Full Body C', ex: [
    ['Barbell Bench Press', 3, 6, 8, 'Chest', 77.5, 5],
    ['Machine Leg Press (single-leg, controlled)', 3, 8, 10, 'Quads', 90, 5],
    ['Cable Pull-Through', 3, 10, 12, 'Hamstrings/Glutes', 40, 2],
    ['Lat Pulldown (wide grip)', 3, 8, 10, 'Back', 65, 5],
    ['DB Lateral Raise', 3, 10, 12, 'Shoulders', 12, 2],
    ['Cable Rope Tricep Extension', 2, 10, 12, 'Triceps', 32, 2],
    ['Cable Curl', 2, 10, 12, 'Biceps', 25, 2],
  ]},
];

const step = (v, s) => s ? Math.round(v / s) * s : 0;
let seedInt = 987654;
const rnd = () => (seedInt = (seedInt * 1103515245 + 12345) % 2147483648) / 2147483648;

// Monday / Wednesday / Friday, with the occasional missed session
const first = OLD.weighins[0].date, lastDay = OLD.weighins[OLD.weighins.length - 1].date;
const dates = [];
for (let t = Date.parse(first); t <= Date.parse(lastDay); t += 86400000) {
  const dow = new Date(t).getUTCDay();
  if ([1, 3, 5].includes(dow) && rnd() > 0.09) dates.push(new Date(t).toISOString().slice(0, 10));
}

const span = dates.length - 1;
const workouts = dates.map((date, i) => {
  const day = PROGRAM[i % 3];
  const prog = 1 + 0.05 * (i / span);
  return {
    date, day: day.id,
    // Zone 2 goes after weights and never on a heavy lower-body day (A or C)
    zone2: day.id === 'B' && rnd() > 0.45 ? step(24 + rnd() * 16, 5) : 0,
    exercises: day.ex.map(([name, sets, lo, hi, , base, st]) => ({
      name,
      sets: Array.from({length: sets}, (_, si) => ({
        reps: Math.round(lo + rnd() * (hi - lo)),
        kg: base === 0 ? 0 : step(base * prog * (0.96 + rnd() * 0.06), st || 2.5),
        rpe: Math.min(9.5, step(6.5 + si * 0.5 + rnd() * 1.0, 0.5)),
      })),
    })),
  };
});

// Give the overload panel real signal: one lift maxed out its range, one stalled below it,
// in the most recent session of the day it belongs to.
const forceTop = {A: 'Barbell Bench Press', C: 'Lat Pulldown (wide grip)'};
const forceLow = {B: 'Barbell Squat'};
const seen = new Set();
for (let i = workouts.length - 1; i >= 0; i--) {
  const w = workouts[i];
  if (seen.has(w.day)) continue;
  seen.add(w.day);
  const def = PROGRAM.find(p => p.id === w.day);
  w.exercises.forEach(e => {
    const [, , lo, hi] = def.ex.find(x => x[0] === e.name);
    if (forceTop[w.day] === e.name) e.sets.forEach(s => { s.reps = hi; });
    else if (forceLow[w.day] === e.name) e.sets.forEach((s, k) => { s.reps = lo - (k ? 1 : 0); });
    else if (e.sets.every(s => s.reps >= hi)) e.sets[0].reps = Math.max(lo, hi - 1);
  });
}

// Alfredson heel drops, twice daily, logged separately from the gym
const rehab = [];
for (let t = Date.parse(first); t <= Date.parse(lastDay); t += 86400000) {
  const d = new Date(t).toISOString().slice(0, 10);
  rehab.push({date: d, am: rnd() > 0.14, pm: rnd() > 0.26});
}

const SEED = {
  program: PROGRAM.map(d => ({
    id: d.id, name: d.name,
    // step 0 marks a bodyweight movement: no load to add, so volume is the only lever
    ex: d.ex.map(([name, sets, lo, hi, group, , st]) => ({name, sets, lo, hi, group, step: st})),
  })),
  settings: {
    phaseName: 'Cut 1',
    mode: 'cut', goalLo: 71, goalHi: 72, rate: -0.5,
    proteinPerKg: 2.0, kcalMode: 'auto', kcalManual: 2100,
    sessionFloor: 2, sessionTarget: 3,
    excluded: ['Barbell Good Morning', 'Romanian Deadlift', 'DB Bench Press', 'DB Shoulder Press'],
  },
  // Smart-scale readings come with most, not all, weigh-ins. Body fat and muscle percentage
  // are interpolated along the InBody trend so the two sources tell a consistent story.
  weighins: OLD.weighins.map((d, i, arr) => {
    if (rnd() < 0.32) return d;
    const f = i / (arr.length - 1);
    const bf = 22.5 + (17.8 - 22.5) * f + (rnd() - 0.5) * 1.2;
    const mm = 42.9 + (46.4 - 42.9) * f + (rnd() - 0.5) * 0.8;
    return {...d, bf: Math.round(bf * 10) / 10, mm: Math.round(mm * 10) / 10};
  }),
  nutrition: OLD.nutrition,
  workouts,
  rehab,
  bodycomp: OLD.bodycomp.map(c => ({...c, smm_kg: Math.round(c.smm_kg * 10) / 10})),
};

const out = '// Synthetic demo data for the Powerjacked prototype. Not real measurements.\n'
  + 'const SEED = ' + JSON.stringify(SEED) + ';\n';
fs.writeFileSync(path.join(dir, 'seed.demo.js'), out);
console.log('bytes', out.length, 'sessions', workouts.length,
  first, '->', workouts[workouts.length - 1].date);
console.log('last A', JSON.stringify(
  [...workouts].reverse().find(w => w.day === 'A').exercises.slice(0, 2)));
