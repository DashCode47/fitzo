import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

function Bone({ w, h, radius = 8, style }: { w: number | string; h: number; radius?: number; style?: any }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <Animated.View
      style={[
        { width: w as any, height: h, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.08)', opacity },
        style,
      ]}
    />
  );
}

export function OnboardingSkeleton() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />

      {/* Fake image area */}
      <Bone w={width} h={height * 0.65} radius={0} style={{ position: 'absolute', top: 0 }} />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(7,7,15,0.6)', theme.bgDeep, 'black']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Text content area */}
      <View style={styles.content}>
        <Bone w="70%" h={38} radius={8} style={{ marginBottom: 10 }} />
        <Bone w="50%" h={38} radius={8} style={{ marginBottom: 20 }} />
        <Bone w="85%" h={16} radius={6} style={{ marginBottom: 8 }} />
        <Bone w="70%" h={16} radius={6} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.pagination}>
          <Bone w={20} h={6} radius={3} />
          <Bone w={6} h={6} radius={3} />
          <Bone w={6} h={6} radius={3} />
        </View>

        {/* Button */}
        <Bone w="100%" h={60} radius={18} style={{ marginBottom: 20 }} />

        {/* Skip */}
        <Bone w={80} h={12} radius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 40,
    paddingBottom: 240,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 8,
    alignItems: 'center',
  },
});
