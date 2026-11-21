import React from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import BodyPageHeading from "@/components/BodyPageHeading";
import { colors, type, navyOverlay, layout } from "@/theme/architect";
type Props = {
    title: string;
    trail: string;
    image?: number;
    subtitle?: string;
    compactHeader?: boolean;
    children: React.ReactNode;
};
export default function PillarMenuScreen({ title, trail, image, subtitle, compactHeader, children }: Props) {
    const { height } = useWindowDimensions();
    return <View style={styles.screen}>
    {image !== undefined ? <ImageBackground source={image} style={StyleSheet.absoluteFill} contentFit="cover"/> : null}
    {image !== undefined ? <LinearGradient colors={[navyOverlay(0.76), navyOverlay(0.38), colors.background]} locations={[0, 0.3, 0.82]} style={StyleSheet.absoluteFill}/> : null}
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView style={styles.scroller} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll,compactHeader&&styles.compactScroll]}>
        <BodyPageHeading title={title} trail={trail} subtitle={compactHeader ? subtitle : undefined} compactSubtitle={compactHeader} style={{ paddingHorizontal: 0 }}/>
        {compactHeader ? <View style={styles.contentGap}/> : <>
          <View style={{ flexGrow: 1, minHeight: Math.min(118, Math.max(56, height * 0.10)) }}/>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>}
        <View style={styles.menu}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background }, safe: { flex: 1 },
    scroller:{flex:1},scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: layout.pageTop, paddingBottom: 24 },compactScroll:{paddingTop:layout.compactTop},
    subtitle: { ...type.body, marginBottom: 20 }, contentGap:{height:12}, menu: { gap: 2 },
});
