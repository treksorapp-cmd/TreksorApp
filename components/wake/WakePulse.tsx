import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { wakeThemes, WakeTheme } from "@/lib/wake/model";
import { useReducedMotion } from "@/hooks/useReducedMotion";
export default function WakePulse({
  theme,
  motion,
}: {
  theme: WakeTheme;
  motion: boolean;
}) {
  const reduced = useReducedMotion(),
    pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulse.setValue(0);
    if (!motion || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, reduced, pulse]);
  const tint = wakeThemes[theme];
  return (
    <View pointerEvents="none" accessible={false} style={styles.frame}>
      <Animated.View
        style={{
          width: 280,
          height: 280,
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 0.95],
          }),
          transform: [
            {
              scale: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1.04],
              }),
            },
          ],
        }}
      >
        <Svg width="280" height="280" viewBox="0 0 280 280">
          <Circle cx="140" cy="140" r="93" fill={tint.halo} opacity=".08" />
          <Circle
            cx="140"
            cy="140"
            r="112"
            fill="none"
            stroke={tint.color}
            strokeWidth=".6"
            opacity=".24"
          />
          {Array.from({ length: 32 }, (_, i) => {
            const angle = (i * Math.PI) / 16,
              r = 100 + (i % 3) * 12,
              x = 140 + Math.cos(angle) * r,
              y = 140 + Math.sin(angle) * r;
            return <Viewless key={i} x={x} y={y} i={i} color={tint.color} />;
          })}
          <Circle cx="140" cy="140" r="5" fill={tint.color} />
        </Svg>
      </Animated.View>
    </View>
  );
}
function Viewless({
  x,
  y,
  i,
  color,
}: {
  x: number;
  y: number;
  i: number;
  color: string;
}) {
  return (
    <>
      <Line
        x1={x}
        y1={y}
        x2={140 + (x - 140) * 0.72}
        y2={140 + (y - 140) * 0.72}
        stroke={color}
        strokeWidth=".7"
        opacity={i % 2 ? 0.18 : 0.45}
      />
      <Circle
        cx={x}
        cy={y}
        r={i % 4 === 0 ? 3 : 1.6}
        fill={color}
        opacity={i % 3 === 0 ? 0.9 : 0.45}
      />
    </>
  );
}
const styles = StyleSheet.create({
  frame: { alignItems: "center", justifyContent: "center", height: 290 },
});
