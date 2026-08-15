import { Exercise } from "@/api/routines";
import { REPRESENTATIVE_EXERCISES } from "@/constants/ranks";
import { AppTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MUSCLE_MAP: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Piernas",
  shoulders: "Hombros",
  arms: "Brazos",
  abs: "Abdomen",
  cardio: "Cardio",
  glutes: "Glúteos",
  "full body": "Cuerpo Completo",
  forearms: "Antebrazos",
};

const translateMuscle = (muscle: string) => MUSCLE_MAP[muscle?.toLowerCase()] || muscle;

// Shared by routine-create.tsx and routine-edit.tsx (previously two independently
// hand-copied implementations of this same modal that had already drifted: a broken
// muscle-group toggle, a missing "no results" state, and missing catalog thumbnails
// in one of the two copies). Keeping it as one component means a fix here reaches
// both screens instead of relying on someone remembering to patch both files.
export function ExerciseCatalogModal({
  visible,
  onClose,
  catalog,
  onSelect,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  catalog: Exercise[];
  onSelect: (exercise: Exercise) => void;
  theme: AppTheme;
}) {
  const styles = createStyles(theme);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  const muscleGroups = Array.from(new Set(catalog.map((e) => e.muscle_group).filter(Boolean)));

  const filtered = catalog.filter((e) => {
    const matchesGroup = !group || e.muscle_group === group;
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const handleClose = () => {
    setSearch("");
    setGroup(null);
    setPreviewExercise(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Ejercicios</Text>
              <Text style={styles.sub}>
                ¡Supera tus récords en ejercicios con el tag RANKING para subir de rango!
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              style={[styles.chip, !group && styles.chipActive]}
              onPress={() => setGroup(null)}
            >
              <Text style={[styles.chipText, !group && styles.chipTextActive]}>Todos</Text>
            </TouchableOpacity>
            {muscleGroups.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, group === g && styles.chipActive]}
                onPress={() => setGroup(group === g ? null : g)}
              >
                <Text style={[styles.chipText, group === g && styles.chipTextActive]}>
                  {translateMuscle(g)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            style={{ flex: 1 }}
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Ionicons name="search-outline" size={32} color={theme.textMuted} />
                <Text style={styles.emptyText}>Sin resultados</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.catalogItem}>
                <View style={styles.catalogLeft}>
                  <View style={styles.catalogAvatar}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.avatarImage} contentFit="cover" />
                    ) : (
                      <Ionicons name="fitness" size={18} color={theme.accent} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {Object.values(REPRESENTATIVE_EXERCISES).includes(item.name) && (
                      <View style={[styles.rankBadge, { marginBottom: 4 }]}>
                        <Ionicons name="trophy" size={10} color={theme.accent} />
                        <Text style={styles.rankBadgeText}>RANKING</Text>
                      </View>
                    )}
                    <Text style={styles.catalogName}>{item.name}</Text>
                    <Text style={styles.catalogMeta}>
                      {translateMuscle(item.muscle_group)} · {item.equipment}
                    </Text>
                  </View>
                </View>

                <View style={styles.catalogActions}>
                  <TouchableOpacity
                    style={styles.catalogActionBtn}
                    onPress={() => setPreviewExercise(item)}
                  >
                    <Ionicons name="information-circle-outline" size={24} color={theme.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.catalogActionBtn, { backgroundColor: theme.accentDim }]}
                    onPress={() => onSelect(item)}
                  >
                    <Ionicons name="add" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />

          {previewExercise && (
            <View style={styles.previewContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Vista Previa</Text>
                <TouchableOpacity
                  onPress={() => setPreviewExercise(null)}
                  style={styles.closePreviewBtn}
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.previewImageContainer}>
                  {previewExercise.image_url ? (
                    <Image
                      source={{ uri: previewExercise.image_url }}
                      style={styles.previewImage}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.previewIconPlaceholder}>
                      <Ionicons name="barbell" size={60} color={theme.accentDim} />
                    </View>
                  )}
                </View>

                <View style={styles.previewBody}>
                  <Text style={styles.previewExTitle}>{previewExercise.name}</Text>
                  <View style={styles.modalBadges}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>
                        {translateMuscle(previewExercise.muscle_group)}
                      </Text>
                    </View>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>{previewExercise.equipment}</Text>
                    </View>
                  </View>

                  <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
                  <Text style={styles.previewDesc}>
                    {previewExercise.description ||
                      "No hay una descripción detallada para este ejercicio aún."}
                  </Text>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Standalone preview-only modal, used when a screen wants to preview an exercise
// that's already been added to the routine (not from the catalog list itself).
export function ExercisePreviewModal({
  visible,
  exercise,
  onClose,
  theme,
}: {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  theme: AppTheme;
}) {
  const styles = createStyles(theme);
  return (
    <Modal visible={visible && !!exercise} transparent animationType="slide" onRequestClose={onClose}>
      {exercise && (
        <View style={styles.previewContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Vista Previa</Text>
            <TouchableOpacity onPress={onClose} style={styles.closePreviewBtn}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.previewImageContainer}>
              {exercise.image_url ? (
                <Image source={{ uri: exercise.image_url }} style={styles.previewImage} contentFit="contain" />
              ) : (
                <View style={styles.previewIconPlaceholder}>
                  <Ionicons name="barbell" size={60} color={theme.accentDim} />
                </View>
              )}
            </View>

            <View style={styles.previewBody}>
              <Text style={styles.previewExTitle}>{exercise.name}</Text>
              <View style={styles.modalBadges}>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>{translateMuscle(exercise.muscle_group)}</Text>
                </View>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>{exercise.equipment}</Text>
                </View>
              </View>

              <Text style={styles.descLabel}>DESCRIPCIÓN</Text>
              <Text style={styles.previewDesc}>
                {exercise.description || "No hay una descripción detallada para este ejercicio aún."}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "flex-end",
    },
    content: {
      backgroundColor: theme.bgBase,
      height: "80%",
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    title: { fontSize: 20, fontWeight: "800", color: theme.textPrimary },
    sub: { fontSize: 10, color: theme.accent, marginTop: 4, fontWeight: "600" },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      gap: 8,
      marginBottom: 14,
    },
    searchInput: { flex: 1, color: theme.textPrimary, fontSize: 14, fontWeight: "500" },
    chipsScroll: { flexShrink: 0, flexGrow: 0, height: 36, marginBottom: 14 },
    chipsRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
    },
    chipActive: { backgroundColor: theme.accentDim, borderColor: theme.accentBorder },
    chipText: { fontSize: 13, fontWeight: "700", color: theme.textSecondary },
    chipTextActive: { color: theme.accent },
    emptyList: { alignItems: "center", paddingTop: 48, gap: 8 },
    emptyText: { fontSize: 14, color: theme.textMuted, fontWeight: "600" },
    catalogItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: theme.borderSubtle,
    },
    catalogLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    catalogAvatar: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatarImage: { width: "100%", height: "100%" },
    catalogName: { fontSize: 16, fontWeight: "700", color: theme.textPrimary },
    catalogMeta: { fontSize: 12, color: theme.textSecondary, textTransform: "capitalize" },
    catalogActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    catalogActionBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.surface,
    },
    rankBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: theme.accentDim,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.accentBorder,
      alignSelf: "flex-start",
    },
    rankBadgeText: { fontSize: 8, fontWeight: "900", color: theme.accent },
    previewContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.bgBase,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
      zIndex: 10,
    },
    closePreviewBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    previewImageContainer: {
      width: "100%",
      height: 220,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 20,
    },
    previewImage: { width: "100%", height: "100%" },
    previewIconPlaceholder: {
      flex: 1,
      backgroundColor: theme.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    previewBody: { gap: 16 },
    previewExTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
      textTransform: "uppercase",
    },
    modalBadges: { flexDirection: "row", gap: 8 },
    modalBadge: {
      backgroundColor: theme.accentDim,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    modalBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.accent,
      textTransform: "capitalize",
    },
    descLabel: { fontSize: 11, fontWeight: "800", color: theme.textMuted, letterSpacing: 1 },
    previewDesc: { fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  });
