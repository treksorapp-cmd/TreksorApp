// Shared by the source migration and the guarded Windows updater.
module.exports=function navyTransform(file,source,ts){
  const original=source,eol=source.includes('\r\n')?'\r\n':'\n';
  source=source.replace(/\r\n/g,'\n');
  const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const edits=[];
  const backgrounds=new Set(['#02050c','#05080d','#070b11','#09111b','#040505']);
  const surfaces=new Set(['#0b1017','#111820','#0e1823','#141c23','#111b27','#111a25','#131c27','#131a22','#11151a','#151b22','#0a0a0a','#121212','#1a1a1a']);
  const raised=new Set(['#121922','#19222c','#26313c','#23303b','#18212c','#262626','#34404a']);
  let needsOverlay=false;
  function styleProperty(node){let p=node.parent;while(p&&!ts.isSourceFile(p)){if(ts.isPropertyAssignment(p)||ts.isJsxAttribute(p))return p.name.getText(parsed);p=p.parent}return '';}
  function visit(node){
    if(ts.isStringLiteral(node)){
      const value=node.text.toLowerCase(),prop=styleProperty(node);
      let next=backgrounds.has(value)?'colors.background':surfaces.has(value)?'colors.surface':raised.has(value)?'colors.surfaceRaised':null;
      const background=prop==='backgroundColor'||prop==='colors';
      if(background&&/^#[0-9a-f]{6}$/.test(value)){
        const channels=value.slice(1).match(/../g).map(v=>parseInt(v,16)),max=Math.max(...channels);
        if(max<90&&!next)next=max>40?'colors.surfaceRaised':max>16?'colors.surface':'colors.background';
      }
      if(background&&['#000','#000000','#101010','#0009'].includes(value))next=value==='#0009'?'navyOverlay(0.6)':'colors.background';
      const rgba=/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(value);
      if(background&&rgba&&rgba.slice(1,4).every(v=>Number(v)<80))next=`navyOverlay(${Number(rgba[4])})`;
      if(/border.*color/i.test(prop)&&rgba&&rgba.slice(1,4).every(v=>Number(v)>=180)&&Number(rgba[4])<=0.4)next='colors.border';
      if(next){if(next.startsWith('navyOverlay'))needsOverlay=true;edits.push({start:node.getStart(parsed),end:node.getEnd(),next})}
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  if(!edits.length)return original;
  for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.next+source.slice(edit.end);
  const imported=/import\s*\{([^}]+)\}\s*from\s*["']@\/theme\/architect["'];?/;
  const match=source.match(imported);
  const needed=['colors',...(needsOverlay?['navyOverlay']:[])];
  if(match){const names=match[1].split(',').map(v=>v.trim());for(const name of needed)if(!names.includes(name))names.push(name);source=source.replace(imported,`import { ${names.join(', ')} } from "@/theme/architect";`)}
  else source=`import { ${needed.join(', ')} } from "@/theme/architect";\n`+source;
  return source.replace(/\n/g,eol);
};
