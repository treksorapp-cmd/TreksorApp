import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useGlobalSearchParams, usePathname, type Href } from 'expo-router';
import BrandIcon from '@/components/ui/BrandIcon';
import { FixedRouteContext } from '@/lib/navigation-frame-context';
import { routeTrail } from '@/lib/route-trail';
import { pillars, type PillarKey } from '@/lib/pillar-navigation';
import { colors, surface, type } from '@/theme/architect';
export default function AppFrame({children,enabled}:{children:ReactNode;enabled:boolean}) {
  const pathname=usePathname(),params=useGlobalSearchParams<{pillar?:string}>(),insets=useSafeAreaInsets();
  const trail=routeTrail(pathname,typeof params.pillar==='string'?params.pillar:undefined);
  const [picker,setPicker]=useState(false);
  useEffect(()=>setPicker(false),[pathname]);
  const visible=enabled&&trail.visible;
  const destination=trail.pillar?pillars[trail.pillar]:null;
  const navigate=(route:string)=>{setPicker(false);router.dismissTo(route as Href)};
  return <FixedRouteContext.Provider value={visible}>
    <View style={s.root}>
      {visible&&<SafeAreaView edges={['top','left','right']} style={s.chrome}>
        <View style={s.bar}>
          <Text accessibilityRole="header" accessibilityLabel={`Current location: ${trail.label}`} style={s.trail}>{trail.label}</Text>
          <View style={s.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={s.icon} onPress={()=>{if(picker)setPicker(false);else if(router.canGoBack())router.back();else navigate(trail.parent)}}><BrandIcon name="arrow-back" size={21} color={colors.text}/></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={s.icon} onPress={()=>navigate(trail.home)}><BrandIcon name="home-outline" size={21} color={colors.text}/></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={destination?`Return to ${destination.name}`:'Choose a pillar'} accessibilityState={destination?undefined:{expanded:picker}} style={s.icon} onPress={()=>destination?navigate(destination.route):setPicker(value=>!value)}><BrandIcon name={destination?.icon??'grid-outline'} size={22} color={colors.gold}/></TouchableOpacity>
          </View>
        </View>
        {picker&&<View style={s.picker}>{(Object.keys(pillars) as PillarKey[]).map(key=><TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={`Open ${pillars[key].name}`} onPress={()=>navigate(pillars[key].route)} style={s.choice}><BrandIcon name={pillars[key].icon} size={22} color={colors.gold}/><Text style={type.caption}>{pillars[key].name}</Text></TouchableOpacity>)}</View>}
      </SafeAreaView>}
      <SafeAreaInsetsContext.Provider value={visible?{...insets,top:0}:insets}>
        <View style={s.content}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  </FixedRouteContext.Provider>;
}
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.background},content:{flex:1,minHeight:0},
  chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border},
  bar:{paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:10},
  trail:{...type.caption,color:colors.gold,flex:1,fontWeight:'600',flexShrink:1},
  actions:{flexDirection:'row',gap:6},icon:{...surface.icon},
  picker:{flexDirection:'row',paddingHorizontal:16,paddingBottom:12,gap:8},
  choice:{flex:1,minHeight:66,alignItems:'center',justifyContent:'center',gap:7,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:13},
});
