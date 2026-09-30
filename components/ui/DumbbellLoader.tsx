import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

// Discos de un lado, de adentro hacia afuera, en una grilla de 100x40 como la
// mancuerna del logo: [x, ancho, alto]. El lado derecho es el espejo.
const PLATES = [
  [21, 12, 40],
  [8, 10, 28],
  [0, 5, 14],
] as const;

interface Props {
  width?: number;
  color?: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// "Cargando la barra": los discos entran deslizándose uno a uno de adentro hacia
// afuera, se sostienen y salen juntos. Solo se animan opacity y translateX con el
// native driver: corre en el hilo de UI, mismo costo que un ActivityIndicator.
export function DumbbellLoader({ width = 64, color, duration = 1400, style }: Props) {
  const theme = useAppTheme();
  const fill = color ?? theme.accent;
  const u = width / 100;
  const t = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, duration, t]);

  return (
    <View
      style={[{ width, height: 40 * u }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
    >
      <View
        style={{
          position: 'absolute', top: 17 * u, left: 2 * u, right: 2 * u,
          height: 6 * u, borderRadius: 3 * u, backgroundColor: fill, opacity: 0.4,
        }}
      />
      {PLATES.flatMap(([x, w, h], i) =>
        ([-1, 1] as const).map((side) => {
          const a = 0.08 + i * 0.16;
          const range = {
            inputRange: [a, a + 0.12, 0.78, 0.92],
            extrapolate: 'clamp' as const,
          };
          const off = side * 4 * u;
          return (
            <Animated.View
              key={`${i}${side}`}
              style={{
                position: 'absolute',
                left: (side < 0 ? x : 100 - x - w) * u,
                top: ((40 - h) / 2) * u,
                width: w * u,
                height: h * u,
                borderRadius: 2 * u,
                backgroundColor: fill,
                opacity: reduceMotion ? 1 : t.interpolate({ ...range, outputRange: [0.15, 1, 1, 0.15] }),
                transform: [{ translateX: reduceMotion ? 0 : t.interpolate({ ...range, outputRange: [off, 0, 0, off] }) }],
              }}
            />
          );
        }),
      )}
    </View>
  );
}
