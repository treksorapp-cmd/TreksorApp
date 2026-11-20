'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),ts=require('typescript');
const screen='app/(tabs)/chat/index.tsx',helper='lib/guide-keyboard.ts',patch=path.resolve('patches/guide-keyboard-windows.cjs');
const chat=fs.readFileSync(screen,'utf8'),helperSource=fs.readFileSync(helper,'utf8');
const mod={exports:{}};
const transpiled=ts.transpileModule(helperSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('module','exports',transpiled)(mod,mod.exports);
const inset=mod.exports.guideKeyboardInset;
assert.equal(inset(1570,940),630,'Original screenshot: composer must move above the keyboard');
assert.equal(inset(920,940),0,'Avoid double offset when the navigator has already resized');
assert.equal(inset(940,940),0,'Touching keyboard boundary is not an overlap');
assert.equal(inset(1570,null),0,'No keyboard, no bottom padding');
assert.equal(inset(1570,1570),0);
assert.equal(inset(NaN,940),0);
assert.equal(inset(1570,Infinity),0);
assert.equal(inset(1570,940.5),630,'Round overlap upwards, not downwards');
assert(chat.includes('Keyboard.addListener("keyboardWillChangeFrame", show)'));
assert(chat.includes('Keyboard.addListener("keyboardWillHide", hide)'));
assert(chat.includes('measureInWindow('),'Measure actual viewport position on screen');
assert(chat.includes('ref={rootRef} onLayout={measureViewport}'),'Re-measure when the scene resizes');
assert(chat.includes('guideKeyboardInset(viewportBottom, keyboardTop)'));
assert(chat.includes('paddingBottom:keyboardInset'),'Keyboard overlap is applied to the whole chat layout');
assert(chat.includes('keyboardShouldPersistTaps="handled"'),'Taps on suggestions should work while editing');
assert(chat.includes('keyboardDismissMode="interactive"'),'Allow interactive keyboard dismissal');
assert(chat.includes('minHeight: 0,')&&chat.includes('messagesList: {'),'Messages list must be able to shrink');
assert(chat.includes('value={inputText}')&&chat.includes('onChangeText={setInputText}'),'Draft text must remain intact');
assert(chat.includes('disabled={!inputText.trim() || loading}'),'Keep original Send behavior');
assert(!chat.includes('<KeyboardAvoidingView style={styles.container}'),'Do not stack two keyboard offsets');
assert(fs.readFileSync('app/(tabs)/_layout.tsx','utf8').includes('tabBarHideOnKeyboard: true'),'Tab bar should hide as user types');
function reverseVersion(){
 let s=chat;
 function undo(from,to){assert(s.includes(from),'Missing fixture anchor '+from.slice(0,70));s=s.replace(from,to);}
 undo('import {guideKeyboardInset} from "@/lib/guide-keyboard";\n','');
 undo('  Keyboard,\n  FlatList,\n','  Keyboard,\n  FlatList,\n  KeyboardAvoidingView,\n');
 undo('} from "react-native"\n\nconst { width }','} from "react-native"\nimport { useSafeAreaInsets } from "react-native-safe-area-context"\n\nconst { width }');
 undo('export default function ChatScreen() {\n','export default function ChatScreen() {\n  const insets = useSafeAreaInsets()\n');
 const begin=s.indexOf('  const rootRef = useRef<View>(null)'),end=s.indexOf('  const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)',begin);
 assert(begin>=0&&end>begin);
 s=s.slice(0,begin)+
  '  const [keyboardHeight, setKeyboardHeight] = useState(0)\n'+
  '  useEffect(() => {\n'+
  '    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", e => setKeyboardHeight(e.endCoordinates.height))\n'+
  '    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardHeight(0))\n'+
  '    return () => { show.remove(); hide.remove() }\n'+
  '  }, [])'+s.slice(end+'  const keyboardInset = guideKeyboardInset(viewportBottom, keyboardTop)'.length);
 undo('    <View ref={rootRef} onLayout={measureViewport} style={[styles.container, {paddingBottom:keyboardInset}]}>',
    '    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>');
 undo('        style={styles.messagesList}\n        keyboardDismissMode="interactive"\n        keyboardShouldPersistTaps="handled"\n        contentContainerStyle={styles.messagesContent}',
    '        style={styles.messagesList}\n        contentContainerStyle={styles.messagesContent}');
 undo('      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 8 : 16 }]}>',
    '      <View style={[styles.inputContainer, { paddingBottom: keyboardHeight > 0 ? 12 : 16, marginBottom: keyboardHeight > 0 ? 12 : 0 }]}>');
 undo('            selectionColor={colors.gold}\n','');
 undo('    </View>\n  )\n}\n\nconst styles', '    </KeyboardAvoidingView>\n  )\n}\n\nconst styles');
 undo('  messagesList: {\n    flex: 1,\n    minHeight: 0,\n  },',
   '  messagesList: {\n    flex: 1,\n  },');
 undo('    paddingVertical: 12,\n    gap: 12,\n    backgroundColor: colors.background,\n    borderTopWidth: 1,\n    borderTopColor: colors.border,',
   '    paddingVertical: 15,\n    gap: 12,\n    backgroundColor: colors.background,');
 return s;
}
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-guide-keyboard-')),project=path.join(parent,'TreksorApp');
try{
 fs.mkdirSync(project);cp.execFileSync('git',['init',project],{stdio:'ignore'});
 const out=path.join(project,screen),helperOut=path.join(project,helper);
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.mkdirSync(path.dirname(helperOut),{recursive:true});
 fs.symlinkSync(path.resolve('node_modules'),path.join(project,'node_modules'),'dir');
 fs.writeFileSync(helperOut,helperSource);
 cp.execFileSync('git',['config','user.email','test@treksor.invalid'],{cwd:project});
 cp.execFileSync('git',['config','user.name','Treksor QA'],{cwd:project});
 cp.execFileSync('git',['add','--',helper],{cwd:project});
 cp.execFileSync('git',['commit','-m','keyboard helper fixture'],{cwd:project,stdio:'ignore'});
 cp.execFileSync('git',['fetch','.','HEAD'],{cwd:project,stdio:'ignore'});
 fs.unlinkSync(helperOut);
 const before=reverseVersion();
 assert.notEqual(before,chat);
 fs.writeFileSync(out,before);
 const run=(...args)=>cp.spawnSync(process.execPath,[patch,...args],{cwd:project,encoding:'utf8'});
 const dry=run('--check');assert.equal(dry.status,0,dry.stderr);assert.match(dry.stdout,/COMPATIBLE/);
 assert.equal(fs.readFileSync(out,'utf8'),before);
 assert.equal(fs.existsSync(helperOut),false,'Dry-run must not create helper');
 const applied=run();assert.equal(applied.status,0,applied.stderr);assert.match(applied.stdout,/GUIDE KEYBOARD CORREGIDO/);
 assert.equal(fs.readFileSync(out,'utf8'),chat,'Installer must reconstruct reviewed Guide code');
 assert.equal(fs.readFileSync(helperOut,'utf8'),helperSource);
 const retry=run();assert.equal(retry.status,0,retry.stderr);assert.match(retry.stdout,/GUIDE YA CORREGIDO/);
 assert.equal(fs.readdirSync(parent).filter(v=>v.startsWith('Treksor-guide-keyboard-backup-')).length,1);
 console.log('PASS Guide keyboard: screen-coordinate overlap, navigator resize, draft retention, fixed composer, Windows dry run and backup');
}finally{fs.rmSync(parent,{recursive:true,force:true});}
