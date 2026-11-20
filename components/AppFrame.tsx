import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useGlobalSearchParams, usePathname, type Href } from 'expo-router';
import BrandIcon, { HOME_ICON } from '@/components/ui/BrandIcon';
import { FixedRouteContext } from '@/lib/navigation-frame-context';
import { routeTrail } from '@/lib/route-trail';
import { pillars, type PillarKey } from '@/lib/pillar-navigation';
import { colors, surface, type } from '@/theme/architect';
export default function AppFrame({children,enabled}:{children:ReactNode;enabled:boolean}) {
  const pathname=usePathname(),params=useGlobalSearchParams<{pillar?:string}>(),insets=useSafeAreaInsets();
  const trail=routeTrail(pathname,typeof params.pillar==='string'?params.pillar:undefined);
  const [picker,setPicker]=useState(false);
  // Measure the full fixed header, including the device safe area, so the menu
  // always opens immediately BELOW it (never over the route or iPhone status bar).
  const [headerHeight,setHeaderHeight]=useState(0);
  useEffect(()=>setPicker(false),[pathname]);
  const visible=enabled&&trail.visible;
  // The Home destination is redundant when the current screen is already Home.
  const isHome=pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/';
  const primaryTab=new Set(['/','/home','/chat','/tracking','/community','/(tabs)/home','/(tabs)/chat','/(tabs)/tracking','/(tabs)/community']).has(pathname);
  const destination=trail.pillar?pillars[trail.pillar]:null;
  const navigate=(route:string)=>{setPicker(false);router.dismissTo(route as Href)};
  return <FixedRouteContext.Provider value={visible}>
    <View style={s.root}>
      {visible&&<SafeAreaView edges={['top','left','right']} style={s.chrome} onLayout={event=>{
        const height=event.nativeEvent.layout.height;
        setHeaderHeight(previous=>previous===height?previous:height);
      }}>
        <View style={s.bar}>
          <Text accessibilityRole="header" accessibilityLabel={`Current location: ${trail.label}`} style={s.trail}>{trail.label}</Text>
          <View style={s.actions}>
            {!primaryTab && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={s.icon} onPress={()=>{if(picker)setPicker(false);else if(router.canGoBack())router.back();else navigate(trail.parent)}}><BrandIcon name="arrow-back" size={21} color={colors.text}/></TouchableOpacity>}
            {!primaryTab && !isHome && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={s.icon} onPress={()=>navigate(trail.home)}><BrandIcon name={HOME_ICON} size={21} color={colors.text}/></TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={destination?`Return to ${destination.name}`:'Choose a pillar'} accessibilityState={destination?undefined:{expanded:picker}} style={s.icon} onPress={()=>destination?navigate(destination.route):setPicker(value=>!value)}><BrandIcon name={destination?.icon??'grid-outline'} size={22} color={colors.gold}/></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>}
      {visible && picker && headerHeight > 0 && <View pointerEvents="box-none" style={[s.pickerOverlay,{top:headerHeight}]}>
        <View style={s.picker}>{(Object.keys(pillars) as PillarKey[]).map(key=><TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`Open ${pillars[key].name}`} onPress={()=>navigate(pillars[key].route)} style={s.choice}><BrandIcon name={pillars[key].icon} size={22} color={colors.gold}/><Text style={type.caption}>{pillars[key].name}</Text></TouchableOpacity>)}</View>
      </View>}
      <SafeAreaInsetsContext.Provider value={visible?{...insets,top:0}:insets}>
        <View style={s.content}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  </FixedRouteContext.Provider>;
}
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.background},content:{flex:1,minHeight:0},
  chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:40,elevation:40},
  bar:{paddingHorizontal:16,paddingVertical:4,flexDirection:'row',alignItems:'center',gap:10},
  trail:{...type.caption,color:colors.gold,flex:1,fontWeight:'600',flexShrink:1},
  actions:{flexDirection:'row',gap:6},icon:{...surface.icon,width:42,height:42},
  pickerOverlay:{position:'absolute',left:0,right:0,zIndex:30,elevation:30,paddingHorizontal:12},
  picker:{flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14},
  choice:{flex:1,minHeight:66,alignItems:'center',justifyContent:'center',gap:7,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:13},
});
