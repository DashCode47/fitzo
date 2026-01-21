
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        {/* Decorative background would require absolute positioning logic similar to HTML */}
      <View style={styles.crowdHeader}>
        <View>
          <Text style={styles.crowdLabel}>AFLUENCIA</Text>
          <Text style={styles.crowdStatus}>{data.status}</Text>
          <Text style={styles.crowdDesc}>{data.description}</Text>
        </View>
        <Text style={styles.crowdPercent}>{data.percentage}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <LinearGradient
            colors={['#4ade80', PRIMARY_COLOR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${data.percentage}%` }]}
        />
      </View>
      <View style={styles.crowdLegend}>
          <Text style={styles.legendText}>Baja</Text>
          <Text style={styles.legendText}>Media</Text>
          <Text style={styles.legendText}>Alta</Text>
      </View>
    </View>
  </View>
);

interface PromoCarouselProps {
  data: Array<{ id: number; image: string; tag: string; title: string; subtitle: string }>;
}
export const PromoCarousel = ({ data }: PromoCarouselProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
    {data.map((item) => (
      <View key={item.id} style={styles.promoCard}>
        <Image source={{ uri: item.image }} style={styles.promoImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.promoGradient}
        />
        <View style={styles.promoContent}>
            <View style={[styles.badge, { backgroundColor: item.tag === 'PROMO' ? 'white' : GOLD_COLOR }]}>
               <Text style={[styles.badgeText, { color: 'black' }]}>{item.tag}</Text>
            </View>
            <Text style={styles.promoTitle}>{item.title}</Text>
            <View style={styles.promoFooter}>
                <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
                <MaterialIcons name="arrow-forward" size={20} color={GOLD_COLOR} />
            </View>
        </View>
      </View>
    ))}
  </ScrollView>
);

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
  crowdCard: { backgroundColor: '#1e3a29', borderRadius: 16, padding: 20, overflow: 'hidden' },
  crowdHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  crowdLabel: { color: PRIMARY_COLOR, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  crowdStatus: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  crowdDesc: { color: '#9ca3af', fontSize: 14 },
  crowdPercent: { color: PRIMARY_COLOR, fontSize: 30, fontWeight: 'bold' },
  progressBarBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  crowdLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendText: { color: '#9ca3af', fontSize: 10, fontWeight: '500' },

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
});
