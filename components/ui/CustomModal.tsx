import { AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type?: "error" | "success" | "info" | "confirm";
  buttonText?: string;
  cancelText?: string;
}

const { width } = Dimensions.get("window");

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.75)",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      maxWidth: width * 0.88,
      backgroundColor: theme.bgCard,
      borderRadius: 24,
      borderWidth: 1,
      padding: 28,
      alignItems: "center",
      gap: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 32,
      elevation: 20,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.textPrimary,
      textAlign: "center",
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 21,
      marginBottom: 28,
    },
    btnRow: {
      width: "100%",
      flexDirection: "row",
    },
    primaryBtn: {
      flex: 1,
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    primaryBtnGradient: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
    },
    cancelText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });

export const CustomModal = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  type = "error",
  buttonText,
  cancelText = "Cancelar",
}: CustomModalProps) => {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const TYPE_CONFIG: Record<
    string,
    { icon: IoniconName; color: string; bgColor: string }
  > = {
    success: {
      icon: "checkmark-circle",
      color: theme.success,
      bgColor: theme.success + "20",
    },
    error: {
      icon: "close-circle",
      color: theme.error,
      bgColor: theme.error + "20",
    },
    info: {
      icon: "information-circle",
      color: theme.accent,
      bgColor: theme.accentDim,
    },
    confirm: {
      icon: "help-circle",
      color: theme.warning,
      bgColor: theme.warning + "20",
    },
  };

  const isConfirm = type === "confirm";
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.error;
  const defaultButtonText = isConfirm
    ? "Confirmar"
    : type === "error"
      ? "Intentar de nuevo"
      : "Entendido";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { borderColor: `${cfg.color}33` }]}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bgColor }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={[styles.btnRow, isConfirm && { gap: 10 }]}>
            {isConfirm && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, isConfirm && { flex: 1 }]}
              onPress={onConfirm || onClose}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  type === "error"
                    ? ["#F87171", "#EF4444"]
                    : type === "confirm"
                      ? ["#FBBF24", "#F59E0B"]
                      : theme.gradients.accent
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>
                  {buttonText || defaultButtonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
