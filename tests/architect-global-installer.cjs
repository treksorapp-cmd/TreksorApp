'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const installer=path.resolve('patches/apply-architect-global-windows.cjs');
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-architect-merge-test-')),root=path.join(parent,'TreksorApp');
const paths=['theme/architect.ts','components/AppFrame.tsx','app/(tabs)/community/index.tsx'];
const baseFiles={
 'theme/architect.ts':"export const colors = {\n  background: '#05080D',\n};\nexport const type = {};\n",
 'components/AppFrame.tsx':"import React from 'react';\nconst chrome = {\n  borderWidth: 1,\n  backgroundColor: '#05080D',\n  borderRadius: 12,\n  paddingVertical: 6,\n};\nexport const AppFrame = chrome;\n",
 'app/(tabs)/community/index.tsx':"import React from 'react';\nconst title = 'Community';\nconst subtitle = 'Explore';\nconst text = 'Nearby';\nconst header = {\n  color: '#fff',\n  marginTop: 12,\n};\nconst footer = 'Preserve local custom copy';\nexport default function Community(){return null;}\n"
};
const targetFiles={
 'theme/architect.ts':baseFiles['theme/architect.ts'].replace("export const type = {};","export const layout = { pageTop: 8 };\nexport const type = {};"),
 'components/AppFrame.tsx':baseFiles['components/AppFrame.tsx'].replace('paddingVertical: 6','paddingVertical: 4'),
 'app/(tabs)/community/index.tsx':baseFiles['app/(tabs)/community/index.tsx'].replace('marginTop: 12','marginTop: 4')
};
function runGit(...args){return cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();}
function write(file,content){const p=path.join(root,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);}
function execScript(base,remote,...args){
 return cp.spawnSync(process.execPath,[installer,...args],{cwd:root,encoding:'utf8',
  env:{...process.env,TREKSOR_ARCHITECT_TEST_BASE:base,TREKSOR_ARCHITECT_TEST_REMOTE:remote}});
}
try{
 fs.mkdirSync(root);
 runGit('init');
 runGit('config','user.email','test@treksor.invalid');
 runGit('config','user.name','Treksor Tests');
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 for(const f of paths)write(f,baseFiles[f]);
 runGit('add','--',...paths);runGit('commit','-m','Baseline');
 const base=runGit('rev-parse','HEAD');
 for(const f of paths)write(f,targetFiles[f]);
 runGit('add','--',...paths);runGit('commit','-m','The Architect revision');
 const remote=runGit('rev-parse','HEAD');
 for(const f of paths)write(f,baseFiles[f]);
 const privateFooter="const footer = 'Local user content must survive';";
 write(paths[2],baseFiles[paths[2]].replace("const footer = 'Preserve local custom copy';",privateFooter));
 const before=fs.readFileSync(path.join(root,paths[2]),'utf8');
 const dry=execScript(base,remote,'--check');
 assert.equal(dry.status,0,'Dry run: '+dry.stderr);
 assert.match(dry.stdout,/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,paths[2]),'utf8'),before,'Dry run must not write');
 const applied=execScript(base,remote);
 assert.equal(applied.status,0,'Apply: '+applied.stderr);
 assert.match(applied.stdout,/THE ARCHITECT GLOBAL APLICADO/);
 assert(fs.readFileSync(path.join(root,paths[0]),'utf8').includes('export const layout'));
 assert(fs.readFileSync(path.join(root,paths[1]),'utf8').includes('paddingVertical: 4'));
 const merged=fs.readFileSync(path.join(root,paths[2]),'utf8');
 assert(merged.includes('marginTop: 4'),'The new top spacing must be applied');
 assert(merged.includes(privateFooter),'Independent local copy must be retained');
 const retry=execScript(base,remote);
 assert.equal(retry.status,0,'Retry must be idempotent: '+retry.stderr);
 assert.match(retry.stdout,/THE ARCHITECT YA ACTUALIZADO/);
 assert.equal(fs.readdirSync(parent).filter(name=>name.startsWith('Treksor-architect-backup-')).length,1);
 // A change to the same line as the feature should abort the entire operation.
 const conflicting=baseFiles[paths[2]].replace('marginTop: 12','marginTop: 19');
 write(paths[2],conflicting);
 const check=execScript(base,remote,'--check');
 assert.notEqual(check.status,0,'Overlapping local change must block the install');
 assert.equal(fs.readFileSync(path.join(root,paths[2]),'utf8'),conflicting,'Conflicts must not overwrite anything');
 console.log('PASS Architect installer: dry run, clean merge of 3 files, local copy retained, rollback backup, idempotency and conflict guard');
}finally{fs.rmSync(parent,{recursive:true,force:true});}
