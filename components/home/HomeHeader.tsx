import { StreakData } from '@/api/attendance';
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { UserProfile } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HomeHeaderProps {
  profile: UserProfile | null;
  streakData: StreakData;
  onScannerPress: () => void;
  onProfilePress: () => void;
}

export const HomeHeader = ({ profile, streakData, onScannerPress, onProfilePress }: HomeHeaderProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.dateLine}>
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </Text>
        <Text style={styles.greeting}>Hola, {profile?.username || 'Atleta'}</Text>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={12} color={theme.accentLight} />
          <Text style={styles.streakCount}>{streakData.streak}</Text>
          <Text style={styles.streakLabel}>días</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        {/* <TouchableOpacity style={styles.iconBtn} onPress={onScannerPress}>
          <Ionicons name="qr-code-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress}>
          {profile?.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    gap: 4,
  },
  dateLine: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: theme.textMuted,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  streakCount: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  streakLabel: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
  },
});
