
import { LeaderboardAPI } from '@/api/leaderboard';
import { CustomModal } from '@/components/ui/CustomModal';
import { useAppStore } from '@/store/useAppStore';
import { withTimeout } from '@/utils/async';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD_COLOR = '#C5A356';
const SILVER_COLOR = '#C0C0C0';
const BRONZE_COLOR = '#CD7F32';

export default function RankingsScreen() {
  const router = useRouter();
  const { profile } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      console.log('[RankingsScreen] loadLeaderboard called. Loading:', loading);
      setLoading(true);
      setError(false);
      // Add timeout to prevent infinite loading
      const data = await withTimeout(
        LeaderboardAPI.getLeaderboard(),
        15000, 
        'Error cargando ranking'
      );
      
      console.log('[RankingsScreen] Data received:', data?.length);
      // Ensure data has the required fields for the new UI
      const enrichedData = data.map((item: any, index: number) => ({
        ...item,
        rank: index + 1,
        // Fallbacks for mocks if real data is missing these fields
        streak: item.streak || Math.floor(Math.random() * 20),
        badges: item.badges || [],
      }));
      setLeaderboard(enrichedData);
    } catch (error: any) {
      console.error('[RankingsScreen] Error loading leaderboard:', error);
      if (error.message) {
          console.error('[RankingsScreen] Error message:', error.message);
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = (rank: number) => {
    if (rank === 1) return <MaterialCommunityIcons name="trophy-variant" size={24} color={GOLD_COLOR} />;
    if (rank === 2) return <MaterialCommunityIcons name="trophy-variant" size={24} color={SILVER_COLOR} />;
    if (rank === 3) return <MaterialCommunityIcons name="trophy-variant" size={24} color={BRONZE_COLOR} />;
    return <Text style={styles.rankNumber}>{rank}</Text>;
  };

  const renderLeaderboardItem = ({ item }: { item: any }) => (
    <View style={styles.leaderboardRow}>
      <View style={styles.rankContainer}>
        {renderBadge(item.rank)}
      </View>
      <Image source={{ uri: item.avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <View style={styles.streakContainer}>
          <Ionicons name="flame" size={14} color="#FF4500" />
          <Text style={styles.streakText}>{item.streak} días</Text>
        </View>
      </View>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsValue}>{item.score.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>PTS</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CustomModal 
        visible={modalVisible}
        title="RECOMPENSAS"
        message="¡Sigue entrenando para desbloquear tu próxima recompensa!"
        type="success"
        onClose={() => setModalVisible(false)}
      />
      <CustomModal 
        visible={infoModalVisible}
        title="CÓMO OBTENER PUNTOS"
        message={`Escanea códigos QR por:\n\n1. Asistencia\n2. Completar Rutina\n3. Reseña en Google\n4. Invitar Amigo\n5. Comprar`}
        type="info"
        onClose={() => setInfoModalVisible(false)}
        buttonText="ENTENDIDO"
      />
      <ImageBackground
        source={require('../../assets/images/login.jpg')}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header section with User Card */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>IRON LEGENDS</Text>
                <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.infoButton}>
                  <Ionicons name="information-circle-outline" size={24} color={GOLD_COLOR} />
                </TouchableOpacity>
              </View>
              <View style={styles.userCard}>
                <View style={styles.userCardContent}>
                  <View>
                    <Text style={styles.userRankTitle}>TU RANGO</Text>
                    <Text style={styles.userRankValue}>ELITE</Text>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <Text style={styles.userRankTitle}>TOTAL</Text>
                    <Text style={styles.userRankValue}>{profile?.total_points?.toLocaleString() || '0'} PTS</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sticky Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/scanner')}
              >
                <Ionicons name="qr-code" size={20} color="black" />
                <Text style={styles.actionButtonText}>ASISTENCIA</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#333' }]}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="gift" size={20} color={GOLD_COLOR} />
                <Text style={[styles.actionButtonText, { color: GOLD_COLOR }]}>RECOMPENSA</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>RANKING MENSUAL</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={GOLD_COLOR} style={{ marginTop: 50 }} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="cloud-offline" size={50} color="#666" style={{ marginBottom: 10 }} />
                <Text style={styles.errorText}>No pudimos cargar el ranking.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboard}>
                    <Text style={styles.retryButtonText}>INTENTAR DE NUEVO</Text>
                    <Ionicons name="refresh" size={16} color="black" />
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.id}
                renderItem={renderLeaderboardItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
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
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
    textShadowColor: GOLD_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  infoButton: {
    padding: 5,
  },
  userCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  userRankTitle: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  userRankValue: {
    fontSize: 20,
    color: GOLD_COLOR,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_COLOR,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'black',
    letterSpacing: 0.5,
  },
  listHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: '900',
    color: GOLD_COLOR,
  },
  pointsLabel: {
    fontSize: 9,
    color: '#888',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  errorText: {
    color: '#AAA',
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
