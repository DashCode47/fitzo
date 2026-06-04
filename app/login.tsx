
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomModal } from '@/components/ui/CustomModal';
import { Brand, theme } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const { accent: ACCENT, bgDeep: BG_DEEP, bgCard: BG_CARD, surface: SURFACE,
        textPrimary: TEXT_PRIMARY, textSecondary: TEXT_SECONDARY, textMuted: TEXT_MUTED } = theme;

export default function LoginScreen() {
  const { goToRegister, goToHome } = useAppNavigation();
  const [nationalId, setNationalId] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'ID' | 'OTP'>('ID');

  const otpInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async () => {
    if (step === 'ID') {
      if (!nationalId) {
        setErrorMessage('Por favor ingrese su número de cédula');
        setErrorVisible(true);
        return;
      }
      setLoading(true);
      try {
        const data = await AuthAPI.lookupEmailByCedula(nationalId);
        if (!data.email) throw new Error('Cédula no encontrada');
        setEmail(data.email);
        if (data.email !== 'google@mail.com') {
          await AuthAPI.signInWithOtp(data.email);
          setSuccessMessage(`Código enviado a: ${data.email}`);
        } else {
          setSuccessMessage(`Bypass activado para revisión`);
        }
        Keyboard.dismiss();
        setStep('OTP');
        setSuccessVisible(true);
      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || 'Cédula no registrada o inválida');
        setErrorVisible(true);
      } finally {
        setLoading(false);
      }
    } else {
      if (!otp) {
        setErrorMessage('Por favor ingrese el código de verificación');
        setErrorVisible(true);
        return;
      }
      setLoading(true);
      try {
        let result;
        // BYPASS PARA REVISIÓN DE GOOGLE
        if (email === 'google@mail.com' && otp === '123456') {
          console.log('[LoginScreen] Google Review Bypass active');
          const user = await AuthAPI.login(email, 'FitzoGoogle2026!');
          result = { session: { user }, user }; // Mock structure for consistency
        } else {
          result = await AuthAPI.verifyOtp(email, otp);
        }

        const user = result.session?.user || result.user || result;
        
        if (user) {
          await UserAPI.syncProfile(user).catch(err => {
            console.error('[LoginScreen] Initial sync failed:', err);
          });
        }
        goToHome();
      } catch {
        setErrorMessage('Código incorrecto o expirado');
        setErrorVisible(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setStep('ID');
    setOtp('');
    setErrorMessage('');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <CustomModal
        visible={errorVisible}
        title="ERROR DE ACCESO"
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
      <CustomModal
        visible={successVisible}
        title="CÓDIGO ENVIADO"
        type="success"
        message={successMessage}
        buttonText="ENTENDIDO"
        onClose={() => {
          setSuccessVisible(false);
          setTimeout(() => otpInputRef.current?.focus(), 500);
        }}
      />

      {/* Background gradient */}
      <LinearGradient
        colors={theme.gradients.bg}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle radial glow behind logo */}
      <View style={styles.glowCircle} pointerEvents="none" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.safe}>

            {/* ── Logo ── */}
            <View style={styles.logoSection}>
              <View style={styles.logoIconWrap}>
                 <Image 
                   source={require('../assets/images/icon.png')} 
                   style={styles.logoImage} 
                   resizeMode="contain" 
                 />
              </View>
              <Text style={styles.brandName}>{Brand.name}</Text>
              <Text style={styles.brandTagline}>{Brand.tagline}</Text>
            </View>

            {/* ── Card ── */}
            <View style={styles.card}>

              {/* Step indicator */}
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, step === 'ID' && styles.stepDotActive]} />
                <View style={[styles.stepLine, step === 'OTP' && styles.stepLineActive]} />
                <View style={[styles.stepDot, step === 'OTP' && styles.stepDotActive]} />
              </View>

              <Text style={styles.cardTitle}>
                {step === 'ID' ? 'Bienvenido' : 'Verifica tu identidad'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {step === 'ID'
                  ? 'Ingresa tu cédula para continuar'
                  : `Revisa tu correo y pega el código`}
              </Text>

              {/* Input */}
              {step === 'ID' ? (
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={18} color={TEXT_SECONDARY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de cédula"
                    maxLength={10}
                    placeholderTextColor={TEXT_MUTED}
                    value={nationalId}
                    onChangeText={setNationalId}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={ACCENT} style={styles.inputIcon} />
                  <TextInput
                    ref={otpInputRef}
                    style={[styles.input, { letterSpacing: 6, fontSize: 20 }]}
                    placeholder="· · · · · ·"
                    placeholderTextColor={TEXT_MUTED}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    maxLength={8}
                    selectionColor={ACCENT}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              )}

              {/* Primary button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
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
                      <Text style={styles.primaryBtnText}>
                        {step === 'ID' ? 'Continuar' : 'Verificar'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary actions */}
              {step === 'OTP' && (
                <TouchableOpacity style={styles.ghostBtn} onPress={handleBack} disabled={loading}>
                  <Ionicons name="arrow-back" size={14} color={TEXT_SECONDARY} />
                  <Text style={styles.ghostBtnText}>Volver</Text>
                </TouchableOpacity>
              )}

              {step === 'ID' && (
                <TouchableOpacity style={styles.ghostBtn} onPress={goToRegister}>
                  <Text style={styles.ghostBtnText}>
                    ¿No tienes cuenta?{' '}
                    <Text style={styles.accentText}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Al continuar aceptas nuestros{' '}
              <Text style={styles.accentText}>Términos</Text>
              {' '}y{' '}
              <Text style={styles.accentText}>Privacidad</Text>
            </Text>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_DEEP,
  },
  glowCircle: {
    position: 'absolute',
    top: -height * 0.15,
    alignSelf: 'center',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: theme.accentGlow,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoIconWrap: {
    marginBottom: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    letterSpacing: 0.3,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: BG_CARD,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEXT_MUTED,
  },
  stepDotActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: TEXT_MUTED,
  },
  stepLineActive: {
    backgroundColor: ACCENT,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: -8,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderMuted,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
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
  ghostBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  ghostBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  accentText: {
    color: ACCENT,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 12,
  },
});
