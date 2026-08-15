
import { UserAPI } from '@/api/user';
import { CustomModal } from '@/components/ui/CustomModal';
import { theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Scanner() {
  const router = useRouter();
  const appTheme = useAppTheme();
  const { setProfile } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success',
  });

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const { data: result, error } = await supabase.rpc('process_qr_scan', { qr_code: data });
      if (error) throw error;

      if (result.success) {
        setModalConfig({ title: '¡Éxito!', message: result.message, type: 'success' });
        await refreshProfile();
      } else {
        setModalConfig({ title: 'QR inválido', message: result.message, type: 'error' });
      }
    } catch (e: any) {
      console.error('Scan error:', e);
      setModalConfig({ title: 'Error', message: 'No se pudo procesar el código. Intenta de nuevo.', type: 'error' });
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  const refreshProfile = async () => {
    try {
      const data = await UserAPI.getProfile();
      if (data) setProfile(data);
    } catch (e) {
      console.error('Error refreshing points:', e);
    }
  };

  // ── Permission loading ────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permissionRoot}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // ── Permission denied ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permissionRoot}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />
        <SafeAreaView style={styles.permissionContent} edges={['top', 'bottom']}>
          <View style={styles.permissionIconWrap}>
            <Ionicons name="camera-outline" size={48} color={theme.accent} />
          </View>
          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.permissionSubtitle}>
            Necesitamos permiso para escanear códigos QR y registrar tu asistencia.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
            <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtnGradient}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Permitir cámara</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.skipText}>Volver</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ── Scanner view ──────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style={appTheme.bgDeep === "#FAFAFA" ? "dark" : "light"} />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Frame ── */}
        <View style={styles.frameArea}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={styles.loadingText}>Procesando...</Text>
            </View>
          ) : (
            <View style={styles.frame}>
              {/* Corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          )}
        </View>

        {/* ── Helper text ── */}
        <View style={styles.footer}>
          <View style={styles.helperPill}>
            <Ionicons name="qr-code-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.helperText}>Apunta al código QR del establecimiento</Text>
          </View>
        </View>

      </SafeAreaView>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalVisible(false);
          setScanned(false);
        }}
      />
    </View>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 36;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  // ── Permission screens ─────────────────────────────────────────────────────
  permissionRoot: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
  },
  permissionContent: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  permissionIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  permissionSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
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
  },
  skipText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },

  // ── Scanner view ───────────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },

  // Frame area
  frameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: theme.accent,
    borderWidth: CORNER_WIDTH,
    borderRadius: 4,
  },
  topLeft: {
    top: 0, left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0, right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },

  // Loading box
  loadingBox: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  helperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  helperText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
});
