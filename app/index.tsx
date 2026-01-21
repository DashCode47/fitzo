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
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const GOLD_COLOR = '#C5A356';

const SLIDES = [
  {
    id: '1',
    title: 'BIENVENIDO A IRON BODY',
    description: 'Tu transformación comienza hoy.\nEntrena con los mejores equipos y programas.',
    image: require('../assets/images/login.jpg'),
  },
  {
    id: '2',
    title: 'SEGUIMIENTO TOTAL',
    description: 'Monitorea tu progreso, marcas personales\ny nutrición en tiempo real.',
    image: require('../assets/images/login.jpg'),
  },
  {
    id: '3',
    title: 'MÁXIMO POTENCIAL',
    description: 'Únete a la elite del fitness y comparte tus logros con nuestra comunidad.',
    image: require('../assets/images/login.jpg'),
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
      // Small delay for smooth transition if needed
      setCheckingAuth(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD_COLOR} />
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
      <ImageBackground source={item.image} style={styles.image}>
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', 'black']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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

        {/* Buttons */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'COMENZAR' : 'SIGUIENTE'}
          </Text>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={goToLogin}>
            <Text style={styles.skipText}>SALTAR</Text>
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
  slide: {
    width,
    height,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 220, // More space for footer buttons and dots
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: GOLD_COLOR,
    width: 24,
  },
  button: {
    backgroundColor: GOLD_COLOR,
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
