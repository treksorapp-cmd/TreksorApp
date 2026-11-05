import React from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import BodyPageHeading from "@/components/BodyPageHeading";
import { colors, type } from "@/theme/architect";
type Props = {
    title: string;
    trail: string;
    image: number;
    headline?: string;
    subtitle?: string;
    compact?: boolean;
    children: React.ReactNode;
};
export default function PillarMenuScreen({ title, trail, image, headline, subtitle, compact, children }: Props) {
    const { height } = useWindowDimensions();
    return <View style={styles.screen}>
    <ImageBackground source={image} style={StyleSheet.absoluteFill} contentFit="cover"/>
    <LinearGradient colors={["rgba(2,5,12,0.76)", "rgba(2,5,12,0.38)", colors.background]} locations={[0, 0.3, 0.82]} style={StyleSheet.absoluteFill}/>
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <BodyPageHeading title={title} trail={trail} style={{ paddingHorizontal: 0 }}/>
        <View style={{ flexGrow: 1, minHeight: compact ? 28 : Math.min(180, Math.max(64, height * 0.13)) }}/>
        {headline ? <Text style={styles.headline}>{headline}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.menu}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background }, safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24 },
    headline: { ...type.page, fontSize: 30, lineHeight: 38, marginBottom: 10 },
    subtitle: { ...type.body, marginBottom: 20 }, menu: { gap: 2 },
});
