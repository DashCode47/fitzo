import { ROUTINE_GOALS, Routine, RoutinesAPI } from '@/api/routines';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

export const GOAL_ICONS: Record<string, IconName> = {
  hypertrophy: 'barbell',
  strength: 'flash',
  fat_loss: 'flame',
  endurance: 'pulse',
};

const DIFFICULTY_LEVEL: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

// Signal-style bars: how hard the routine is at a glance.
export const DifficultyBars = ({ level, color, dim }: { level: number; color: string; dim: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12 }}>
    {[5, 8, 11].map((h, i) => (
      <View key={h} style={{ width: 3, height: h, borderRadius: 1.5, backgroundColor: i < level ? color : dim }} />
    ))}
  </View>
);

export type RoutineMetaItem = { key: string; icon: React.ReactNode; text: string };

// Chips shown on routine cards (home + routines screen) so both read the same.
export const routineMeta = (routine: Routine, theme: AppTheme): RoutineMetaItem[] => {
  const exerciseCount = routine.exercises?.length ?? 0;
  return [
    routine.estimated_duration && {
      key: 'time',
      icon: <Ionicons name="timer-outline" size={14} color={theme.accent} />,
      text: `${routine.estimated_duration} min`,
    },
    routine.difficulty && {
      key: 'difficulty',
      icon: (
        <DifficultyBars
          level={DIFFICULTY_LEVEL[routine.difficulty] ?? 1}
          color={theme.accent}
          dim={theme.borderMuted}
        />
      ),
      text: RoutinesAPI.translateDifficulty(routine.difficulty),
    },
    routine.goal && ROUTINE_GOALS[routine.goal] && {
      key: 'goal',
      icon: <Ionicons name={GOAL_ICONS[routine.goal] ?? 'fitness'} size={13} color={theme.accent} />,
      text: ROUTINE_GOALS[routine.goal],
    },
    exerciseCount > 0 && {
      key: 'exercises',
      icon: <Ionicons name="list" size={14} color={theme.accent} />,
      text: `${exerciseCount} ejercicios`,
    },
  ].filter(Boolean) as RoutineMetaItem[];
};

interface Props {
  routine: Routine;
  loading?: boolean;
  onPress: () => void;
}

export const TodayWorkoutCard = ({ routine, loading, onPress }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const meta = routineMeta(routine, theme);

  return (
    <TouchableOpacity style={styles.hero} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      <LinearGradient
        colors={[theme.accentDim, theme.accentGlow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inner}
      >
        {/* hairline highlight on the top edge */}
        <LinearGradient
          colors={['transparent', theme.accentLight, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.hairline}
        />
        <Text style={styles.eyebrow}>ENTRENAMIENTO DE HOY</Text>
        <Text style={styles.title} numberOfLines={2}>{routine.name}</Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            {meta.map((m) => (
              <View key={m.key} style={styles.chip}>
                {m.icon}
                <Text style={styles.chipText}>{m.text}</Text>
              </View>
            ))}
          </View>
          <LinearGradient colors={theme.gradients.accent} style={styles.play}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
            )}
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.accentBorder,
    backgroundColor: theme.bgCard,
  },
  inner: {
    padding: 22,
    gap: 6,
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.accentLight,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: theme.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
    marginRight: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderMuted,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
