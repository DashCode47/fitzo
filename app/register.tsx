import { AuthAPI } from '@/api/auth';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomModal } from '@/components/ui/CustomModal';
import { theme } from '@/constants/theme';

const { accent: ACCENT, bgDeep: BG_DEEP, bgCard: BG_CARD, surface: SURFACE,
        textPrimary: TEXT_PRIMARY, textSecondary: TEXT_SECONDARY, textMuted: TEXT_MUTED } = theme;

type Field = {
  key: keyof typeof INITIAL_FORM;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboard?: React.ComponentProps<typeof TextInput>['keyboardType'];
  maxLength?: number;
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
};

const INITIAL_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  nationalId: '',
  phone: '',
};

const FIELDS: Field[] = [
  { key: 'email',      label: 'Correo electrónico', icon: 'mail-outline',   keyboard: 'email-address', autoCapitalize: 'none' },
  { key: 'firstName',  label: 'Nombre',              icon: 'person-outline' },
  { key: 'lastName',   label: 'Apellido',             icon: 'person-outline' },
  { key: 'nationalId', label: 'Cédula',               icon: 'card-outline',   keyboard: 'numeric', maxLength: 10 },
  { key: 'phone',      label: 'Teléfono',             icon: 'call-outline',   keyboard: 'phone-pad' },
];

export default function RegisterScreen() {
  const { goBack } = useAppNavigation();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (key: keyof typeof INITIAL_FORM, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const { email, firstName, lastName, nationalId, phone } = formData;
    if (!email || !firstName || !lastName || !nationalId || !phone) {
      setErrorMessage('Por favor complete todos los campos');
      setErrorVisible(true);
      return;
    }
    setLoading(true);
    try {
      await AuthAPI.registerUser({ ...formData, password: nationalId });
      setSuccessMessage('¡Registro exitoso! Revisa tu correo para activar tu cuenta.');
      setSuccessVisible(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error en el registro. Verifica tus datos.');
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

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
        onClose={() => { setSuccessVisible(false); goBack(); }}
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

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              {/* ── Header ── */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                  <Ionicons name="arrow-back" size={20} color={TEXT_SECONDARY} />
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
                <Text style={styles.heroSubtitle}>Completa los datos para empezar</Text>
              </View>

              {/* ── Card ── */}
              <View style={styles.card}>

                {/* Name row */}
                <View style={styles.row}>
                  <InputField
                    field={FIELDS[1]}
                    value={formData.firstName}
                    onChange={handleChange}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <InputField
                    field={FIELDS[2]}
                    value={formData.lastName}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                </View>

                {/* Remaining fields */}
                {[FIELDS[0], FIELDS[3], FIELDS[4]].map(field => (
                  <InputField
                    key={field.key}
                    field={field}
                    value={formData[field.key]}
                    onChange={handleChange}
                  />
                ))}

                {/* Info hint */}
                <View style={styles.hint}>
                  <Ionicons name="information-circle-outline" size={14} color={TEXT_MUTED} />
                  <Text style={styles.hintText}>
                    Tu cédula se usará como contraseña temporal
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
                        <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <TouchableOpacity style={styles.loginLink} onPress={goBack}>
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta? <Text style={styles.accentText}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

// ─── InputField helper ────────────────────────────────────────────────────────
function InputField({
  field,
  value,
  onChange,
  style,
}: {
  field: Field;
  value: string;
  onChange: (key: keyof typeof INITIAL_FORM, value: string) => void;
  style?: object;
}) {
  return (
    <View style={[fieldStyles.wrapper, style]}>
      <Ionicons name={field.icon} size={16} color={TEXT_SECONDARY} style={fieldStyles.icon} />
      <TextInput
        style={fieldStyles.input}
        placeholder={field.label}
        placeholderTextColor={TEXT_MUTED}
        value={value}
        onChangeText={text => onChange(field.key, text)}
        keyboardType={field.keyboard ?? 'default'}
        maxLength={field.maxLength}
        autoCapitalize={field.autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
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
    color: TEXT_PRIMARY,
    fontSize: 15,
  },
});
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_DEEP,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  iconWrap: {
    shadowColor: ACCENT,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: BG_CARD,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  hintText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  primaryBtnGradient: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  accentText: {
    color: ACCENT,
    fontWeight: '600',
  },
});
