
import { UserAPI } from '@/api/user';
import { CustomModal } from '@/components/ui/CustomModal';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Scanner() {
  const router = useRouter();
  const { profile, setProfile } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modal State
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
      const { data: result, error } = await supabase.rpc('process_qr_scan', {
        qr_code: data,
      });

      if (error) throw error;

      if (result.success) {
        setModalConfig({
          title: '¡ÉXITO!',
          message: result.message,
          type: 'success',
        });
        await refreshProfile();
      } else {
        setModalConfig({
          title: 'QR INVÁLIDO',
          message: result.message,
          type: 'error',
        });
      }
    } catch (e: any) {
      console.error('Scan error:', e);
      setModalConfig({
        title: 'ERROR',
        message: 'No se pudo procesar el código. Intenta de nuevo.',
        type: 'error',
      });
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

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C5A356" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.backButton} onPress={requestPermission}>
          <Text style={styles.backButtonText}>PEDIR PERMISO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#C5A356' }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: '#C5A356' }]}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>ESCANEAR RECOMPENSA</Text>
          </View>

          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.helperText}>Apunta al código QR del establecimiento</Text>
          </View>
        </SafeAreaView>
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    letterSpacing: 1,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 0,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#C5A356',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  helperText: {
    color: '#FFF',
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#C5A356',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#000',
    fontWeight: 'bold',
  }
});
