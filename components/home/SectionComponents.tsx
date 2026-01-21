
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY_COLOR = '#0df259';

interface EventsProps {
    data: Array<{ id: number; day: string; title: string; time: string; isToday: boolean }>;
}
export const EventsTimeline = ({ data }: EventsProps) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos eventos</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.eventsCard}>
            {data.map((item, index) => (
                <View key={item.id} style={[styles.eventItem, index < data.length - 1 && styles.eventBorder]}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateLabel}>HOY</Text>
                        <Text style={styles.dateNumber}>{item.day}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <View style={styles.timeRow}>
                            <MaterialIcons name="schedule" size={14} color="#6b7280" />
                            <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addButton}>
                        <MaterialIcons name="add" size={18} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    </View>
);

interface LeaderboardProps {
    data: Array<{ rank: number; name: string; points: number; avatar: string }>;
}
export const Leaderboard = ({ data }: LeaderboardProps) => {
    const [second, first, third] = [
        data.find(d => d.rank === 2),
        data.find(d => d.rank === 1),
        data.find(d => d.rank === 3)
    ];

    if (!first || !second || !third) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rankings</Text>
            <LinearGradient colors={['#1e3a29', '#152a1e']} style={styles.leaderboardCard}>
                <View style={styles.podiumContainer}>
                    <View style={styles.podiumPlace}>
                        <View style={styles.avatarWrapper}>
                           <Image source={{ uri: second.avatar }} style={styles.podiumAvatarSmall} />
                           <View style={styles.rankBadgeSmall}><Text style={styles.rankText}>2</Text></View>
                        </View>
                        <Text style={styles.podiumName}>{second.name}</Text>
                        <Text style={styles.podiumPoints}>{second.points} pts</Text>
                        <View style={[styles.podiumBar, { height: 60, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    </View>

                    <View style={styles.podiumPlace}>
                        <MaterialIcons name="emoji-events" size={24} color="#facc15" style={{ marginBottom: 4 }} />
                        <View style={[styles.avatarWrapper, { marginBottom: 8 }]}>
                           <Image source={{ uri: first.avatar }} style={styles.podiumAvatarLarge} />
                           <View style={styles.rankBadgeLarge}><Text style={styles.rankText}>1</Text></View>
                        </View>
                        <Text style={[styles.podiumName, { fontSize: 14 }]}>{first.name}</Text>
                        <Text style={[styles.podiumPoints, { fontSize: 12 }]}>{first.points} pts</Text>
                        <View style={[styles.podiumBar, { height: 90, backgroundColor: 'rgba(13, 242, 89, 0.2)', borderTopWidth: 1, borderColor: 'rgba(13, 242, 89, 0.3)' }]} />
                    </View>
                    
                     <View style={[styles.podiumPlace, {marginBottom: 8}]}>
                        <View style={styles.avatarWrapper}>
                           <Image source={{ uri: third.avatar }} style={styles.podiumAvatarSmall} />
                           <View style={[styles.rankBadgeSmall, { backgroundColor: '#fdba74' }]}><Text style={styles.rankText}>3</Text></View>
                        </View>
                        <Text style={styles.podiumName}>{third.name}</Text>
                        <Text style={styles.podiumPoints}>{third.points} pts</Text>
                         <View style={[styles.podiumBar, { height: 48, backgroundColor: 'rgba(255,255,255,0.05)' }]} />
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

interface NutritionProps {
    data: { title: string; calories: string; protein: string; image: string; label?: string };
    onPress?: () => void;
}
export const NutritionCard = ({ data, onPress }: NutritionProps) => (
    <View style={[styles.section, { marginBottom: 24 }]}>
         <Text style={styles.sectionTitle}>Planes Nutricionales</Text>
         <TouchableOpacity style={styles.nutritionCard} onPress={onPress} activeOpacity={0.8}>
            <Image source={{ uri: data.image }} style={styles.foodImage} />
            <View style={styles.foodInfo}>
                <Text style={styles.foodLabel}>{data.label || "COMIDA RECOMENDADA"}</Text>
                <Text style={styles.foodTitle} numberOfLines={1}>{data.title}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <MaterialIcons name="local-fire-department" size={14} color="#6b7280" />
                        <Text style={styles.foodStats}>{data.calories}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialIcons name="fitness-center" size={14} color="#6b7280" />
                        <Text style={styles.foodStats}>
                            {data.protein.includes('Proteína: ') ? data.protein.replace('Proteína: ', '') : data.protein}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.arrowButton}>
                 <MaterialIcons name="chevron-right" size={24} color="#111813" />
            </View>
         </TouchableOpacity>
    </View>
);


const styles = StyleSheet.create({
    section: { marginTop: 24, paddingHorizontal: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111813' },
    seeAll: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
    
    // Events
    eventsCard: { backgroundColor: 'white', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#f3f4f6' },
    eventItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
    eventBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    dateBadge: { width: 48, height: 48, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    dateLabel: { fontSize: 10, fontWeight: 'bold', color: '#6b7280' },
    dateNumber: { fontSize: 18, fontWeight: 'bold', color: '#111813' },
    eventInfo: { flex: 1 },
    eventTitle: { fontSize: 16, fontWeight: 'bold', color: '#111813' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    timeText: { fontSize: 12, color: '#6b7280' },
    addButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },

    // Leaderboard
    leaderboardCard: { padding: 20, borderRadius: 8 },
    podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 160, gap: 16 },
    podiumPlace: { alignItems: 'center', gap: 4 },
    avatarWrapper: { position: 'relative' },
    podiumAvatarSmall: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'white' },
    podiumAvatarLarge: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: PRIMARY_COLOR },
    rankBadgeSmall: { position: 'absolute', bottom: -8, left: 14, width: 20, height: 20, borderRadius: 10, backgroundColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'white' },
    rankBadgeLarge: { position: 'absolute', bottom: -8, left: 20, width: 24, height: 24, borderRadius: 12, backgroundColor: '#facc15', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1e3a29' },
    rankText: { fontSize: 10, fontWeight: 'bold', color: 'black' },
    podiumName: { color: 'white', fontSize: 12, fontWeight: '500' },
    podiumPoints: { color: PRIMARY_COLOR, fontSize: 10, fontWeight: 'bold' },
    podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },

    // Nutrition
    nutritionCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 8, padding: 16, alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    foodImage: { width: 80, height: 80, borderRadius: 8 },
    foodInfo: { flex: 1 },
    foodLabel: { fontSize: 10, fontWeight: 'bold', color: PRIMARY_COLOR, marginBottom: 4 },
    foodTitle: { fontSize: 16, fontWeight: 'bold', color: '#111813' },
    foodStats: { fontSize: 12, color: '#6b7280', flexShrink: 1 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    arrowButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
});
