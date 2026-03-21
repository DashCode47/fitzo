
import { RadarService } from '@/lib/radar';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleAllowPermissions = async () => {
    const status = await RadarService.requestPermissions();
    if (status === 'GRANTED_FOREGROUND' || status === 'GRANTED_BACKGROUND') {
      RadarService.startTracking();
    }
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>

          {/* ── Icon ── */}
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={theme.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            />
            <Ionicons name="location" size={48} color="#fff" />
          </View>

          {/* ── Copy ── */}
          <Text style={styles.title}>Activa tu ubicación</Text>
          <Text style={styles.subtitle}>
            Detectamos tu entrada al gimnasio automáticamente para registrar asistencia y darte puntos.
          </Text>

          {/* ── Benefits ── */}
          <View style={styles.benefitList}>
            <BenefitItem icon="flash" text="Gana puntos extra por cada sesión detectada." />
            <BenefitItem icon="checkmark-circle" text="Registro de asistencia sin necesidad de QR." />
            <BenefitItem icon="gift" text="Recibe retos exclusivos al entrar al gym." />
          </View>

          {/* ── Actions ── */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAllowPermissions} activeOpacity={0.85}>
            <LinearGradient
              colors={theme.gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Activar ubicación</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.skipText}>Por ahora no</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Tu ubicación solo se usa para detectar entradas al gimnasio. No compartimos tus datos.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BenefitItem({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIconBox}>
        <Ionicons name={icon} size={16} color={theme.accent} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 260,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  iconGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Copy ──────────────────────────────────────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  // ── Benefits ──────────────────────────────────────────────────────────────
  benefitList: {
    width: '100%',
    gap: 14,
    marginBottom: 44,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 14,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  skipBtn: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  skipText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimer: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
