
import { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, type } = useLocalSearchParams();
  const { promos, events } = useAppStore();
  const theme = useAppTheme();
  const styles = createStyles(theme);

  let content: any = null;
  if (type === 'event') {
    content = events?.find(e => e.id === id);
  } else {
    content = promos?.find(p => p.id === Number(id));
  }

  const formatEventDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).replace(/^\w/, c => c.toUpperCase());
    } catch {
      return dateStr;
    }
  };

  if (!content) {
    return (
      <View style={styles.errorRoot}>
        <LinearGradient colors={theme.gradients.bg} style={StyleSheet.absoluteFill} />
        <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
        <Text style={styles.errorTitle}>No encontrado</Text>
        <Text style={styles.errorText}>No se encontró la información solicitada.</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <LinearGradient colors={theme.gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.errorBtnGradient}>
            <Text style={styles.errorBtnText}>Volver</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const isEvent = type === 'event';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero image ── */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: content.image_url || '' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', theme.bgDeep]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Meta row: tag + date */}
          <View style={styles.metaRow}>
            {isEvent ? (
              <View style={[styles.tagPill, { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.35)' }]}>
                <Text style={[styles.tagText, { color: theme.success }]}>EVENTO</Text>
              </View>
            ) : content.tag ? (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{content.tag.toUpperCase()}</Text>
              </View>
            ) : <View />}

            {!isEvent && content.expiration_date && (
              <Text style={styles.dateText}>
                Vence: {new Date(content.expiration_date).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Event date/time card */}
          {isEvent && (
            <View style={styles.eventCard}>
              <View style={styles.eventRow}>
                <View style={styles.eventIconBox}>
                  <Ionicons name="calendar-outline" size={16} color={theme.accent} />
                </View>
                <Text style={styles.eventDetailText}>{formatEventDate(content.event_date)}</Text>
              </View>
              <View style={styles.eventRow}>
                <View style={styles.eventIconBox}>
                  <Ionicons name="time-outline" size={16} color={theme.accent} />
                </View>
                <Text style={styles.eventDetailText}>{(content.event_time || '').substring(0, 5)} hs</Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>
            {isEvent ? content.name : content.title}
          </Text>

          {/* Accent divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>
            {content.large_description || content.short_description || content.description}
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bgDeep,
  },

  // ── Error state ────────────────────────────────────────────────────────────
  errorRoot: {
    flex: 1,
    backgroundColor: theme.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  errorBtnGradient: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    alignItems: 'center',
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroContainer: {
    height: 360,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginTop: -24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
  },

  // Event card
  eventCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: theme.accentDim,
    borderWidth: 1,
    borderColor: theme.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDetailText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Title + body
  title: {
    color: theme.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 14,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: theme.accent,
    borderRadius: 2,
    marginBottom: 20,
  },
  description: {
    color: theme.textSecondary,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
});
