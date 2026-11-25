import NotificationBell from "@/components/NotificationBell";
import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useGlobalSearchParams, usePathname, useSegments, type Href } from 'expo-router';
import BrandIcon from '@/components/ui/BrandIcon';
import { FixedRouteContext } from '@/lib/navigation-frame-context';
import { routeTrail } from '@/lib/route-trail';
import { pillars, type PillarKey } from '@/lib/pillar-navigation';
import { colors, surface, type } from '@/theme/architect';
import { useAuthStore } from '@/store/auth-store';
export default function AppFrame({children,enabled}:{children:ReactNode;enabled:boolean}) {
  const pathname=usePathname(),segments=useSegments(),params=useGlobalSearchParams<{pillar?:string}>(),insets=useSafeAreaInsets();
  const trail=routeTrail(pathname,typeof params.pillar==='string'?params.pillar:undefined);
  const [picker,setPicker]=useState(false);
  // Measure the full fixed header, including the device safe area, so the menu
  // always opens immediately BELOW it (never over the route or iPhone status bar).
  const [headerHeight,setHeaderHeight]=useState(0);
  const user=useAuthStore(state=>state.user);
  useEffect(()=>setPicker(false),[pathname]);
  const visible=enabled&&trail.visible;
  // Main destinations share the brand identity and never show a back control.
  const routeSegments=segments.filter(segment=>!segment.startsWith('('));
  const primaryRoutes=new Set(['home','chat','tracking','community','body','mental','spiritual','purpose']);
  const primaryScreen=routeSegments.length===1&&primaryRoutes.has(routeSegments[0]);
  const isHome=routeSegments.length===1&&routeSegments[0]==='home';
  const firstName=user?.name?.trim().split(' ')[0]||'Explorer';
  const avatar=user?.avatar?(user.avatar.startsWith('http')?user.avatar:`https://app.treksor.com/${user.avatar.replace(/^\//,'')}`):undefined;
  const navigate=(route:string)=>{setPicker(false);router.dismissTo(route as Href)};
  const goHome=()=>{if(isHome)return;setPicker(false);router.replace(trail.home as Href)};
  return <FixedRouteContext.Provider value={visible}>
    <View style={s.root}>
      {visible&&<SafeAreaView edges={['top','left','right']} style={s.chrome} onLayout={event=>{
        const height=event.nativeEvent.layout.height;
        setHeaderHeight(previous=>previous===height?previous:height);
      }}>
        <View style={s.bar}>
          {!primaryScreen&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={s.back} onPress={()=>{if(picker)setPicker(false);else if(router.canGoBack())router.back();else navigate(trail.parent)}}><BrandIcon name="arrow-back" size={20} color={colors.text}/></TouchableOpacity>}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" accessibilityHint="Opens the main Home screen" activeOpacity={0.82} style={[s.identity,primaryScreen&&s.mainIdentity]} onPress={goHome}>
            <Image source={require('@/assets/images/appicon-treksor.png')} style={s.logo} contentFit="contain" />
            <View style={s.brandText}><Text numberOfLines={1} style={s.brandName}>TREKSOR</Text><Text numberOfLines={1} style={s.brandCaption}>BUILT WITH PURPOSE</Text></View>
          </TouchableOpacity>
          {!primaryScreen&&<Text numberOfLines={1} accessibilityRole="header" accessibilityLabel={`Current location: ${trail.label}`} style={s.trail}>{trail.label}</Text>}
          <View style={s.actions}>
            <NotificationBell/>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose a pillar" accessibilityState={{expanded:picker}} style={s.icon} onPress={()=>setPicker(value=>!value)}><BrandIcon name="grid-outline" size={22} color={colors.gold}/></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" style={s.avatarButton} onPress={()=>navigate('/profile')}>{avatar?<Image source={{uri:avatar}} style={s.avatar} contentFit="cover" cachePolicy="memory-disk"/>:<Text style={s.avatarLetter}>{firstName.charAt(0).toUpperCase()}</Text>}</TouchableOpacity>
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
  bar:{paddingHorizontal:12,paddingVertical:3,flexDirection:'row',alignItems:'center',gap:5,minHeight:50},
  identity:{flexDirection:'row',alignItems:'center',gap:8,minHeight:44,minWidth:90,paddingVertical:5,flexShrink:1},mainIdentity:{flex:1},logo:{width:34,height:34,borderRadius:9},
  brandText:{flex:1,minWidth:0},brandName:{...type.caption,fontSize:14.5,lineHeight:16,color:colors.text,fontWeight:'800',letterSpacing:1.3},brandCaption:{fontSize:10.5,lineHeight:12,color:colors.secondary,letterSpacing:0.5,fontWeight:'600'},
  trail:{...type.caption,color:colors.gold,flex:1,minWidth:0,marginHorizontal:3,fontWeight:'600',flexShrink:1},back:{width:34,height:42,alignItems:'center',justifyContent:'center'},
  actions:{flexDirection:'row',gap:3,marginLeft:'auto'},icon:{...surface.icon,width:38,height:40},avatarButton:{width:38,height:40,alignItems:'center',justifyContent:'center'},avatar:{width:32,height:32,borderRadius:16},avatarLetter:{width:32,height:32,borderRadius:16,overflow:'hidden',textAlign:'center',textAlignVertical:'center',backgroundColor:colors.surface,color:colors.gold,fontWeight:'700',paddingTop:7},
  pickerOverlay:{position:'absolute',left:0,right:0,zIndex:30,elevation:30,paddingHorizontal:12},
  picker:{flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14},
  choice:{flex:1,minHeight:66,alignItems:'center',justifyContent:'center',gap:7,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:13},
});
