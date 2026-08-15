import { AuthAPI } from "@/api/auth";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CustomModal } from "@/components/ui/CustomModal";
import { AppTheme } from "@/constants/theme";

type Field = {
  key: keyof typeof INITIAL_FORM;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keyboard?: React.ComponentProps<typeof TextInput>["keyboardType"];
  maxLength?: number;
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
};

const INITIAL_FORM = {
  email: "",
  firstName: "",
  lastName: "",
  nationalId: "",
  phone: "",
  gender: "" as "male" | "female" | "",
  weight: "",
};

const FIELDS: Field[] = [
  {
    key: "email",
    label: "Correo electrónico",
    icon: "mail-outline",
    keyboard: "email-address",
    autoCapitalize: "none",
  },
  { key: "firstName", label: "Nombre", icon: "person-outline" },
  { key: "lastName", label: "Apellido", icon: "person-outline" },
  {
    key: "nationalId",
    label: "Cédula",
    icon: "card-outline",
    keyboard: "numeric",
    maxLength: 10,
  },
  {
    key: "phone",
    label: "Teléfono",
    icon: "call-outline",
    keyboard: "phone-pad",
  },
];

export default function RegisterScreen() {
  const { goBack } = useAppNavigation();
  const navigation = useNavigation();
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const fieldStyles = createFieldStyles(theme);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const pendingLeaveAction = useRef<any>(null);
  const leaving = useRef(false);

  const hasChanges =
    !saved && Object.values(formData).some((v) => v !== "");

  useEffect(() => {
    const onBackPress = () => {
      if (hasChanges) {
        setShowDiscardModal(true);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [hasChanges]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!hasChanges || leaving.current) return;
      e.preventDefault();
      pendingLeaveAction.current = e.data.action;
      setShowDiscardModal(true);
    });
    return unsubscribe;
  }, [navigation, hasChanges]);

  const discardAndLeave = () => {
    setShowDiscardModal(false);
    leaving.current = true;
    const action = pendingLeaveAction.current;
    pendingLeaveAction.current = null;
    if (action) navigation.dispatch(action);
    else goBack();
  };

  const attemptGoBack = () => {
    if (hasChanges) setShowDiscardModal(true);
    else goBack();
  };

  const handleChange = (key: keyof typeof INITIAL_FORM, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const { email, firstName, lastName, nationalId, phone, gender, weight } =
      formData;
    if (
      !email ||
      !firstName ||
      !lastName ||
      !nationalId ||
      !phone ||
      !gender ||
      !weight
    ) {
      setErrorMessage(
        "Por favor complete todos los campos, incluyendo género y peso",
      );
      setErrorVisible(true);
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.registerUser({ ...formData, password: nationalId });
      setSaved(true);
      setSuccessMessage(
        "¡Registro exitoso! Revisa tu correo para activar tu cuenta.",
      );
      setSuccessVisible(true);
    } catch (error: any) {
      setErrorMessage(
        error.message || "Error en el registro. Verifica tus datos.",
      );
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />

      <CustomModal
        visible={errorVisible}
        title="ERROR"
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
      <CustomModal
        visible={successVisible}
        title="REGISTRO EXITOSO"
        message={successMessage}
        type="success"
        buttonText="IR AL LOGIN"
        onClose={() => {
          setSuccessVisible(false);
          goBack();
        }}
      />
      <CustomModal
        visible={showDiscardModal}
        title="¿Descartar Registro?"
        message="Perderás los datos que has ingresado si sales ahora."
        type="confirm"
        buttonText="DESCARTAR"
        cancelText="SEGUIR EDITANDO"
        onClose={() => setShowDiscardModal(false)}
        onConfirm={discardAndLeave}
      />

      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      {/* Top glow */}
      <LinearGradient
        colors={theme.gradients.topGlow}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Push content down for SafeArea */}
          <View style={{ height: 60 }} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={attemptGoBack}>
              <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="person-add" size={26} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Crea tu cuenta</Text>
            <Text style={styles.heroSubtitle}>
              Completa los datos para empezar
            </Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            {/* Name row */}
            <View style={styles.row}>
              <InputField
                field={FIELDS[1]}
                value={formData.firstName}
                onChange={handleChange}
                theme={theme}
                style={{ flex: 1, marginRight: 8 }}
              />
              <InputField
                field={FIELDS[2]}
                value={formData.lastName}
                onChange={handleChange}
                theme={theme}
                style={{ flex: 1 }}
              />
            </View>

            {/* Remaining fields */}
            {[FIELDS[0], FIELDS[3], FIELDS[4]].map((field) => (
              <InputField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={handleChange}
                theme={theme}
              />
            ))}

            {/* Gender selection */}
            <Text style={styles.sectionLabel}>Género</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  formData.gender === "male" && styles.genderBtnActive,
                ]}
                onPress={() => handleChange("gender", "male")}
              >
                <Ionicons
                  name="male"
                  size={18}
                  color={formData.gender === "male" ? "#fff" : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.genderBtnText,
                    formData.gender === "male" && styles.genderBtnTextActive,
                  ]}
                >
                  Hombre
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  formData.gender === "female" && styles.genderBtnActive,
                ]}
                onPress={() => handleChange("gender", "female")}
              >
                <Ionicons
                  name="female"
                  size={18}
                  color={formData.gender === "female" ? "#fff" : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.genderBtnText,
                    formData.gender === "female" && styles.genderBtnTextActive,
                  ]}
                >
                  Mujer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weight Input */}
            <Text style={styles.sectionLabel}>Peso (kg)</Text>
            <InputField
              field={{
                key: "weight",
                label: "Ej: 75",
                icon: "speedometer-outline",
                keyboard: "numeric",
              }}
              value={formData.weight}
              onChange={handleChange as any}
              theme={theme}
            />

            {/* Info hint */}
            <View style={styles.hint}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={theme.textMuted}
              />
              <Text style={styles.hintText}>
                Tu peso se usa para calcular tu ranking de fuerza relativo.
                Puedes actualizarlo luego en tu Perfil.
              </Text>
            </View>

            <View style={[styles.hint, { marginTop: 0 }]}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={theme.textMuted}
              />
              <Text style={styles.hintText}>
                Tu cédula se usará como contraseña temporal.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Crear cuenta</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity style={styles.loginLink} onPress={attemptGoBack}>
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{" "}
              <Text style={styles.accentText}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── InputField helper ────────────────────────────────────────────────────────
