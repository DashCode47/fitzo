import { Banner } from "@/api/banners";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── PromoCarousel ────────────────────────────────────────────────────────────
interface PromoCarouselProps {
  data: Banner[];
  onPressItem?: (item: Banner) => void;
}

const BADGE_COLORS: Record<string, string> = {
  URGENTE: "#EF4444",
  NUEVO: "#34D399",
  INFO: "#3B82F6",
};

export const PromoCarousel = ({ data, onPressItem }: PromoCarouselProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = Dimensions.get("window");
  const CARD_W = width - 48; // 24px padding each side
  const GAP = 16;

  useEffect(() => {
    if (data.length <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % data.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex, data.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index || 0);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const getItemLayout = (_: any, index: number) => ({
    length: CARD_W + GAP,
    offset: (CARD_W + GAP) * index,
    index,
  });

  if (!data.length) return null;

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.carouselList, { paddingHorizontal: 20 }]}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.promoCard, { width: CARD_W }]}
            onPress={() => onPressItem?.(item)}
            activeOpacity={0.9}
          >
            <Image
              source={item.image_url ? { uri: item.image_url } : undefined}
              style={styles.promoImage}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.promoContent}>
              {item.tag && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: BADGE_COLORS[item.tag] ?? theme.accent },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.tag}</Text>
                </View>
              )}
              <Text style={styles.promoTitle}>{item.title}</Text>
              <View style={styles.promoFooter}>
                <Text style={styles.promoSubtitle} numberOfLines={1}>
                  {item.short_description}
                </Text>
                <View style={styles.promoArrow}>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      {/* Pagination */}
      {data.length > 1 && (
        <View style={styles.pagination}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── TopBar (legacy, kept for compatibility) ──────────────────────────────────
interface TopBarProps {
  user: { name: string; avatar: string };
  onPressProfile?: () => void;
}
export const TopBar = ({ user, onPressProfile }: TopBarProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onPressProfile} style={styles.topBarAvatar}>
        {user.avatar ? (
          <Image
            source={user.avatar ? { uri: user.avatar } : undefined}
            style={styles.topBarAvatarImg}
          />
        ) : (
          <Ionicons
            name="person-outline"
            size={20}
            color={theme.textSecondary}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.topBarName}>{user.name}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    // PromoCarousel
    carouselList: {
      gap: 16,
      paddingBottom: 8,
    },
    promoCard: {
      height: 190,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: theme.bgCard,
    },
    promoImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    promoContent: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    promoTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    promoFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    promoSubtitle: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 13,
      flex: 1,
    },
    promoArrow: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    pagination: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textMuted,
    },
    dotActive: {
      width: 18,
      backgroundColor: theme.accent,
      borderRadius: 3,
    },

    // TopBar (legacy)
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 16,
    },
    topBarAvatar: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    topBarAvatarImg: { width: 38, height: 38 },
    topBarName: { color: theme.textPrimary, fontSize: 16, fontWeight: "700" },
  });
