
import { RadarService } from '@/lib/radar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';

export default function LocationPermissionScreen() {
  const router = useRouter();

  const handleAllowPermissions = async () => {
    const status = await RadarService.requestPermissions();
    if (status === 'GRANTED_FOREGROUND' || status === 'GRANTED_BACKGROUND') {
      RadarService.startTracking();
      router.back();
    } else {
      // If denied, maybe show a hint or just go back
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000', '#1a1a1a']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.radarPulse}>
                <Ionicons name="location" size={80} color={GOLD_COLOR} />
              </View>
            </View>

            <Text style={styles.title}>SUBE AL SIGUIENTE NIVEL</Text>
            <Text style={styles.subtitle}>
              Activa la ubicación para que Iron Body detecte automáticamente tu entrada al gimnasio.
            </Text>

            <View style={styles.benefitList}>
              <BenefitItem 
                icon="flash" 
                text="Gana puntos extra por cada entrenamiento detectado." 
              />
              <BenefitItem 
                icon="calendar" 
                text="Registro automático de asistencia sin necesidad de QR." 
              />
              <BenefitItem 
                icon="notifications" 
                text="Recibe retos exclusivos al entrar." 
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleAllowPermissions}
            >
              <Text style={styles.primaryButtonText}>ACTIVAR UBICACIÓN</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>POR AHORA NO</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Tu ubicación solo se usará para geovallas del gimnasio. Respetamos tu privacidad.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const BenefitItem = ({ icon, text }: { icon: any, text: string }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIcon}>
      <Ionicons name={icon} size={20} color={GOLD_COLOR} />
    </View>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulse: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(197, 163, 86, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 163, 86, 0.3)',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  benefitList: {
    width: '100%',
    marginBottom: 50,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(197, 163, 86, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitText: {
    color: '#e0e0e0',
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: GOLD_COLOR,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: GOLD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
});
