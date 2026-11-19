import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import nodes from '@/design/brand/icons.json';

// Pinned to the dashboard's Lucide 0.468.0 paths. Other controls retain their icons.
const names: Record<string, keyof typeof nodes> = {
  'barbell-outline':'body', 'barbell':'body', brain:'mind',
  'leaf-outline':'balance', leaf:'balance', 'compass-outline':'purpose', compass:'purpose',
  'people-outline':'community', people:'community', 'home-outline':'home', home:'home', 'home-sharp':'home',
  'document-text-outline':'articles', 'bulb-outline':'thought',
  'guide-outline':'guide', 'sparkles-outline':'guide', sparkles:'guide', 'analytics-outline':'progress',
};
const markup = Object.fromEntries(Object.entries(nodes).map(([name, shapes]) => [name,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key,value]) => `${key}="${value}"`).join(' ')}/>`).join('')}</svg>`
]));
export const GUIDE_ICON = 'guide-outline' as const;
export const HOME_ICON = 'home-outline' as const;
type Props = Omit<React.ComponentProps<typeof Ionicons>, 'name'> & {name: React.ComponentProps<typeof Ionicons>['name'] | 'brain' | typeof GUIDE_ICON};
function BrandIcon({name, size=24, color, style, ...props}: Props) {
  const key = name && names[name];
  if (!key) return <Ionicons {...props} name={name as React.ComponentProps<typeof Ionicons>['name']} size={size} color={color} style={style}/>;
  // Ionicons accepts TextStyle, whose web cursor can be broader than ViewStyle.
  // SVG icons are decorative; retain layout styles without forwarding a text cursor.
  const {cursor: _textCursor, ...containerStyle} = StyleSheet.flatten(style) || {};
  return <View style={[{width:size,height:size},containerStyle]} accessibilityLabel={props.accessibilityLabel} accessible={!!props.accessibilityLabel} testID={props.testID} pointerEvents="none">
    <SvgXml xml={markup[key]} width={size} height={size} color={color} />
  </View>;
}
BrandIcon.glyphMap = {...Ionicons.glyphMap, brain:0};
export default BrandIcon;
