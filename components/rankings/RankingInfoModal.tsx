import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RankGuide } from "./RankGuide";

interface RankingInfoModalProps {
  visible: boolean;
  onClose: () => void;
  currentTierIndex?: number;
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.8)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.bgBase,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.textPrimary,
    },
    modalSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    modalFooter: {
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: theme.borderSubtle,
      marginTop: 8,
    },
    footerInfo: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },
    closeBtn: {
      marginTop: 20,
      borderRadius: 16,
      overflow: "hidden",
    },
    closeBtnGradient: {
      paddingVertical: 14,
      alignItems: "center",
    },
    closeBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 16,
    },
  });

export const RankingInfoModal: React.FC<RankingInfoModalProps> = ({
  visible,
  onClose,
  currentTierIndex = -1,
}) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Sistema de Rangos</Text>
              <Text style={styles.modalSubtitle}>
                Tu nivel depende de tu fuerza y consistencia.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={32} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <RankGuide currentTierIndex={currentTierIndex} />

            <View style={styles.modalFooter}>
              <Text style={styles.footerInfo}>
                Los rangos se calculan evaluando el levantamiento máximo en
                relación al peso corporal, sumado al bono de racha activa.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeBtnGradient}
              >
                <Text style={styles.closeBtnText}>Entendido</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};
