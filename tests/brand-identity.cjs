const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const nodes = require('../design/brand/icons.json');
const source = fs.readFileSync('components/ui/BrandIcon.tsx','utf8');
const moduleMock = {exports:{}};
const fallback = ({name}) => React.createElement('span',{'data-fallback':name});
fallback.glyphMap = {};
const mocks = {
  react:React, 'react/jsx-runtime':require('react/jsx-runtime'),
  '@expo/vector-icons':{Ionicons:fallback},
  'react-native':{View:({children,accessibilityLabel}) => React.createElement('div',{'aria-label':accessibilityLabel},children)},
  'react-native-svg':{SvgXml:({xml,width,height,color}) => React.createElement('span',{'data-size':`${width}x${height}`,style:{color},dangerouslySetInnerHTML:{__html:xml}})},
  '@/design/brand/icons.json':nodes,
};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,
  {module:moduleMock,exports:moduleMock.exports,require:name=>{assert(name in mocks,name);return mocks[name]}});
const Icon=moduleMock.exports.default;
const web=fs.readFileSync('web/treksor-community/dist/app.js','utf8');
const webIcons=vm.runInNewContext(web.slice(web.indexOf('const icons ='),web.indexOf('const icon ='))+';icons');
for(const [name,key,webKey] of [['barbell-outline','body','body'],['brain','mind','mind'],['leaf-outline','balance','balance'],['compass-outline','purpose','compass'],['people-outline','community','people']]){
  for(const size of [16,24,44]){
    const html=renderToStaticMarkup(React.createElement(Icon,{name,size,color:'#D7B877',accessibilityLabel:key}));
    assert(html.includes(webIcons[webKey]),`${key}: app/web geometry diverged`);
    assert(html.includes('stroke-width="2"'));
    assert(html.includes(`data-size="${size}x${size}"`));
    assert(html.includes(`aria-label="${key}"`));
  }
}
assert(renderToStaticMarkup(React.createElement(Icon,{name:'close'})).includes('data-fallback="close"'));
const mark=fs.readFileSync('assets/images/appicon-treksor.png');
for(const file of ['assets/images/favicon.png','assets/images/adaptive-icon.png','web/treksor-community/dist/assets/treksor-mark.png','watch/Companion/Assets.xcassets/TreksorMark.imageset/treksor-mark.png','watch/Companion/Assets.xcassets/AppIcon.appiconset/mark.png']) assert(mark.equals(fs.readFileSync(file)),file);
console.log('PASS: identical app/web pillar geometry at 16/24/44px, stroke, labels, fallback controls and canonical logo bytes across mobile/web/watch');
