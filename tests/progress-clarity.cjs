const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const React = require('react'), RN = require('react-native-web');
const { renderToStaticMarkup } = require('react-dom/server');
process.env.TZ = 'Australia/Brisbane';
function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const requireFile = name => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) {
        const base = name.slice(2);
        for (const ext of ['.ts', '.tsx']) if (fs.existsSync(base + ext)) return load(base + ext);
      }
      return require(name);
    };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, require: requireFile, Date, Set, Map, Promise, console }, { filename: file });
    cache.set(file, module.exports);
    return module.exports;
  }
  return load;
}
const load = loader();
const { buildProgressOverview } = load('lib/progress-metrics.ts');
const { normalizeWorkouts } = load('lib/ecosystem/activity.ts');
const { buildProgressSummary } = load('lib/progress-summary.ts');
const now = new Date('2026-11-28T08:00:00Z');
const input = { checkIns: { a: ['2026-11-27T00:00:00Z'], b: ['2026-11-27T00:00:00Z'] }, gymSets: [
  { id: 'set1', exerciseName: 'Row', kg: 10, reps: 8, recordedAt: '2026-11-27T00:00:00Z' },
  { id: 'set2', exerciseName: 'Press', kg: 12, reps: 8, recordedAt: '2026-11-27T00:00:00Z' },
], reflections: [], journalDates: ['2026-11-25'], trackers: [], meditations: [], articles: {}, visionAnswers: [] };
const workout = (id, start, sourceId = 'com.apple.health') => ({
  id, sourceId, sourceName: sourceId.includes('garmin') ? 'Garmin' : 'Apple Watch',
  start, end: new Date(Date.parse(start) + 1800000).toISOString(), durationSeconds: 1800,
  distanceMeters: 4000, kind: 'Run',
});
const a = workout('00000000-0000-0000-0000-000000000001', '2026-11-27T00:00:00Z');
const b = workout('00000000-0000-0000-0000-000000000002', '2026-11-27T14:30:00Z'); // Nov 28 in Brisbane
const old = workout('00000000-0000-0000-0000-000000000003', '2026-11-10T00:00:00Z');
const mirrored = workout('00000000-0000-0000-0000-000000000004', a.start, 'com.garmin.connect');
const rows = normalizeWorkouts([a, a, b, old, mirrored], now);
const data = buildProgressOverview(input, 7, now);
const summary = buildProgressSummary(data, rows, 'com.apple.health', 7, now);
assert.equal(data.sessions, 1, 'Duplicate Treksor completions count once');
assert.equal(summary.activeDays, 3, 'Overlap counts one day; watch-only day is included');
assert.equal(summary.watch.sessions, 2, 'One source, unique HealthKit UUIDs, current period');
assert.equal(summary.watch.minutes, 60);
assert.equal(summary.recent.filter(row => row.id.startsWith('training:')).length, 1, 'Sets collapse into one daily training row');
assert(summary.recent.some(row => row.date === '2026-11-28' && row.id.startsWith('health:')));
assert.equal(buildProgressSummary(buildProgressOverview(input, 30, now), rows, 'com.apple.health', 30, now).watch.sessions, 3);
assert.equal(buildProgressSummary(data, rows, 'com.garmin.connect', 7, now).watch.sessions, 1, 'Sources never accumulate');
assert.equal(buildProgressSummary(data, [], '', 7, now).activeDays, 2, 'Phone-only records remain complete');
assert.equal(JSON.stringify(data), JSON.stringify(buildProgressOverview(input, 7, now)), 'Summary does not mutate stored evidence');

let width = 390, fontScale = 1;
const uiMocks = {
  'react-native': { ...RN, useWindowDimensions: () => ({ width, height: 844, scale: 1, fontScale }) },
  '@/components/ui/BrandIcon': ({ name }) => React.createElement('span', { 'aria-hidden': true, 'data-icon': name }, name === 'watch-outline' ? '◷' : name === 'chevron-forward' ? '›' : '✓'),
};
const Summary = loader(uiMocks)('components/progress/ProgressSummary.tsx').default;
let eventChosen, connections = 0, detail = 0, retries = 0;
const health = { loading: false, error: false, hasSnapshot: true, savedAt: '2026-11-28T08:00:00Z', sources: [{ id: 'com.apple.health', name: 'Apple Watch' }, { id: 'com.garmin.connect', name: 'Garmin' }], sourceId: 'com.apple.health' };
const props = { summary, period: 7, loading: false, error: false,
  onRetry: () => retries++, health, onConnections: () => connections++, onEvent: value => eventChosen = value,
  onDetails: () => detail++ };
