// Applies only the verified reminder-date validation fix to the local consolidated worktree.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=process.cwd(),file=path.join(root,'app','notes','index.tsx');
if(!fs.existsSync(file)||!fs.existsSync(path.join(root,'package.json'))){console.error('Run inside TreksorDevCompleto. No changes made.');process.exit(1)}
const old=String.raw`if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time))`;
const fixed=String.raw`if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))`;
const source=fs.readFileSync(file,'utf8');
if(source.includes(fixed)){console.log('REMINDERS: already fixed. No files changed.');process.exit(0)}
if(source.split(old).length!==2){console.error('Different local version. No files changed. Send diagnostic.');process.exit(2)}
if(process.argv.includes('--check')){console.log('COMPATIBLE: one reminder validation fix available.');process.exit(0)}
const backup=path.resolve(root,'..','Treksor-quick-notes-'+Date.now()+'.tsx.backup');
fs.copyFileSync(file,backup);
fs.writeFileSync(file,source.replace(old,fixed));
console.log('REMINDERS: date/time validation corrected. Backup: '+backup);
