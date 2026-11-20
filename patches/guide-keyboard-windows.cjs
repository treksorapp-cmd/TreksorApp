'use strict';
// Fix the Guide message field hidden behind the iPhone keyboard.
// Applies only one chat screen and one new pure helper. Never checkout/merge/reset.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),screen='app/(tabs)/chat/index.tsx',helper='lib/guide-keyboard.ts';
const fail=reason=>{throw Error(reason+' No se modifico ningun archivo.');};
const git=args=>{const out=cp.spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});if(out.status!==0)fail('Error de Git: '+out.stderr.trim());return out.stdout;};
const top=git(['rev-parse','--show-toplevel']).trim();
if(path.resolve(top)!==path.resolve(root))fail('Ejecuta el comando dentro de TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)fail('Hay un merge incompleto.');
if(!fs.existsSync(screen))fail('No se encontro la pantalla Guide.');
const helperContent=git(['show','FETCH_HEAD:'+helper]);
if(!helperContent.includes('export function guideKeyboardInset('))fail('Falta el modulo Guide de la rama correcta.');
const raw=fs.readFileSync(screen),original=raw.toString('utf8'),eol=original.includes('\r\n')?'\r\n':'\n';
let next=original.replace(/\r\n/g,'\n');
function replaceOne(oldText,newText,label){
 if(newText && next.includes(newText))return;
 const i=next.indexOf(oldText);
 if(i<0||next.indexOf(oldText,i+oldText.length)>=0)fail('Tu pantalla Guide tiene una estructura diferente: '+label);
 next=next.replace(oldText,newText);
}
const complete=next.includes('const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)') &&
 next.includes('ref={rootRef} onLayout={measureViewport}') &&
 next.includes('keyboardShouldPersistTaps="handled"');
if(!complete){
 replaceOne('import MentorCompanion from "@/components/mentor/MentorCompanion";',
  'import MentorCompanion from "@/components/mentor/MentorCompanion";\nimport {guideKeyboardInset} from "@/lib/guide-keyboard";','importar el ajuste');
 replaceOne('  KeyboardAvoidingView,\n','','retirar teclado automatico');
 replaceOne('import { useSafeAreaInsets } from "react-native-safe-area-context"\n','','retirar safe area duplicada');
 replaceOne('  const insets = useSafeAreaInsets()\n','','retirar inset');
 const oldListener='  const [keyboardHeight, setKeyboardHeight] = useState(0)\n'+
  '  useEffect(() => {\n'+
  '    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", e => setKeyboardHeight(e.endCoordinates.height))\n'+
  '    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardHeight(0))\n'+
  '    return () => { show.remove(); hide.remove() }\n'+
  '  }, [])';
 const newListener='  const rootRef = useRef<View>(null)\n'+
  '  const [keyboardHeight, setKeyboardHeight] = useState(0)\n'+
  '  const [keyboardTop, setKeyboardTop] = useState<number | null>(null)\n'+
  '  const [viewportBottom, setViewportBottom] = useState(Dimensions.get("screen").height)\n'+
  '  const measureViewport = useCallback(() => {\n'+
  '    rootRef.current?.measureInWindow((_x, y, _width, height) => {\n'+
  '      if (height <= 0) return\n'+
  '      const bottom = y + height\n'+
  '      setViewportBottom(previous => Math.abs(previous - bottom) < 1 ? previous : bottom)\n'+
  '    })\n'+
  '  }, [])\n'+
  '  useEffect(() => {\n'+
  '    const show = (event: {endCoordinates: {height: number; screenY: number}}) => {\n'+
  '      setKeyboardHeight(event.endCoordinates.height)\n'+
  '      setKeyboardTop(event.endCoordinates.screenY)\n'+
  '      requestAnimationFrame(measureViewport)\n'+
  '    }\n'+
  '    const hide = () => {\n'+
  '      setKeyboardHeight(0)\n'+
  '      setKeyboardTop(null)\n'+
  '      requestAnimationFrame(measureViewport)\n'+
  '    }\n'+
  '    const listeners = Platform.OS === "ios"\n'+
  '      ? [\n'+
  '          Keyboard.addListener("keyboardWillShow", show),\n'+
  '          Keyboard.addListener("keyboardWillChangeFrame", show),\n'+
  '          Keyboard.addListener("keyboardDidShow", show),\n'+
  '          Keyboard.addListener("keyboardWillHide", hide),\n'+
  '          Keyboard.addListener("keyboardDidHide", hide),\n'+
  '        ]\n'+
  '      : [Keyboard.addListener("keyboardDidShow", show), Keyboard.addListener("keyboardDidHide", hide)]\n'+
  '    requestAnimationFrame(measureViewport)\n'+
  '    return () => listeners.forEach(listener => listener.remove())\n'+
  '  }, [measureViewport])\n'+
  '  // The tab bar may hide or the navigator may already resize when the keyboard\n'+
  '  // opens. Only compensate for the portion overlapping the actual chat viewport.\n'+
  '  const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)';
 replaceOne(oldListener,newListener,'posicion del teclado');
 replaceOne('    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>',
   '    <View ref={rootRef} onLayout={measureViewport} style={[styles.container, {paddingBottom:keyboardInset}]}>','compositor principal');
 replaceOne('        style={styles.messagesList}\n        contentContainerStyle={styles.messagesContent}',
   '        style={styles.messagesList}\n        keyboardDismissMode="interactive"\n        keyboardShouldPersistTaps="handled"\n        contentContainerStyle={styles.messagesContent}','lista de mensajes');
 replaceOne('      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 12 : 16, marginBottom: keyboardHeight > 0 ? 12 : 0 }]}>',
   '      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 8 : 16 }]}>','campo de texto');
 replaceOne('            multiline\n            scrollEnabled','            multiline\n            selectionColor={colors.gold}\n            scrollEnabled','seleccion del texto');
 replaceOne('    </KeyboardAvoidingView>\n  )','    </View>\n  )','contenedor del chat');
 replaceOne('  messagesList: {\n    flex: 1,\n  },','  messagesList: {\n    flex: 1,\n    minHeight: 0,\n  },','altura de los mensajes');
 replaceOne('    paddingVertical: 15,\n    gap: 12,\n    backgroundColor: colors.background,',
   '    paddingVertical: 12,\n    gap: 12,\n    backgroundColor: colors.background,\n    borderTopWidth: 1,\n    borderTopColor: colors.border,','barra de escritura');
}
if(!next.includes('const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)') ||
 !next.includes('ref={rootRef} onLayout={measureViewport}') ||
 !next.includes('keyboardShouldPersistTaps="handled"'))fail('El cambio no quedo completo.');
const ts=require(require.resolve('typescript',{paths:[root]}));
const oldAst=ts.createSourceFile(screen,original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const newAst=ts.createSourceFile(screen,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const helperAst=ts.createSourceFile(helper,helperContent,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
if(newAst.parseDiagnostics.length>oldAst.parseDiagnostics.length||helperAst.parseDiagnostics.length)fail('Se detecto un problema nuevo de sintaxis.');
const oldHelper=fs.existsSync(helper)?fs.readFileSync(helper):null;
if(oldHelper&&oldHelper.toString('utf8').replace(/\r\n/g,'\n').trimEnd()!==helperContent.trimEnd())
 fail('Existe un archivo personalizado '+helper+'.');
const changed=next.replace(/\n/g,eol)!==original,createHelper=!oldHelper;
console.log('Guide: '+Number(changed)+' pantalla y '+Number(createHelper)+' modulo para actualizar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se escribio nada.');process.exit(0);}
if(!changed&&!createHelper){console.log('GUIDE YA CORREGIDO.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-guide-keyboard-backup-'));
const dest=path.join(backup,screen);
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,raw);
const written=[];
try{
 if(createHelper){if(fs.existsSync(helper))throw Error('El modulo cambio durante la preparacion.');fs.writeFileSync(helper,helperContent);written.push(helper);}
 if(changed){if(!fs.readFileSync(screen).equals(raw))throw Error('Guide cambio durante la preparacion.');fs.writeFileSync(screen,next.replace(/\n/g,eol));written.push(screen);}
}catch(err){
 if(written.includes(screen))fs.writeFileSync(screen,raw);
 if(written.includes(helper))fs.unlinkSync(helper);
 throw err;
}
console.log('GUIDE KEYBOARD CORREGIDO. Respaldo: '+backup);
console.log('El campo de texto se mueve encima del teclado sin tapar los mensajes.');
