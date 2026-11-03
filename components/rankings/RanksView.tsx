import { UserRanks } from "@/api/ranks";
import { LIFTS, RANK_TIERS, STREAK_DAYS_FOR_BONUS } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from "react-native-svg";

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 20, gap: 10 },

    // Level card
    card: {
      borderRadius: 22,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      backgroundColor: theme.bgCard,
      overflow: "hidden",
    },
    top: { flexDirection: "row", alignItems: "center", gap: 16 },
    topText: { flex: 1, gap: 2 },
    label: { fontSize: 11, fontWeight: "800", color: theme.textMuted, letterSpacing: 1.2 },
    levelName: { fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
    sub: { fontSize: 13, color: theme.textSecondary },
    strong: { fontWeight: "800", color: theme.textPrimary },

    ladder: { flexDirection: "row", gap: 4 },
    seg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.surface, overflow: "hidden" },
    ladderEnds: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    ladderEndText: { fontSize: 10, fontWeight: "700", color: theme.textMuted },

    chips: { gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    chipText: { flex: 1, fontSize: 13, color: theme.textSecondary },

    // Lift rows
    lift: {
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      padding: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
    },
    liftRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    liftName: { flex: 1, fontSize: 14, fontWeight: "700", color: theme.textPrimary },
    liftKg: { fontSize: 14, fontWeight: "800", color: theme.textPrimary },
    pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pillText: { fontSize: 11, fontWeight: "800" },
    barBg: { height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 3 },
    liftHint: { fontSize: 11, color: theme.textMuted },

    rule: { fontSize: 12, color: theme.textMuted, lineHeight: 17, textAlign: "center", marginTop: 2 },
  });

// Hexagon emblem with the level number.
function LevelBadge({ level, color, size = 96 }: { level: number; color: string; size?: number }) {
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 180) * (60 * k - 90);
      return `${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`;
    }).join(" ");

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="lvl" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color} stopOpacity={0.55} />
          </SvgGradient>
        </Defs>
        <Polygon points={hex(size / 2 - 2)} fill="url(#lvl)" />
        <Polygon
          points={hex(size / 2 - 10)}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFFFFF", opacity: 0.85, letterSpacing: 1 }}>
          NIVEL
        </Text>
        <Text style={{ fontSize: 34, fontWeight: "900", color: "#FFFFFF", lineHeight: 38 }}>{level}</Text>
      </View>
    </View>
  );
}

interface Props {
  ranks: UserRanks;
  streak: number;
}

export const RanksView: React.FC<Props> = ({ ranks, streak }) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const tier = RANK_TIERS[ranks.tierIndex];
  const next = RANK_TIERS[ranks.tierIndex + 1];
  const label = (key: string) => LIFTS.find((x) => x.key === key)!.label;

  // The single most useful action: log a missing lift (cheapest level-up),
  // otherwise the lift closest to its next level.
  const unlogged = ranks.lifts.find((l) => l.maxWeight === 0);
  const closest = ranks.lifts
    .filter((l) => l.kgToNext !== null && l.maxWeight > 0)
    .sort((a, b) => a.kgToNext! - b.kgToNext!)[0];

  const streakPct = Math.round(ranks.streakBonus * 100);

  return (
    <View style={styles.wrap}>
      {/* ── Level card ── */}
      <View style={[styles.card, { borderColor: tier.color + "50" }]}>
        <LinearGradient
          colors={[tier.color + "26", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={styles.top}>
          <LevelBadge level={ranks.tierIndex + 1} color={tier.color} />
          <View style={styles.topText}>
            <Text style={styles.label}>TU NIVEL</Text>
            <Text style={[styles.levelName, { color: tier.color }]}>{tier.name}</Text>
            <Text style={styles.sub}>
              {next ? (
                <>
                  <Text style={styles.strong}>{Math.round(ranks.progress * 100)}%</Text> hacia {next.name}
                </>
              ) : (
                "¡Nivel máximo alcanzado!"
              )}
            </Text>
          </View>
        </View>

        {/* 10-step ladder in the current level's color; current segment partially filled */}
        <View>
          <View style={styles.ladder}>
            {RANK_TIERS.map((t, i) => (
              <View key={t.name} style={styles.seg}>
                {i <= ranks.tierIndex && (
                  <View
                    style={{
                      height: "100%",
                      width: i < ranks.tierIndex || !next ? "100%" : `${Math.max(ranks.progress * 100, 8)}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                )}
              </View>
            ))}
          </View>
          <View style={styles.ladderEnds}>
            <Text style={styles.ladderEndText}>1</Text>
            <Text style={styles.ladderEndText}>{RANK_TIERS.length}</Text>
          </View>
        </View>

        <View style={styles.chips}>
          {(unlogged || closest) && (
            <View style={styles.chip}>
              <Ionicons name="arrow-up-circle" size={18} color={theme.accent} />
              <Text style={styles.chipText}>
                {unlogged ? (
                  <>
                    Registra <Text style={styles.strong}>{label(unlogged.lift)}</Text> para subir
                  </>
                ) : (
                  <>
                    Siguiente paso: <Text style={styles.strong}>+{closest!.kgToNext} kg</Text> en{" "}
                    {label(closest!.lift)}
                  </>
                )}
              </Text>
            </View>
          )}
          <View style={styles.chip}>
            <Ionicons name="flame" size={18} color="#FB923C" />
            <Text style={styles.chipText}>
              <Text style={styles.strong}>{streak} días</Text> de racha ·{" "}
              {streakPct >= 100 ? "+1 nivel activo" : `${streakPct}% del bono (+1 nivel a los ${STREAK_DAYS_FOR_BONUS})`}
            </Text>
          </View>
        </View>
      </View>

      {/* ── The 4 lifts ── */}
      {ranks.lifts.map((l) => {
        const info = LIFTS.find((x) => x.key === l.lift)!;
        const t = RANK_TIERS[l.tierIndex];
        const nextLift = RANK_TIERS[l.tierIndex + 1];
        return (
          <View key={l.lift} style={styles.lift}>
            <View style={styles.liftRow}>
              <Ionicons name={info.icon as any} size={18} color={theme.accent} />
              <Text style={styles.liftName}>{info.label}</Text>
              <Text style={styles.liftKg}>{l.maxWeight} kg</Text>
              <View style={[styles.pill, { backgroundColor: t.color + "22" }]}>
                <Text style={[styles.pillText, { color: t.color }]}>{t.name}</Text>
              </View>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${l.progress * 100}%`, backgroundColor: t.color }]} />
            </View>
            <Text style={styles.liftHint}>
              {l.kgToNext === null ? (
                "Nivel máximo"
              ) : l.maxWeight === 0 ? (
                "Registra este ejercicio para empezar"
              ) : (
                <>
                  +<Text style={styles.strong}>{l.kgToNext} kg</Text> para {nextLift.name}
                </>
              )}
            </Text>
          </View>
        );
      })}

      <Text style={styles.rule}>
        Tu nivel es el promedio de estos 4 levantamientos.{"\n"}
        {STREAK_DAYS_FOR_BONUS} días de racha suman +1 nivel.
      </Text>
    </View>
  );
};
