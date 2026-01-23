
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY_COLOR = '#0df259';

interface EventsProps {
    data: Array<{ 
        id: string; 
        name: string; 
        short_description: string; 
        event_date: string; 
        event_time: string;
        image_url?: string;
    }>;
    onPressItem?: (item: any) => void;
}
export const EventsTimeline = ({ data, onPressItem }: EventsProps) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos eventos</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.eventsCard}>
            {data.length === 0 ? (
                <Text style={styles.emptyText}>No hay eventos próximos.</Text>
            ) : (
                data.map((item, index) => {
                    const date = new Date(item.event_date);
                    const day = date.getDate() + 1; // Basic fixed to UTC drift
                    
                    return (
                        <TouchableOpacity 
                            key={item.id} 
                            style={[styles.eventItem, index < data.length - 1 && styles.eventBorder]}
                            onPress={() => onPressItem?.(item)}
                        >
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateLabel}>DÍA</Text>
                                <Text style={styles.dateNumber}>{day}</Text>
                            </View>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>{item.name}</Text>
                                <View style={styles.timeRow}>
                                    <MaterialIcons name="schedule" size={14} color="#6b7280" />
                                    <Text style={styles.timeText}>{(item.event_time || '').substring(0, 5)}</Text>
                                </View>
                            </View>
                            <View style={styles.addButton}>
                                <MaterialIcons name="chevron-right" size={18} color={PRIMARY_COLOR} />
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}
        </View>
    </View>
);

interface LeaderboardProps {
    data: Array<{ rank: number; name: string; score: number; avatar: string }>;
    onSeeAll?: () => void;
}
export const TopThreePodium = ({ data, onSeeAll }: LeaderboardProps) => {
    // Sort data to ensure correct order
    const sorted = [...data].sort((a, b) => a.rank - b.rank).slice(0, 3);
    
    const [first, second, third] = [
        sorted.find(d => d.rank === 1),
        sorted.find(d => d.rank === 2),
        sorted.find(d => d.rank === 3)
    ];

    if (!first) return null;

    const GOLD = '#C5A356';

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: 'white' }]}>Iron Legends</Text>
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={[styles.seeAll, { color: GOLD }]}>Ver todos</Text>
                </TouchableOpacity>
            </View>
            <LinearGradient 
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} 
                style={styles.podiumCard}
            >
                <View style={styles.podiumContent}>
                    {/* Second Place */}
                    {second && (
                        <View style={styles.podiumItem}>
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: second.avatar }} style={styles.podiumAvatarSmall} />
                                <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                                    <Text style={styles.rankBadgeText}>2</Text>
                                </View>
                            </View>
                            <Text style={styles.podiumNameText} numberOfLines={1}>{second.name}</Text>
                            <Text style={styles.podiumPointsText}>{second.score} pts</Text>
                        </View>
                    )}

                    {/* First Place */}
                    <View style={[styles.podiumItem, { marginTop: -20 }]}>
                        <MaterialIcons name="emoji-events" size={28} color={GOLD} style={{ marginBottom: 4 }} />
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[GOLD, '#E5C78B']}
                                style={styles.glowRing}
                            />
                            <Image source={{ uri: first.avatar }} style={styles.podiumAvatarLarge} />
                            <View style={[styles.rankBadge, { backgroundColor: GOLD, width: 28, height: 28, borderRadius: 14, left: 22 }]}>
                                <Text style={[styles.rankBadgeText, { fontSize: 14 }]}>1</Text>
                            </View>
                        </View>
                        <Text style={[styles.podiumNameText, { fontSize: 16, fontWeight: '900' }]} numberOfLines={1}>{first.name}</Text>
                        <Text style={[styles.podiumPointsText, { color: GOLD, fontSize: 14 }]}>{first.score} pts</Text>
                    </View>

                    {/* Third Place */}
                    {third && (
                        <View style={styles.podiumItem}>
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: third.avatar }} style={styles.podiumAvatarSmall} />
                                <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                                    <Text style={styles.rankBadgeText}>3</Text>
                                </View>
                            </View>
                            <Text style={styles.podiumNameText} numberOfLines={1}>{third.name}</Text>
                            <Text style={styles.podiumPointsText}>{third.score} pts</Text>
                        </View>
                    )}
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
    emptyText: { padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 14 },
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
    // Podium Styles
    podiumCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 10,
    },
    podiumContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    podiumAvatarSmall: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    podiumAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'black',
    },
    glowRing: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: 44,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -5,
        left: 17,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'black',
    },
    rankBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'black',
    },
    podiumNameText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    podiumPointsText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },

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