const html = renderToStaticMarkup(React.createElement(Summary, props));
assert(!html.includes('Treksor sessions') && !html.includes('Imported workouts'), 'Source-specific workout counts belong in details');
assert(html.includes('active days') && html.includes('Health · imported'));
assert(!html.includes('Recording source') && !html.includes('role="tab"'), 'Configuration belongs in details');
assert(!html.includes('Heart rate') && !html.includes('Strava'));
const emptyHTML = renderToStaticMarkup(React.createElement(Summary, { ...props, health: { ...health, hasSnapshot: false, sources: [] } }));
assert(emptyHTML.includes('Connect a watch') && !emptyHTML.includes('imported workouts'), 'Absent import offers setup, never a zero-workout metric');
const errorHTML = renderToStaticMarkup(React.createElement(Summary, { ...props, health: { ...health, error: true } }));
assert(errorHTML.includes('needs a refresh') && errorHTML.includes('Some records are unavailable'));
const loadingHTML = renderToStaticMarkup(React.createElement(Summary, { ...props, loading: true }));
assert(loadingHTML.includes('Updating progress') && !loadingHTML.includes('active days'));
function nodes(tree, predicate, result = []) {
  if (!tree || typeof tree !== 'object') return result;
  if (predicate(tree)) result.push(tree);
  React.Children.forEach(tree.props?.children, child => nodes(child, predicate, result));
  return result;
}
const tree = Summary(props);
nodes(tree, n => n.props?.accessibilityLabel === 'Review smartwatch and health connections')[0].props.onPress();
assert.equal(connections, 1);
const recentButtons = nodes(tree, n => n.props?.onPress && nodes(n, c => c.props?.children === summary.recent[0].title).length);
recentButtons[0].props.onPress();
assert.equal(eventChosen.id, summary.recent[0].id);
nodes(tree, n => n.props?.onPress && nodes(n, c => c.props?.children === 'View details').length)[0].props.onPress();
assert.equal(detail, 1);
const failed = Summary({ ...props, error: true });
nodes(failed, n => n.props?.onPress && nodes(n, c => c.props?.accessibilityRole === 'alert').length)[0].props.onPress();
assert.equal(retries, 1);
width = 320; fontScale = 1.5;
assert(renderToStaticMarkup(React.createElement(Summary, props)).includes('Recent activity'));

// Exercise actual hook lifecycle, including stale requests, account changes,
// deleted imports, failed refreshes and offline retention for the same account.
async function testHealthLifecycle() {
  let owner = 'a', slots = [], cursor = 0, scheduled = [], pending = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useCallback(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, callback }; return slots[i].callback; },
    useEffect(callback, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) { const previous = slots[i]; slots[i] = { deps }; scheduled.push(() => { previous?.cleanup?.(); slots[i].cleanup = callback(); }); } },
  };
  const auth = selector => selector({ user: { id: owner } });
  auth.getState = () => ({ user: { id: owner } });
  const { useProgressHealth } = loader({
    react: hooks,
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-router': { useFocusEffect: callback => hooks.useEffect(callback, [callback]) },
    '@/store/auth-store': { useAuthStore: auth },
    '@/api/health-snapshot': { getHealthSnapshot: key => new Promise((resolve, reject) => pending.push({ key, resolve, reject })) },
  })('hooks/useProgressHealth.ts');
  const render = () => { cursor = 0; const result = useProgressHealth(); const effects = scheduled; scheduled = []; effects.forEach(effect => effect()); return result; };
  const flush = () => new Promise(setImmediate);
  const snapshot = { snapshot: { version: 1, capturedAt: now.toISOString(), workouts: rows }, updatedAt: now.toISOString() };
  render(); assert.equal(pending[0].key, 'a');
  owner = 'b'; assert.equal(render().rows.length, 0);
  pending.shift().resolve(snapshot); await flush(); assert.equal(render().rows.length, 0, 'Previous account response is discarded');
  pending.shift().resolve(snapshot); await flush();
  assert.equal(render().rows.length, rows.length);
  render().selectSource('com.garmin.connect'); assert.equal(render().sourceId, 'com.garmin.connect');
  const retry = render().refresh(); pending.shift().reject(new Error('offline')); await retry;
  assert.equal(render().rows.length, rows.length, 'Offline refresh preserves own last snapshot');
  assert.equal(render().error, true);
  const deletion = render().refresh(); pending.shift().resolve(null); await deletion;
  assert.equal(render().hasSnapshot, false); assert.equal(render().rows.length, 0, 'Deleted import is removed on refresh');
  const slow = render().refresh(), fast = render().refresh();
  pending[1].resolve(null); await fast; pending[0].resolve(snapshot); await slow; pending = [];
  assert.equal(render().hasSnapshot, false, 'Old same-account request cannot restore deleted records');
  owner = undefined; render(); assert.equal(render().rows.length, 0);
  assert.equal(render().loading, false, 'Signed-out state completes loading');
}

if (process.env.TREKSOR_QA_DIR) {
  const directory = process.env.TREKSOR_QA_DIR;
  fs.mkdirSync(directory, { recursive: true });
  width = 390; fontScale = 1;
  const actions = React.createElement(RN.Text, { style: { backgroundColor: '#D7B877', color: '#05080D', textAlign: 'center', padding: 16, borderRadius: 14, fontSize: 16 } }, '+  Log activity');
  const page = React.createElement(RN.View, { style: { maxWidth: 430, marginHorizontal: 'auto', padding: 20, backgroundColor: '#05080D' } },
    React.createElement(RN.Text, { style: { color: '#D7B877', fontSize: 34, fontWeight: '600', paddingTop: 18 } }, 'Progress'),

    React.createElement(Summary, { ...props, health: { ...health, sources: health.sources.slice(0, 1) } }, actions));
  const markup = renderToStaticMarkup(page);
  const sheet = RN.StyleSheet.getSheet();
  fs.writeFileSync(path.join(directory, 'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Treksor Progress — component QA</title><style>' + sheet.textContent + 'body{margin:0;background:#05080D;color:#f5f4f1;font-family:Arial,sans-serif}</style></head><body>' + markup + '</body></html>');
}
testHealthLifecycle().then(() => console.log('PASS: concise Progress; local dates; 7/30-day periods; source separation; real actions; missing/loading/error states; refresh and account isolation')).catch(error => { console.error(error); process.exitCode = 1; });
