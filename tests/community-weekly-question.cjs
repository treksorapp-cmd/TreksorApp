'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),vm=require('node:vm'),ts=require('typescript');
const helperPath='lib/community-weekly-question.ts',page='app/(tabs)/community/index.tsx';
const patch=path.resolve('patches/community-weekly-question-windows.cjs');
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(helperPath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {module,exports:module.exports,Date,Number,Math,console});
const {COMMUNITY_WEEKLY_QUESTIONS:questions,communityQuestionForWeek:question}=module.exports;
assert.equal(questions.length,2,'Exactly two questions, never more');
assert.equal(questions[0],'What would you like to explore today?');
assert.equal(questions[1],'What activity would you like to do?');
assert.equal(question(new Date(2026,10,16,0,1)),questions[0]);
assert.equal(question(new Date(2026,10,22,23,59)),questions[0]);
assert.equal(question(new Date(2026,10,23,0,0)),questions[1]);
assert.equal(question(new Date(2026,10,29,23,59)),questions[1]);
assert.equal(question(new Date(2026,10,30,0,0)),questions[0]);
for(let i=0;i<65;i++)assert.equal(question(new Date(2026,10,16+i*7,12)),questions[i%2],'Alternates on Monday, including new years and ISO week 53');
assert.equal(question(new Date(NaN)),questions[0]);
const updated=fs.readFileSync(page,'utf8');
for(const marker of ['THIS WEEK\'S INVITATION','{communityQuestionForWeek(new Date(now))}',
  'accessibilityLabel="City and country"','onSubmitEditing={search}',"onPress={()=>void locate()}",
  'setInterval(()=>setNow(Date.now()),60000)',"onPress={search}",
  'Choose your city or next destination to explore what is happening nearby.'])
 assert(updated.includes(marker),'Missing original Community input or invitation '+marker);
const first="import {communityQuestionForWeek} from '@/lib/community-weekly-question';";
const oldHead=' <View style={s.searchCard}><Text style={type.eyebrow}>WHERE WOULD YOU LIKE TO CONNECT?</Text><Text style={[type.card,{marginVertical:8}]}>Your city. Or your next destination.</Text>';
const newHead=" <View style={s.searchCard}>\n  <Text style={type.eyebrow}>THIS WEEK'S INVITATION</Text>\n  <Text accessibilityRole=\"header\" style={s.weeklyQuestion}>{communityQuestionForWeek(new Date(now))}</Text>\n  <Text style={s.searchHint}>Choose your city or next destination to explore what is happening nearby.</Text>";
const original=updated
 .replace(first+'\n','')
 .replace(newHead,oldHead)
 .replace('searchCard:{...surface.card,gap:6},weeklyQuestion:{...type.section,fontSize:21,lineHeight:29,marginTop:5,marginBottom:5},searchHint:{...type.caption,fontSize:12,lineHeight:19,marginBottom:12},card:{...surface.card,gap:10,marginVertical:12}',
 'searchCard:{...surface.card,gap:6},card:{...surface.card,gap:10,marginVertical:12}');
assert(!original.includes('communityQuestionForWeek'),'Fixture must be old version');
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-community-weekly-')),root=path.join(parent,'TreksorApp');
try{
 fs.mkdirSync(root);cp.execFileSync('git',['init',root],{stdio:'ignore'});
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 for(const f of [page,helperPath]){
  const dest=path.join(root,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(f,dest);
 }
 cp.execFileSync('git',['config','user.email','tests@treksor.invalid'],{cwd:root});
 cp.execFileSync('git',['config','user.name','Treksor Tests'],{cwd:root});
 cp.execFileSync('git',['add','--',page,helperPath],{cwd:root});
 cp.execFileSync('git',['commit','-m','fixture weekly Community'],{cwd:root,stdio:'ignore'});
 cp.execFileSync('git',['fetch','.','HEAD'],{cwd:root,stdio:'ignore'});
 fs.writeFileSync(path.join(root,page),original);
 fs.unlinkSync(path.join(root,helperPath));
 const run=(...args)=>cp.execFileSync(process.execPath,[patch,...args],{cwd:root,encoding:'utf8'});
 assert.match(run('--check'),/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,page),'utf8'),original,'Dry run never writes');
 assert.equal(fs.existsSync(path.join(root,helperPath)),false,'Dry run does not create modules');
 assert.match(run(),/COMMUNITY SEMANAL ACTUALIZADO/);
 assert.equal(fs.readFileSync(path.join(root,page),'utf8'),updated);
 assert.equal(fs.readFileSync(path.join(root,helperPath),'utf8'),fs.readFileSync(helperPath,'utf8'));
 assert.match(run(),/PREGUNTA SEMANAL YA APLICADA/);
 assert.equal(fs.readdirSync(parent).filter(v=>v.startsWith('Treksor-community-backup-')).length,1);
 console.log('PASS Community: exactly two fixed prompts, Monday local alternation across year boundaries, city search retained, guarded Windows installer and backup');
} finally {fs.rmSync(parent,{recursive:true,force:true});}
