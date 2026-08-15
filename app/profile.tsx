import { AuthAPI } from "@/api/auth";
import { NutritionAPI } from "@/api/nutrition";
import { calculateAllRanks, RanksAPI } from "@/api/ranks";
import { UserAPI } from "@/api/user";
import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useProfileImage } from "@/hooks/useProfileImage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MUSCLE_GROUPS, RANK_TIERS } from "@/constants/ranks";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const { goToLogin, goBack } = useAppNavigation();

  const {
    profile,
    setProfile,
    clearAll,
    isHydrated,
    muscleRanks,
    setMuscleRanks,
    userStats,
    setUserStats,
    themeMode,
    setThemeMode,
  } = useAppStore();

  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(!profile);
  const { uploadAvatar, uploading } = useProfileImage();
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "error" as "error" | "success" | "confirm",
    onConfirm: () => {},
  });

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isHydrated && profile?.id) {
      loadProfile();
      if (!userStats) loadUserStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, profile?.id]);

  // Ranks are calculated client-side from raw max-weight data and only
  // written to the store as a side effect — RanksView (the "Mis Rangos" tab)
  // is the only other place that does this. Without loading them here too,
  // this screen's "Mis Rangos" preview silently stays empty for anyone who
  // hasn't visited that tab yet, even though they have real data to show.
  useEffect(() => {
    if (isHydrated && profile?.id && userStats?.weight && !muscleRanks) {
      loadMuscleRanks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, profile?.id, userStats?.weight]);

  const loadMuscleRanks = async () => {
    if (!profile?.id || !userStats?.weight) return;
    try {
      const maxWeights = await RanksAPI.getUserMaxWeights(profile.id);
      const ranks = calculateAllRanks(
        maxWeights,
        userStats.weight,
        (userStats.gender as any) || "M",
      );
      setMuscleRanks(ranks);
    } catch (e) {
      console.error("[ProfileScreen] Failed to load muscle ranks:", e);
    }
  };

  const loadUserStats = async () => {
    if (!profile?.id) return;
    try {
      const stats = await NutritionAPI.getUserStats(profile.id);
      if (stats) setUserStats(stats);
    } catch (e) {
      console.error("[ProfileScreen] Failed to load user stats:", e);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await UserAPI.getProfile();
      if (data) setProfile(data);
    } catch (e: any) {
      console.error("[ProfileScreen] Profile load failed:", e.message);
      if (!profile) setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setModalConfig({
      title: "Cerrar sesión",
      message: "¿Estás seguro que deseas salir de tu cuenta?",
      type: "confirm",
      onConfirm: async () => {
        setModalVisible(false);
        try {
          await AuthAPI.logout();
          clearAll();
          goToLogin();
        } catch (error) {
          console.error("Logout failed:", error);
        }
      },
    });
    setModalVisible(true);
  };

  const handleUpdateAvatar = async () => {
    try {
      const url = await uploadAvatar();
      if (url && profile) {
        setAvatarTimestamp(Date.now());
        setProfile({ ...profile, photo_url: url });
      }
    } catch (e) {
      console.error("[ProfileScreen] Avatar upload failed:", e);
      setModalConfig({
        title: "Error",
        message:
          "No pudimos subir tu foto de perfil. Revisa tu conexión e intenta de nuevo.",
        type: "error",
        onConfirm: () => {},
      });
      setModalVisible(true);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (loadError && !profile) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient
          colors={theme.gradients.bg}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={theme.textMuted}
        />
        <Text style={styles.errorTitle}>No pudimos cargar tu perfil</Text>
        <Text style={styles.errorText}>
          Revisa tu conexión e intenta de nuevo.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Ionicons name="refresh" size={14} color={theme.accent} />
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const username = profile?.username || "Atleta";
  const email = profile?.email || "–";
  const phone = profile?.phone || "No registrado";
  const role = profile?.role || "CLIENT";
  const points = profile?.total_points || 0;
  const photoUrl = profile?.photo_url
    ? `${profile.photo_url}?t=${avatarTimestamp}`
    : null;

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
        onConfirm={modalConfig.onConfirm}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar section ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {username[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={theme.accent} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={handleUpdateAvatar}
                disabled={uploading}
              >
                <Ionicons name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.username}>{username}</Text>

            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role}</Text>
            </View>

            {/* Points badge */}
            {/* <View style={styles.pointsBadge}>
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.pointsText}>
                {points.toLocaleString()} pts
              </Text>
            </View> */}
          </View>

          {/* ── Weight warning banner ── */}
          {!userStats?.weight && (
            <TouchableOpacity
              style={styles.weightWarning}
              onPress={() => router.push("/(tabs)/nutrition")}
              activeOpacity={0.85}
            >
              <Ionicons name="warning-outline" size={18} color="#f59e0b" />
              <Text style={styles.weightWarningText}>
                Configura tu peso corporal para activar los Rankings
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* ── Info card ── */}
          <View style={styles.card}>
            <InfoRow
              icon="mail-outline"
              label="Correo"
              value={email}
              theme={theme}
              styles={styles}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="call-outline"
              label="Teléfono"
              value={phone}
              theme={theme}
              styles={styles}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="barbell-outline"
              label="Peso Corporal"
              value={
                userStats?.weight ? `${userStats.weight} kg` : "No configurado"
              }
              theme={theme}
              styles={styles}
              onPress={() => router.push("/(tabs)/nutrition")}
              highlight={!userStats?.weight}
            />
          </View>

          {/* ── My Ranks Section ── */}
          {muscleRanks && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Rangos</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/rankings",
                      params: { view: "ranks" },
                    })
                  }
                >
                  <Text style={styles.viewMoreRanks}>VER TODOS</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ranksScroll}
              >
                {muscleRanks.muscleRanks.map((rank) => {
                  const muscle = MUSCLE_GROUPS.find(
                    (m) => m.key === rank.muscleGroup,
                  );
                  const tier = RANK_TIERS[rank.tierIndex];
                  return (
                    <TouchableOpacity
                      key={rank.muscleGroup}
                      style={styles.miniRankCard}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/rankings",
                          params: { view: "ranks" },
                        })
                      }
                    >
                      <Ionicons
                        name={muscle?.icon as any}
                        size={16}
                        color={theme.accent}
                      />
                      <Text style={styles.miniRankMuscle} numberOfLines={1}>
                        {muscle?.label}
                      </Text>
                      <View
                        style={[
                          styles.miniTierBadge,
                          { backgroundColor: tier.color + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.miniTierText, { color: tier.color }]}
                        >
                          {tier.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── Theme Selection ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Apariencia</Text>
            <Ionicons
              name="color-palette-outline"
              size={16}
              color={theme.textMuted}
            />
          </View>

          <View style={styles.themeSelector}>
            <ThemeOption
              isActive={themeMode === "dark"}
              color="#6C63FF"
              onPress={() => setThemeMode("dark")}
              theme={theme}
              styles={styles}
            />
            <ThemeOption
              isActive={themeMode === "light"}
              color="#F4F4F5"
              onPress={() => setThemeMode("light")}
              theme={theme}
              styles={styles}
            />
            <ThemeOption
              isActive={themeMode === "cyan"}
              color="#4CD6C8"
              onPress={() => setThemeMode("cyan")}
              theme={theme}
              styles={styles}
            />
            <ThemeOption
              isActive={themeMode === "gold"}
              color="#C5A356"
              onPress={() => setThemeMode("gold")}
              theme={theme}
              styles={styles}
            />
          </View>

          {/* ── Workout History link ── */}
          <TouchableOpacity
            style={styles.historyLinkRow}
            onPress={() => router.push("/history")}
            activeOpacity={0.85}
          >
            <View style={styles.historyIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.accent}
              />
            </View>
            <Text style={styles.historyLinkText}>
              Historial de Entrenamiento
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          {/* ── Logout ── */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ThemeOption({
  isActive,
  color,
  onPress,
  theme,
  styles,
}: {
  isActive: boolean;
  color: string;
  onPress: () => void;
  theme: AppTheme;
  styles: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        isActive && {
          borderColor: theme.accent,
          backgroundColor: theme.surface,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.themeColorCircle, { backgroundColor: color }]}>
        {isActive && (
          <View style={styles.themeActiveIndicator}>
            <Ionicons name="checkmark" size={10} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
  styles,
  onPress,
  highlight,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  theme: AppTheme;
  styles: any;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const content = (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIconBox,
          highlight && {
            backgroundColor: "rgba(245,158,11,0.15)",
            borderColor: "rgba(245,158,11,0.4)",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={highlight ? "#f59e0b" : theme.accent}
        />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, highlight && { color: "#f59e0b" }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={highlight ? "#f59e0b" : theme.textMuted}
        />
      )}
    </View>
  );
  if (onPress)
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  return content;
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
    },
    loadingRoot: {
      flex: 1,
      backgroundColor: theme.bgDeep,
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.textPrimary,
      marginTop: 4,
    },
    errorText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
    },
    retryBtnText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "800",
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 220,
      zIndex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.textPrimary,
      letterSpacing: -0.3,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 16,
    },
    avatarSection: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 10,
    },
    avatarWrap: {
      position: "relative",
      marginBottom: 4,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: theme.accentBorder,
    },
    avatarPlaceholder: {
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontSize: 36,
      fontWeight: "800",
      color: theme.accent,
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    cameraBtn: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.bgDeep,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    username: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    rolePill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    roleText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textSecondary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    pointsBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      overflow: "hidden",
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    pointsText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      overflow: "hidden",
    },
    divider: {
      height: 1,
      backgroundColor: theme.borderSubtle,
      marginLeft: 64,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: theme.accentDim,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    infoContent: {
      flex: 1,
      gap: 2,
    },
    infoLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textMuted,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    infoValue: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.textPrimary,
    },
    themeSelector: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 8,
    },
    themeOption: {
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      borderRadius: 16,
    },
    themeColorCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    themeActiveIndicator: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.surface,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(248,113,113,0.3)",
      backgroundColor: "rgba(248,113,113,0.08)",
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.error,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    historyLinkRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    historyIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.accentDim,
      justifyContent: "center",
      alignItems: "center",
    },
    historyLinkText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    weightWarning: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      backgroundColor: "rgba(245,158,11,0.1)",
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.35)",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    weightWarningText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600" as const,
      color: "#f59e0b",
    },
    viewMoreRanks: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.accent,
      letterSpacing: 0.5,
    },
    ranksScroll: {
      gap: 10,
      paddingBottom: 4,
    },
    miniRankCard: {
      width: 90,
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      padding: 10,
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    miniRankMuscle: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textMuted,
      textTransform: "uppercase",
    },
    miniTierBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    miniTierText: {
      fontSize: 9,
      fontWeight: "800",
      textTransform: "uppercase",
    },
  });
