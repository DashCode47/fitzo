import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * OnboardingSkeleton is now a Premium Splash/Loader screen.
 * Shows the app logo with a pulse animation and a loading indicator.
 */
export function OnboardingSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth entry
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Subtle breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      {/* Premium dark gradient background */}
      <LinearGradient
        colors={["#000000", "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.centerContent,
          { opacity: fadeAnim, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>FITZO</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator
          size="small"
          color="#C5A356"
          style={{ marginBottom: 16 }}
        />
        <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 160,
    height: 160,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 8,
    marginBottom: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
