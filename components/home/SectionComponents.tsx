import { theme as staticTheme, AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const createStyles = (theme: AppTheme) => StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 13,
    color: theme.accent,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 14,
  },

  // ── Events ──────────────────────────────────────────────────────────────────
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  eventDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.textPrimary,
    lineHeight: 19,
  },
  eventInfo: {
    flex: 1,
    gap: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  eventArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Podium ──────────────────────────────────────────────────────────────────
  podiumCard: {
    padding: 20,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumAvatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  podiumAvatar: {
    borderWidth: 2,
    borderColor: theme.borderMuted,
  },
  glowRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.bgCard,
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.bgDeep,
  },
  podiumName: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  podiumScore: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  tierPill: {
    backgroundColor: theme.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  tierText: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  // ── Nutrition ────────────────────────────────────────────────────────────────
  nutritionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  foodImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  foodInfo: {
    flex: 1,
    gap: 4,
  },
  foodLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.accent,
    letterSpacing: 1,
  },
  foodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: theme.textSecondary,
    flexShrink: 1,
  },
  nutritionArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EventsTimeline ───────────────────────────────────────────────────────────
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

export const EventsTimeline = ({ data, onPressItem }: EventsProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.section}>
      <SectionHeader title="Próximos eventos" />
      <View style={styles.card}>
        {data.length === 0 ? (
          <Text style={styles.emptyText}>No hay eventos próximos.</Text>
        ) : (
          data.map((item, index) => {
            const date = new Date(item.event_date);
            const day = date.getDate() + 1;
            const month = date.toLocaleString('es', { month: 'short' }).toUpperCase();
            const isLast = index === data.length - 1;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.eventRow, !isLast && styles.eventDivider]}
                onPress={() => onPressItem?.(item)}
                activeOpacity={0.7}
              >
                {/* Date badge */}
                <View style={styles.dateBadge}>
                  <Text style={styles.dateMonth}>{month}</Text>
                  <Text style={styles.dateDay}>{day}</Text>
                </View>

                {/* Info */}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                    <Text style={styles.timeText}>{(item.event_time || '').substring(0, 5)}</Text>
                  </View>
                </View>

                {/* Arrow */}
                <View style={styles.eventArrow}>
                  <Ionicons name="chevron-forward" size={14} color={theme.accent} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

// ─── TopThreePodium ───────────────────────────────────────────────────────────
interface LeaderboardProps {
  data: Array<{ rank: number; name: string; score: number; avatar: string }>;
  onSeeAll?: () => void;
}

const RANK_COLORS = ['#C5A356', '#A8A8B3', '#CD7F32'] as const;

export const TopThreePodium = ({ data, onSeeAll }: LeaderboardProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const sorted = [...data].sort((a, b) => a.rank - b.rank).slice(0, 3);
  const [first, second, third] = [
    sorted.find(d => d.rank === 1),
    sorted.find(d => d.rank === 2),
    sorted.find(d => d.rank === 3),
  ];
  if (!first) return null;

  const PodiumItem = ({
    entry,
    size,
    elevated,
  }: {
    entry: any;
    size: 'sm' | 'lg';
    elevated?: boolean;
  }) => {
    if (!entry) return <View style={{ flex: 1 }} />;
    const rankColor = RANK_COLORS[entry.rank - 1];
    const avatarSize = size === 'lg' ? 72 : 56;

    return (
      <View style={[styles.podiumItem, elevated && { marginTop: -20 }]}>
        {elevated && (
          <Ionicons name="trophy" size={22} color="#C5A356" style={{ marginBottom: 6 }} />
        )}
        <View style={styles.podiumAvatarWrap}>
          {elevated && (
            <LinearGradient
              colors={['#C5A356', '#E5C78B']}
              style={[styles.glowRing, { borderRadius: avatarSize / 2 + 6 }]}
            />
          )}
          <Image
            source={entry.avatar ? { uri: entry.avatar } : undefined}
            style={[styles.podiumAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          />
          <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
            <Text style={styles.rankBadgeText}>{entry.rank}</Text>
          </View>
        </View>
        <Text style={[styles.podiumName, elevated && { fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>{entry.tier || 'Chulla'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Los mas Rankeados" onSeeAll={onSeeAll} />
      <View style={[styles.card, styles.podiumCard]}>
        <View style={styles.podiumRow}>
          <PodiumItem entry={second} size="sm" />
          <PodiumItem entry={first} size="lg" elevated />
          <PodiumItem entry={third} size="sm" />
        </View>
      </View>
    </View>
  );
};

// ─── NutritionCard ────────────────────────────────────────────────────────────
interface NutritionProps {
  data: { title: string; calories: string; protein: string; image: string; label?: string };
  onPress?: () => void;
}

export const NutritionCard = ({ data, onPress }: NutritionProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={[styles.section, { marginBottom: 24 }]}>
      <SectionHeader title="Plan Nutricional" />
      <TouchableOpacity style={[styles.card, styles.nutritionCard]} onPress={onPress} activeOpacity={0.8}>
        <Image source={data.image ? { uri: data.image } : undefined} style={styles.foodImage} />
        <View style={styles.foodInfo}>
          <Text style={styles.foodLabel}>{data.label || 'RECOMENDADO'}</Text>
          <Text style={styles.foodTitle} numberOfLines={2}>{data.title}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={13} color={theme.accent} />
              <Text style={styles.statText}>{data.calories}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={13} color={theme.accent} />
              <Text style={styles.statText}>
                {data.protein.includes('Proteína: ') ? data.protein.replace('Proteína: ', '') : data.protein}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.nutritionArrow}>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );
};
