
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GOLD_COLOR = '#C5A356';
const DARK_BG = '#000';

export default function DetailsScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams();
  const { promos, events } = useAppStore();

  let content: any = null;

  if (type === 'event') {
    content = events?.find(e => e.id === id);
  } else {
    // Default to banner/promo
    content = promos?.find(p => p.id === Number(id));
  }

  if (!content) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró la información solicitada.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>VOLVER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatEventDate = (dateStr: string) => {
    try {
      // Basic split to avoid UTC drift from new Date(string)
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }).replace(/^\w/, (c) => c.toUpperCase());
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        bounces={true} 
        showsVerticalScrollIndicator={true}
      >
        {/* Header Image Section */}
        <View style={styles.headerContainer}>
          <Image 
            source={{ uri: content.image_url || 'https://via.placeholder.com/800x600' }} 
            style={styles.headerImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', DARK_BG]}
            style={styles.gradient}
          />
          
          {/* Back Button - Positioned absolutely relative to the image container */}
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            {type === 'event' ? (
                <View style={[styles.tagBadge, { backgroundColor: '#0df259' }]}>
                  <Text style={styles.tagText}>EVENTO</Text>
                </View>
            ) : content.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{content.tag.toUpperCase()}</Text>
              </View>
            )}
            
            {type !== 'event' && (
               <Text style={styles.dateText}>
                  {content.expiration_date ? `Vence: ${new Date(content.expiration_date).toLocaleDateString()}` : ''}
               </Text>
            )}
          </View>

          {type === 'event' && (
            <View style={styles.eventDetailsRow}>
              <View style={styles.eventDetailItem}>
                <Ionicons name="calendar-outline" size={18} color={GOLD_COLOR} />
                <Text style={styles.eventDetailText}>{formatEventDate(content.event_date)}</Text>
              </View>
              <View style={styles.eventDetailItem}>
                <Ionicons name="time-outline" size={18} color={GOLD_COLOR} />
                <Text style={styles.eventDetailText}>{(content.event_time || '').substring(0, 5)} HS</Text>
              </View>
            </View>
          )}

          <Text style={styles.title}>{type === 'event' ? content.name : content.title}</Text>
          <View style={styles.divider} />
          
          <Text style={styles.description}>
            {content.large_description || content.short_description || content.description}
          </Text>

          {/* Footer Decoration */}
          <View style={styles.footer}>
            <LinearGradient
                colors={['transparent', 'rgba(197, 163, 86, 0.2)', 'transparent']}
                style={styles.footerDecoration}
            />
            <Text style={styles.brandText}>IRON BODY EXCLUSIVE</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 60,
  },
  headerContainer: {
    height: 380, // Reduced from 450 to show more text initially
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 50, // Safe area manual offset
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    padding: 24,
    marginTop: -30, // Subtle pull up over gradient
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventDetailsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventDetailText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  tagBadge: {
    backgroundColor: GOLD_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
    lineHeight: 38,
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: GOLD_COLOR,
    marginBottom: 24,
    borderRadius: 2,
  },
  description: {
    color: '#e5e7eb',
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '400',
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerDecoration: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  brandText: {
    color: GOLD_COLOR,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 4,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: DARK_BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: GOLD_COLOR,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
