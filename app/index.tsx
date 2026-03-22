
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'BIENVENIDO A\nIRON BODY',
    description: 'Tu transformación comienza hoy.\nEntrena con los mejores equipos y programas.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200',
  },
  {
    id: '2',
    title: 'SEGUIMIENTO\nTOTAL',
    description: 'Monitorea tu progreso, marcas personales\ny nutrición en tiempo real.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200',
  },
  {
    id: '3',
    title: 'MÁXIMO\nPOTENCIAL',
    description: 'Únete a la elite del fitness y comparte tus logros con nuestra comunidad.',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c64b5903?q=80&w=1200',
  },
];

export default function OnboardingScreen() {
  const { goToLogin, goToHome } = useAppNavigation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        goToHome();
      }
    } catch (e) {
      console.error("[Onboarding] Session check error:", e);
    } finally {
      setCheckingAuth(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      goToLogin();
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={styles.slide}>
      <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(7, 7, 15, 0.5)', theme.bgDeep, 'black']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.gradients.topGlow} style={styles.topGlow} pointerEvents="none" />
      
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.mainBtn} onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
            >
                <Text style={styles.buttonText}>
                    {currentIndex === SLIDES.length - 1 ? 'COMENZAR AHORA' : 'SIGUIENTE'}
                </Text>
                <Ionicons 
                    name={currentIndex === SLIDES.length - 1 ? 'flash' : 'arrow-forward'} 
                    size={20} 
                    color="#fff" 
                    style={{ marginLeft: 8 }}
                />
            </LinearGradient>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={goToLogin}>
            <Text style={styles.skipText}>SALTAR INTRO</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  slide: {
    width,
    height,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width,
    height: height * 0.7,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 40,
    paddingBottom: 240,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: {
    backgroundColor: theme.accent,
    width: 20,
  },
  mainBtn: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
