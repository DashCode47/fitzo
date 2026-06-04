import { RANK_TIERS } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { RankingInfoModal } from "./RankingInfoModal";

interface GeneralRankBadgeProps {
  tierIndex: number;
  avgIndex: number;
  muscleCount: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: 24,
      marginVertical: 16,
      overflow: "hidden",
      height: 140,
    },
    overlay: {
      padding: 24,
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
    },
    rankTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FFFFFF",
      textTransform: "uppercase",
      letterSpacing: 1,
      opacity: 0.8,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    tierName: {
      fontSize: 30,
      fontWeight: "900",
      color: "#FFFFFF",
      marginBottom: 8,
    },
    description: {
      fontSize: 13,
      color: "#FFFFFF",
      opacity: 0.8,
      fontWeight: "500",
      marginTop: 4,
    },
    badgeContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    textColumn: {
      flex: 1,
      paddingRight: 20,
    },
    ringContainer: {
      position: "relative",
      width: 110,
      height: 110,
      justifyContent: "center",
      alignItems: "center",
    },
    ringCenter: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
  });

export const GeneralRankBadge: React.FC<GeneralRankBadgeProps> = ({
  tierIndex,
  avgIndex,
  muscleCount,
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [modalVisible, setModalVisible] = React.useState(false);
  const tierInfo = RANK_TIERS[tierIndex];

  const isMaxTier = tierIndex === RANK_TIERS.length - 1;
  const nextThreshold = tierIndex + 0.5;
  const pointsNeeded = !isMaxTier
    ? Math.ceil((nextThreshold - avgIndex) * muscleCount)
    : 0;

  // Calculate circle progress (percentage inside current tier)
  const isChulla = tierIndex === 0;
  const currentStart = isChulla ? 0 : tierIndex - 0.5;
  const nextStart = isChulla ? 0.5 : tierIndex + 0.5;
  const range = nextStart - currentStart;
  const progressPercent = !isMaxTier
    ? Math.max(0, Math.min(1, (avgIndex - currentStart) / range))
    : 1;

  // Ring dimensions
  const size = 110;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <>
      <LinearGradient
        colors={[tierInfo.color, tierInfo.color + "40"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.badgeContent}>
            <View style={styles.textColumn}>
              <View style={styles.headerRow}>
                <Text style={styles.rankTitle}>RANGO GENERAL</Text>
              </View>
              <Text style={styles.tierName}>{tierInfo.name}</Text>

              {!isMaxTier ? (
                <Text style={styles.description}>
                  Faltan{" "}
                  <Text style={{ fontWeight: "900", color: "#fff" }}>
                    {pointsNeeded}
                  </Text>{" "}
                  niveles para {RANK_TIERS[tierIndex + 1].name}
                </Text>
              ) : (
                <Text style={styles.description}>¡Máximo nivel alcanzado!</Text>
              )}
            </View>

            {/* Progress Ring */}
            <View style={styles.ringContainer}>
              <Svg
                width={size}
                height={size}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth={stroke}
                  fill="transparent"
                />
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#FFFFFF"
                  strokeWidth={stroke}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Ionicons
                  name={tierInfo.icon as any}
                  size={30}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <RankingInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentTierIndex={tierIndex}
      />
    </>
  );
};
