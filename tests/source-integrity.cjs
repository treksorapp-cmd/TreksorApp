const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=process.cwd(),findings=[];let screens=0;
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){walk(file);continue;}
  if(!file.endsWith('.tsx'))continue;
  if(file.includes('/app/')&&!file.endsWith('_layout.tsx'))screens++;
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const names=new Set(),references=[];
  function visit(node){
   if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='styles'&&node.initializer&&ts.isCallExpression(node.initializer)){
    const object=node.initializer.arguments[0];
    if(object&&ts.isObjectLiteralExpression(object))for(const property of object.properties)if(property.name)names.add(property.name.getText(source));
   }
   if(ts.isPropertyAccessExpression(node)&&node.expression.getText(source)==='styles')references.push(node.name.text);
   if(ts.isCallExpression(node)&&node.expression.getText(source)==='require'&&node.arguments[0]&&ts.isStringLiteralLike(node.arguments[0])){
    const value=node.arguments[0].text;
    if(/\.(png|jpg|jpeg|mp4|mp3)$/.test(value)){
     const asset=value.startsWith('@/')?path.join(root,value.slice(2)):path.resolve(path.dirname(file),value);
     if(!fs.existsSync(asset))findings.push([path.relative(root,file),'missing asset',value]);
    }
   }
   ts.forEachChild(node,visit);
  }
  visit(source);
  for(const reference of references)if(names.size&&!names.has(reference))findings.push([path.relative(root,file),'missing style',reference]);
 }
}
walk(path.join(root,'app'));walk(path.join(root,'components'));
if(findings.length){console.error(findings);process.exitCode=1;}
else console.log(`PASS: ${screens} screen modules and all component style references / bundled media paths`);
