
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { CustomModal } from '@/components/ui/CustomModal';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useProfileImage } from '@/hooks/useProfileImage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';

import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const { goToLogin, goBack } = useAppNavigation();
  const { profile, setProfile, clearAll, isHydrated } = useAppStore();
  const [loading, setLoading] = useState(!profile);
  const { uploadAvatar, uploading } = useProfileImage();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'confirm',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (isHydrated) {
      loadProfile();
    }
  }, [isHydrated]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const currentId = profile?.id || profile?.user_id;
      const data = await UserAPI.getProfile(currentId);
      setProfile(data);
    } catch (error: any) {
      console.error("[ProfileScreen] Error loading profile:", error);
      // Always allow retrying on the same screen
      setModalConfig({
        title: 'ERROR DE CARGA',
        message: error.message || 'No pudimos obtener tu información de perfil.',
        type: 'confirm',
        onConfirm: () => {
          setModalVisible(false);
          loadProfile();
        }
      });
      setModalVisible(true);
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
          clearAll(); // Clear Zustand store
          goToLogin();
        } catch (error) {
          console.error("Logout failed:", error);
          setModalConfig({
            title: 'ERROR',
            message: 'No pudimos cerrar tu sesión. Inténtalo de nuevo.',
            type: 'error',
            onConfirm: () => setModalVisible(false)
          });
          setModalVisible(true);
        }
      }
    });
    setModalVisible(true);
  };

  const handleUpdateAvatar = async () => {
    try {
      const newUrl = await uploadAvatar();
      if (newUrl) {
        setAvatarTimestamp(Date.now());
        // Reload profile to get the updated photoUrl from DB
        await loadProfile();
        setModalConfig({
          title: '¡FOTO ACTUALIZADA!',
          message: 'Tu foto de perfil se ha guardado correctamente.',
          type: 'success',
          onConfirm: () => setModalVisible(false)
        });
        setModalVisible(true);
      }
    } catch (error: any) {
      setModalConfig({
        title: 'ERROR AL SUBIR',
        message: 'No pudimos subir tu foto. Inténtalo de nuevo.',
        type: 'error',
        onConfirm: () => setModalVisible(false)
      });
      setModalVisible(true);
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD_COLOR} />
      </SafeAreaView>
    );
  }

  // Define data even if null for the UI to not crash
  const email = profile?.email || '';
  const nationalId = profile?.nationalId || '';
  const phone = profile?.phone || 'No registrado';
  const role = profile?.role || '';
  const status = profile?.status || '';
  
  // Safe extraction of nested profile
  const rawProfile = profile?.profile;
  const userProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) || {};
  const { firstName = '', lastName = '', photoUrl: rawPhotoUrl = null } = userProfile;

  // Cache busting
  const photoUrl = rawPhotoUrl ? `${rawPhotoUrl}?t=${avatarTimestamp}` : null;

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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MI PERFIL</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                {profile ? (
                <View style={styles.content}>
                    {/* Avatar Section */}
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
                                            {firstName?.[0]}{lastName?.[0]}
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
                        <Text style={styles.name}>{firstName} {lastName}</Text>
                        <Text style={styles.role}>{role}</Text>
                    </View>

                    {/* Info Cards */}
                    <View style={styles.infoSection}>
                        <InfoItem icon="email" label="Correo" value={email} />
                        <InfoItem icon="badge" label="Cédula" value={nationalId} />
                        <InfoItem icon="phone" label="Teléfono" value={phone || 'No registrado'} />
                        <InfoItem icon="verified-user" label="Estado" value={status} />
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={24} color="black" />
                        <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
                    </TouchableOpacity>
                </View>
                ) : (
                  <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
                      <ActivityIndicator size="large" color={GOLD_COLOR} />
                      <Text style={{ color: 'white', marginTop: 20, textAlign: 'center' }}>
                        Cargando tu información...
                      </Text>
                  </View>
                )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
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
});
