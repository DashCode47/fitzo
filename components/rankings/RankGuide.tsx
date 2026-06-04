import { RANK_TIERS } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RankGuideProps {
  currentTierIndex: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 32,
      marginBottom: 20,
    },
    list: {
      gap: 12,
    },
    tierRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    tierInfo: {
      flex: 1,
      gap: 2,
    },
    tierName: {
      fontSize: 15,
      fontWeight: "800",
    },
    tierDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 16,
    },
  });

export const RankGuide: React.FC<RankGuideProps> = ({ currentTierIndex }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {RANK_TIERS.map((tier, index) => {
          const isCurrent = index === currentTierIndex;
          return (
            <View
              key={tier.name}
              style={[
                styles.tierRow,
                isCurrent && {
                  backgroundColor: tier.color + "15",
                  borderColor: tier.color,
                },
              ]}
            >
              <View
                style={[styles.iconBox, { backgroundColor: tier.color + "20" }]}
              >
                <Ionicons
                  name={tier.icon as any}
                  size={20}
                  color={tier.color}
                />
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierName, { color: tier.color }]}>
                  {tier.name} {isCurrent && "(Tu Nivel)"}
                </Text>
                <Text style={styles.tierDesc}>{getTierDescription(index)}</Text>
              </View>
              {isCurrent && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={tier.color}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const getTierDescription = (index: number) => {
  const descriptions = [
    "Estás empezando tu viaje. ¡Cada repetición cuenta!",
    "Has superado la fase inicial. Tu cuerpo empieza a notar el cambio.",
    "Eres un atleta consistente. La disciplina es tu mejor aliada.",
    "Tu fuerza es notable. Eres un referente en el gimnasio.",
    "Nivel avanzado. Tu rendimiento está en el top de la comunidad.",
    "Leyenda. Has alcanzado el pico del rendimiento físico.",
  ];
  return descriptions[index] || "";
};