function InputField({
  field,
  value,
  onChange,
  theme,
  style,
}: {
  field: Field;
  value: string;
  onChange: (key: keyof typeof INITIAL_FORM, value: string) => void;
  theme: AppTheme;
  style?: object;
}) {
  const fieldStyles = createFieldStyles(theme);
  return (
    <View style={[fieldStyles.wrapper, style]}>
      <Ionicons
        name={field.icon}
        size={16}
        color={theme.textSecondary}
        style={fieldStyles.icon}
      />
      <TextInput
        style={fieldStyles.input}
        placeholder={field.label}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={(text) => onChange(field.key, text)}
        keyboardType={field.keyboard ?? "default"}
        maxLength={field.maxLength}
        autoCapitalize={field.autoCapitalize ?? "words"}
      />
    </View>
  );
}

const createFieldStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      paddingHorizontal: 14,
      height: 52,
      marginBottom: 12,
    },
    icon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
    },
  });
// ─────────────────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
    },
    topGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 260,
    },
    scroll: {
      paddingHorizontal: 24,
      paddingBottom: 80,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
      paddingTop: 8,
      marginBottom: 8,
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

    // ── Hero ──────────────────────────────────────────────────────────────────
    hero: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 8,
    },
    iconWrap: {
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
      marginBottom: 4,
    },
    iconGradient: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.borderSubtle,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
      gap: 0,
    },
    row: {
      flexDirection: "row",
    },
    hint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
      marginTop: 4,
    },
    hintText: {
      color: theme.textMuted,
      fontSize: 12,
      flex: 1,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 8,
      marginLeft: 4,
    },
    genderRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    genderBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderMuted,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    genderBtnActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    genderBtnText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    genderBtnTextActive: {
      color: "#fff",
      fontWeight: "700",
    },

    // ── Button ────────────────────────────────────────────────────────────────
    primaryBtn: {
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 10,
    },
    primaryBtnGradient: {
      height: 52,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    loginLink: {
      marginTop: 24,
      alignItems: "center",
    },
    loginLinkText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    accentText: {
      color: theme.accent,
      fontWeight: "600",
    },
  });
