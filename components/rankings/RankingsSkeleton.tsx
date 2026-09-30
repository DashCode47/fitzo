import { Bone } from "@/components/ui/Bone";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import React from "react";
import { StyleSheet, View } from "react-native";

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    list: {
      paddingHorizontal: 20,
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      gap: 12,
    },
    info: {
      flex: 1,
    },
    scoreCol: {
      alignItems: "flex-end",
    },
  });

// ─── Single row skeleton ──────────────────────────────────────────────────────
function RowSkeleton({ styles }: { styles: any }) {
  return (
    <View style={styles.row}>
      <Bone
        w={20}
        h={14}
        radius={4}
        style={{ marginHorizontal: 4 }}
      />
      <Bone w={44} h={44} radius={13} />
      <View style={styles.info}>
        <Bone w="60%" h={14} radius={4} />
        <Bone w={60} h={10} radius={4} style={{ marginTop: 4 }} />
      </View>
      <View style={styles.scoreCol}>
        <Bone w={48} h={16} radius={4} />
        <Bone w={24} h={9} radius={3} style={{ marginTop: 3 }} />
      </View>
    </View>
  );
}

// ─── RankingsSkeleton (list area only) ───────────────────────────────────────
export function RankingsSkeleton() {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.list}>
      {Array.from({ length: 8 }).map((_, i) => (
        <RowSkeleton key={i} styles={styles} />
      ))}
    </View>
  );
}
