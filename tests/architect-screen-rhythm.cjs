'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8');
function list(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):e.name.endsWith('.tsx')&&!e.name.startsWith('_layout')?[path.join(dir,e.name)]:[]);
}
const screens=list('app');
assert(screens.length>=66,'Full authenticated and public screen tree must be reviewed');
const theme=read('theme/architect.ts');
for(const marker of [
 "appearance: 'navy' | 'midnight' = 'midnight'",
 "background: '#05080D'",
 'export const layout = {',
 'pageTop: 8,',
 'compactTop: 4,',
 'page: { fontSize: 34, lineHeight: 42',
 'section: { fontSize: 22, lineHeight: 29',
 'card: { fontSize: 18, lineHeight: 25',
 'eyebrow: { fontSize: 11, lineHeight: 16',
 'gold: "#D7B877"'
])assert(theme.includes(marker),'Architect system token absent: '+marker);
const frame=read('components/AppFrame.tsx'),heading=read('components/BodyPageHeading.tsx');
assert(frame.includes("paddingVertical:4"),'Fixed navigation must have compact spacing');
assert(frame.includes("icon:{...surface.icon,width:42,height:42}"),'Fixed navigation icons should have one size');
assert(frame.includes('style={[s.pickerOverlay,{top:headerHeight}]}'),'Pillar overlay stays below fixed bar');
assert(frame.includes('!isHome && <TouchableOpacity'),'Do not show Home button while already in Home');
assert(heading.includes('title: type.page'),'Shared page titles use Architect typography');
assert(heading.includes('marginTop: 6'),'Shared title subtitle separation');
const progress=read('app/(tabs)/tracking/index.tsx'),community=read('app/(tabs)/community/index.tsx'),
 today=read('app/today.tsx'),home=read('app/(tabs)/home/index.tsx');
assert(/paddingTop:\s*layout\.compactTop/.test(progress),'Progress title must not reserve duplicate safe space');
assert(community.includes('marginTop:layout.compactTop'),'Community title aligns with Progress');
assert(today.includes('Redirect href="/(tabs)/tracking"'),'Today must redirect to Progress instead of creating a second screen');
assert(progress.includes('paddingTop:layout.compactTop'),'Unified Progress uses the canonical compact top spacing');
assert(read('components/JourneyCard.tsx').includes('section: { marginTop: 8, gap: 12 }'),'Today does not stack a large empty band');
assert(home.includes('top: { height: 74, flexDirection: "row"') && home.includes('paddingTop: 15, paddingBottom: 15'),'Brand and avatar must have balanced space within one hero');
assert(home.includes('heroTitle: { ...type.page, color: colors.text }'),'Home hero uses shared typography');
assert(home.includes('sectionTitle: { ...type.section }'),'Home headings must reuse section scale');
for(const p of ['app/notes/index.tsx','app/body/nutrition/groceries.tsx','app/community/events.tsx']){
 const s=read(p);
 assert(s.includes('hasFixedHeader'),'Hide duplicated in-page back row beneath AppFrame: '+p);
 assert(s.includes('type.page'),'Use Architect title scale: '+p);
}
for(const p of ['app/article/index.tsx','app/body/workout/index.tsx','app/body/nutrition/beverage-details.tsx','app/mental/thoughts/index.tsx','app/mind/journal.tsx','app/(tabs)/chat/index.tsx']){
 assert(read(p).includes('...type.page'),'Screen must reference canonical The Architect page style: '+p);
}
const offenders=[];
for(const f of screens){
 if(f.startsWith('app/(auth)/'))continue; // Auth deliberately owns the full safe area.
 const source=read(f);
 if(/insets\.top\s*\+\s*12\b/.test(source))offenders.push(f);
}
assert.equal(offenders.length,0,'Screens still have an independent 12px safe-area offset: '+offenders.join(', '));
for(const f of [
 'app/(tabs)/home/index.tsx',
 'app/body/workout/index.tsx',
 'app/body/workout/library.tsx',
 'app/body/nutrition/beverage-details.tsx',
 'app/mental/thoughts/index.tsx',
 'app/mind/moments.tsx',
]){
 assert(!/rgba\((?:183|184|188|205),\s*(?:220|221|223|235),\s*(?:239|240|248),?[^)]*\)/i.test(read(f)),
  'Legacy blue tinted card/overlay detected in '+f);
}
console.log('PASS: audited '+screens.length+' routes and enforced premium midnight palette, fixed header, title scale, no duplicated 12px safe-area spacing, and consistent Profile / Progress / Community / Today hierarchy.');
