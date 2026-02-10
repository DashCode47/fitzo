
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { CustomModal } from '@/components/ui/CustomModal';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useProfileImage } from '@/hooks/useProfileImage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';

import { GEOFENCE_ID } from '@/env';
import { RadarService } from '@/lib/radar';
import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const { goToLogin, goBack } = useAppNavigation();
  const { profile, setProfile, clearAll, isHydrated } = useAppStore();
  const [loading, setLoading] = useState(!profile);
  const { uploadAvatar, uploading } = useProfileImage();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Local state for editing (if needed in future) or just display
  const [editMode, setEditMode] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'confirm',
    onConfirm: () => {}
  });

  // Radar Debug state
  const [geofenceStatus, setGeofenceStatus] = useState<'INSIDE' | 'OUTSIDE' | 'UNKNOWN'>('UNKNOWN');
  const [debugLogs, setDebugLogs] = useState<{ id: string; time: string; event: string }[]>([]);
  const [trackingMode, setTrackingMode] = useState<'Idle' | 'Continuous' | 'Responsive' | 'Efficient'>('Idle');

  const glowValue = useSharedValue(0);

  useEffect(() => {
    // Name neon breathing
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedNameStyle = useAnimatedStyle(() => {
    const shadowRadius = interpolate(glowValue.value, [0, 1], [2, 25]);
    const opacity = interpolate(glowValue.value, [0, 1], [0.7, 1]);
    const scale = interpolate(glowValue.value, [0, 1], [1, 1.03]);

    return {
      textShadowRadius: shadowRadius,
      opacity: opacity,
      transform: [{ scale }],
    };
  });

  useEffect(() => {
    if (isHydrated) {
      loadProfile();
    }
  }, [isHydrated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await UserAPI.getProfile();
      if (data) setProfile(data);
    } catch (e: any) {
      console.error("[ProfileScreen] Profile load failed:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setModalConfig({
      title: 'CERRAR SESIÓN',
      message: '¿Estás seguro que deseas salir de tu cuenta?',
      type: 'confirm',
      onConfirm: async () => {
        setModalVisible(false);
        try {
          await AuthAPI.logout();
          clearAll(); 
          goToLogin();
        } catch (error) {
          console.error("Logout failed:", error);
        }
      }
    });
    setModalVisible(true);
  };

  const handleUpdateAvatar = async () => {
    // ... (existing code remains but I'll add the new handler next)
  };

  const handleRadarSync = async () => {
    try {
        setLoading(true);
        const status = await RadarService.requestPermissions();
        if (status === 'DENIED') {
            Alert.alert("Permisos Denegados", "Por favor habilita la ubicación en los ajustes para usar el geofencing.");
            return;
        }

        if (profile?.id) {
            await RadarService.activate(profile.id, { 
                name: profile.username,
                email: profile.email 
            });
            RadarService.startTracking('continuous');
            setTrackingMode('Continuous');
            addDebugLog('Tracking iniciado: Modo Continuo');
            Alert.alert("Sincronización Radar", "Ubicación enviada al dashboard (Modo Continuo activo).");
        }
    } catch (error) {
        console.error("Radar sync error:", error);
    } finally {
        setLoading(false);
    }
  };

  const addDebugLog = (event: string) => {
    setDebugLogs(prev => [
        { id: Math.random().toString(), time: new Date().toLocaleTimeString(), event },
        ...prev.slice(0, 19) // Keep last 20
    ]);
  };

  useEffect(() => {
    // Listen for Radar events
    RadarService.onEvents((result: any) => {
        console.log('[Profile] Radar event received:', result);
        const events = result.events || [];
        events.forEach((event: any) => {
            if (event.type === 'user.entered_geofence') {
                if (event.geofence?._id === GEOFENCE_ID) {
                    setGeofenceStatus('INSIDE');
                    addDebugLog('ENTRADA detectada (Local)');
                }
            } else if (event.type === 'user.exited_geofence') {
                if (event.geofence?._id === GEOFENCE_ID) {
                    setGeofenceStatus('OUTSIDE');
                    addDebugLog('SALIDA detectada (Local)');
                }
            }
        });
    });

    RadarService.onLocation((result: any) => {
        addDebugLog(`Ubicación: ${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)}`);
    });

    return () => {
        RadarService.off();
    };
  }, []);

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD_COLOR} />
      </SafeAreaView>
    );
  }

  const pointsRotation = useSharedValue(0);
  const intensity = Math.min((profile?.total_points || 0) / 1030, 1);

  useEffect(() => {
    if ((profile?.total_points || 0) > 0) {
        const rotationDuration = 4000 - (intensity * 3500); // 4s down to 0.5s
        pointsRotation.value = withRepeat(
            withTiming(360, { duration: rotationDuration, easing: Easing.linear }),
            -1,
            false
        );
    } else {
        pointsRotation.value = 0;
    }
  }, [profile?.total_points]);

  const animatedPointsStyle = useAnimatedStyle(() => {
    const glow = interpolate(intensity, [0, 1], [0, 15]);
    
    return {
      transform: [{ rotate: `${pointsRotation.value}deg` }],
      opacity: intensity > 0 ? 1 : 0,
      shadowColor: GOLD_COLOR,
      shadowRadius: glow,
      shadowOpacity: intensity * 0.8,
    };
  });

  const username = profile?.username || 'Atleta';
  const email = profile?.email || '';
  const phone = profile?.phone || 'No registrado';
  const role = profile?.role || 'CLIENT';
  const status = profile?.status || 'ACTIVE';
  const points = profile?.total_points || 0;
  
  // Cache busting for avatar
  const photoUrl = profile?.photo_url ? `${profile.photo_url}?t=${avatarTimestamp}` : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CustomModal 
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />
      <ImageBackground 
        source={require('../assets/images/login.jpg')} 
        style={styles.backgroundImage}
      >
         <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradientOverlay}
         >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                      <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MI PERFIL</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={styles.content}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {photoUrl ? (
                                <View>
                                    <Image source={{ uri: photoUrl }} style={styles.avatar} />
                                    {uploading && (
                                        <View style={styles.uploadingOverlay}>
                                            <ActivityIndicator size="small" color={GOLD_COLOR} />
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    {uploading ? (
                                        <ActivityIndicator size="small" color={GOLD_COLOR} />
                                    ) : (
                                        <Text style={styles.avatarInitials}>
                                            {username?.[0]?.toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                            )}
                            <TouchableOpacity 
                                style={styles.editBadge} 
                                onPress={handleUpdateAvatar}
                                disabled={uploading}
                            >
                                <MaterialIcons name="photo-camera" size={14} color="black" />
                            </TouchableOpacity>
                        </View>
                        <Animated.Text style={[styles.name, animatedNameStyle]}>
                            {username}
                        </Animated.Text>
                        <Text style={styles.role}>{role}</Text>
                        
                        <View style={styles.pointsWrapper}>
                            <Animated.View style={[styles.pointsBorder, animatedPointsStyle]}>
                                <LinearGradient
                                    colors={[GOLD_COLOR, 'transparent', GOLD_COLOR, 'transparent']}
                                    style={styles.gradientBorder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            </Animated.View>
                            <View style={styles.pointsBadgeInner}>
                                <Ionicons name="flash" size={16} color={GOLD_COLOR} />
                                <Text style={styles.pointsText}>{points} PUNTOS</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <InfoItem icon="email" label="Correo" value={email} />
                        <InfoItem icon="phone" label="Teléfono" value={phone} />
                        <InfoItem icon="verified-user" label="Estado" value={status} />
                    </View>

                    {/* Radar Tools (Debug) */}
                    <View style={[styles.infoSection, { borderColor: GOLD_COLOR, borderWidth: 1 }]}>
                        <Text style={[styles.infoLabel, { color: GOLD_COLOR, marginBottom: 15 }]}>
                            Radar Intelligence (Debug)
                        </Text>
                        
                        {/* Live Status Visualizer */}
                        <View style={styles.statusRow}>
                            <View style={styles.statusIndicator}>
                                <View style={[
                                    styles.statusDot, 
                                    { backgroundColor: geofenceStatus === 'INSIDE' ? '#0df259' : geofenceStatus === 'OUTSIDE' ? '#ef4444' : '#555' }
                                ]} />
                                <Text style={styles.statusMainText}>
                                    {geofenceStatus === 'INSIDE' ? 'DENTRO DEL GYM' : geofenceStatus === 'OUTSIDE' ? 'FUERA DEL GYM' : 'BUSCANDO ESTADO...'}
                                </Text>
                            </View>
                            <Text style={styles.trackingModeText}>{trackingMode}</Text>
                        </View>

                        <View style={styles.debugInfoBox}>
                            <Text style={styles.debugLabel}>GEOFENCE ID:</Text>
                            <Text style={styles.debugValue}>{GEOFENCE_ID}</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.debugItem, { backgroundColor: 'rgba(13, 242, 89, 0.1)', borderColor: 'rgba(13, 242, 89, 0.3)', borderWidth: 1 }]} 
                            onPress={handleRadarSync}
                        >
                            <MaterialIcons name="share-location" size={20} color="#0df259" />
                            <Text style={[styles.debugText, { color: '#0df259' }]}>Sincronizar Ubicación (Live)</Text>
                        </TouchableOpacity>

                        {/* Debug Log */}
                        <View style={styles.logContainer}>
                            <View style={styles.logHeader}>
                                <Text style={styles.logTitle}>Historial de Eventos</Text>
                                <TouchableOpacity onPress={() => setDebugLogs([])}>
                                    <Text style={styles.clearText}>Limpiar</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.logContent}>
                                {debugLogs.length === 0 ? (
                                    <Text style={styles.emptyLogText}>No hay eventos registrados</Text>
                                ) : (
                                    debugLogs.map(log => (
                                        <Text key={log.id} style={styles.logEntry}>
                                            <Text style={styles.logTime}>[{log.time}]</Text> {log.event}
                                        </Text>
                                    ))
                                )}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={24} color="black" />
                        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
         </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const InfoItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={styles.infoItem}>
        <View style={styles.iconBox}>
            <MaterialIcons name={icon} size={20} color={GOLD_COLOR} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center'
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 30 : 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: GOLD_COLOR,
  },
  avatarPlaceholder: {
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
  },
  avatarInitials: {
      fontSize: 32,
      fontWeight: 'bold',
      color: GOLD_COLOR,
  },
  onlineBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0df259', // Keep bright green for "online" status
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderWidth: 3,
    borderColor: 'black',
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: GOLD_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    // shadowRadius is animated
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  role: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    backgroundColor: GOLD_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)', // Glassmorphism effect
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 163, 86, 0.2)', // Gold with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    shadowColor: GOLD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: GOLD_COLOR,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  pointsWrapper: {
    marginTop: 12,
    width: 140,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pointsBorder: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBorder: {
    width: '100%',
    height: '100%',
  },
  pointsBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    width: 136,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 6,
  },
  pointsText: {
    color: GOLD_COLOR,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Radar Debug Styles
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  statusMainText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  trackingModeText: {
    color: GOLD_COLOR,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debugInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  debugLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
  },
  debugValue: {
    color: GOLD_COLOR,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  debugText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
  },
  logTitle: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: 'bold',
  },
  clearText: {
    color: GOLD_COLOR,
    fontSize: 11,
  },
  logContent: {
    maxHeight: 120,
  },
  logEntry: {
    color: '#ccc',
    fontSize: 11,
    marginBottom: 4,
  },
  logTime: {
    color: GOLD_COLOR,
    fontWeight: 'bold',
  },
  emptyLogText: {
    color: '#555',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
});
