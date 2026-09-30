import { Routine, RoutinesAPI } from '@/api/routines';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  routine: Routine;
  loading?: boolean;
  onPress: () => void;
}

export const TodayWorkoutCard = ({ routine, loading, onPress }: Props) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const meta = [
    routine.estimated_duration && { icon: 'time-outline', text: `${routine.estimated_duration} min` },
    routine.difficulty && { icon: 'speedometer-outline', text: RoutinesAPI.translateDifficulty(routine.difficulty) },
  ].filter(Boolean) as { icon: keyof typeof Ionicons.glyphMap; text: string }[];

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
              <View key={m.icon} style={styles.chip}>
                <Ionicons name={m.icon} size={12} color={theme.textSecondary} />
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
    gap: 8,
    flexShrink: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
