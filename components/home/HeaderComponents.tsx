import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY_COLOR = '#0df259'; // Keeping Green for CrowdMeter/Status
const GOLD_COLOR = '#C5A356';

interface TopBarProps {
  user: { name: string; avatar: string };
  onPressProfile?: () => void;
}
export const TopBar = ({ user, onPressProfile }: TopBarProps) => (
  <View style={styles.topBar}>
    <View style={styles.userSection}>
      <TouchableOpacity onPress={onPressProfile} style={styles.avatarContainer}>
        {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{user.name?.[0]}</Text>
            </View>
        )}
        <View style={styles.onlineBadge} />
      </TouchableOpacity>
      <View>
        <Text style={styles.welcomeText}>Bienvenido,</Text>
        <Text style={styles.userName}>{user.name}</Text>
      </View>
    </View>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.iconButton}>
        <MaterialIcons name="notifications-none" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.qrButton}>
        <MaterialIcons name="qr-code-scanner" size={24} color="black" />
      </TouchableOpacity>
    </View>
  </View>
);

interface CrowdMeterProps {
  data: { status: string; percentage: number; description: string };
}
export const CrowdMeter = ({ data }: CrowdMeterProps) => (
  <View style={styles.crowdContainer}>
    <View style={styles.crowdCard}>
      <View style={styles.crowdContent}>
        <View style={styles.crowdIconContainer}>
            <MaterialIcons name="groups" size={24} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.crowdInfo}>
            <Text style={styles.crowdLabel}>AFLUENCIA</Text>
            <Text style={styles.crowdStatus}>{data.status} <Text style={styles.crowdPercent}>({data.percentage}%)</Text></Text>
        </View>
        <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressBarFill, { width: `${data.percentage}%`, backgroundColor: data.percentage > 80 ? '#ef4444' : data.percentage > 50 ? '#eab308' : '#22c55e' }]} />
        </View>
      </View>
    </View>
  </View>
);

import { Banner } from '@/api/banners';

interface PromoCarouselProps {
  data: Banner[];
  onPressItem?: (item: Banner) => void;
}
export const PromoCarousel = ({ data, onPressItem }: PromoCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = width * 0.85;
  const GAP = 16;

  const getBadgeColor = (tag: string | null) => {
    switch (tag) {
        case 'URGENTE': return '#FF4444'; 
        case 'NUEVO': return '#4ade80';
        case 'INFO': return '#3b82f6';
        default: return GOLD_COLOR;
    }
  };

  useEffect(() => {
    if (data.length <= 1) return;
    
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= data.length) {
        nextIndex = 0;
      }
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, data.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const getItemLayout = (data: any, index: number) => ({
    length: CARD_WIDTH + GAP,
    offset: (CARD_WIDTH + GAP) * index,
    index,
  });

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        snapToInterval={CARD_WIDTH + GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        renderItem={({ item }) => (
            <TouchableOpacity style={styles.promoCard} onPress={() => onPressItem?.(item)} activeOpacity={0.9}>
            <Image source={{ uri: item.image_url || 'https://via.placeholder.com/300' }} style={styles.promoImage} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.promoGradient}
            />
            <View style={styles.promoContent}>
                {item.tag && (
                    <View style={[styles.badge, { backgroundColor: getBadgeColor(item.tag) }]}>
                        <Text style={[styles.badgeText, { color: 'white' }]}>{item.tag}</Text>
                    </View>
                )}
                <Text style={styles.promoTitle}>{item.title}</Text>
                <View style={styles.promoFooter}>
                    <Text style={styles.promoSubtitle} numberOfLines={1}>{item.short_description}</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={GOLD_COLOR} />
                </View>
            </View>
            </TouchableOpacity>
        )}
      />
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
            <View 
                key={index} 
                style={[
                    styles.paginationDot, 
                    { backgroundColor: index === activeIndex ? GOLD_COLOR : '#555', opacity: index === activeIndex ? 1 : 0.5 }
                ]} 
            />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // TopBar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20 },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: GOLD_COLOR },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: GOLD_COLOR },
  avatarInitials: { color: GOLD_COLOR, fontSize: 20, fontWeight: 'bold' },
  onlineBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: PRIMARY_COLOR, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: 'black' },
  welcomeText: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  userName: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  qrButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: GOLD_COLOR, justifyContent: 'center', alignItems: 'center', shadowColor: GOLD_COLOR, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },

  // CrowdMeter
  crowdContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  crowdCard: { 
      backgroundColor: 'rgba(30, 58, 41, 0.8)', 
      borderRadius: 12, 
      paddingHorizontal: 16, 
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: 'rgba(13, 242, 89, 0.2)'
  },
  crowdContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crowdIconContainer: { 
      width: 40, height: 40, borderRadius: 20, 
      backgroundColor: 'rgba(13, 242, 89, 0.1)', 
      justifyContent: 'center', alignItems: 'center' 
  },
  crowdInfo: { flex: 1 },
  crowdLabel: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  crowdStatus: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  crowdPercent: { color: PRIMARY_COLOR, fontSize: 16 },
  miniProgressBar: { 
      width: 60, height: 6, 
      backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 3, 
      overflow: 'hidden' 
  },
  miniProgressBarFill: { height: '100%', borderRadius: 3 },

  // PromoCarousel
  carouselContent: { paddingHorizontal: 16, gap: 16, paddingBottom: 16 },
  promoCard: { width: Dimensions.get('window').width * 0.85, height: 180, borderRadius: 16, overflow: 'hidden', position: 'relative', elevation: 5 },
  promoImage: { width: '100%', height: '100%', position: 'absolute' },
  promoGradient: { width: '100%', height: '100%', position: 'absolute' },
  promoContent: { position: 'absolute', bottom: 0, padding: 20, width: '100%' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  promoTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  promoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promoSubtitle: { color: '#e5e7eb', fontSize: 14 },
  
  // Pagination
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 8 },
  paginationDot: { width: 8, height: 8, borderRadius: 4 },
});
