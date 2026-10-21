
import { AuthAPI } from '@/api/auth';
import { UserAPI } from '@/api/user';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
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
import { AppTheme, Brand } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { goToRegister, goToHome } = useAppNavigation();
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setErrorMessage('Por favor ingrese su usuario y contraseña');
      setErrorVisible(true);
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const { email } = await AuthAPI.lookupEmailByUsername(username.trim());
      if (!email) throw new Error('invalid');

      const user = await AuthAPI.login(email, password);
      if (user) {
        await UserAPI.syncProfile(user).catch(err => {
          console.error('[LoginScreen] Initial sync failed:', err);
        });
      }
      goToHome();
    } catch (error: any) {
      // AuthAPI.login throws the Supabase error message as a string
      setErrorMessage(
        error === 'Email not confirmed'
          ? 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
          : 'Usuario o contraseña incorrectos'
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
        title="ERROR DE ACCESO"
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
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

              <Text style={styles.cardTitle}>Bienvenido</Text>
              <Text style={styles.cardSubtitle}>Inicia sesión para continuar</Text>

              {/* Inputs */}
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Usuario"
                  placeholderTextColor={theme.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  textContentType="username"
                  autoComplete="username"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

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
                      <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary actions */}
              <TouchableOpacity style={styles.ghostBtn} onPress={goToRegister}>
                <Text style={styles.ghostBtnText}>
                  ¿No tienes cuenta?{' '}
                  <Text style={styles.accentText}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Al continuar aceptas nuestros{' '}
              <Text
                style={styles.accentText}
                onPress={() => WebBrowser.openBrowserAsync('https://fitzo.one/terminos/')}
              >
                Términos
              </Text>
              {' '}y{' '}
              <Text
                style={styles.accentText}
                onPress={() => WebBrowser.openBrowserAsync('https://fitzo.one/privacidad/')}
              >
                Privacidad
              </Text>
            </Text>

          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgDeep,
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
      shadowColor: theme.accent,
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
      color: theme.textPrimary,
      letterSpacing: -1,
    },
    brandTagline: {
      fontSize: 14,
      color: theme.textSecondary,
      letterSpacing: 0.3,
    },

    // ── Card ──────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: theme.bgCard,
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
    cardTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    cardSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: -8,
    },

    // ── Input ─────────────────────────────────────────────────────────────────
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
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
      color: theme.textPrimary,
      fontSize: 16,
    },

    // ── Buttons ───────────────────────────────────────────────────────────────
    primaryBtn: {
      borderRadius: 14,
      overflow: 'hidden',
      shadowColor: theme.accent,
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
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },

    // ── Misc ──────────────────────────────────────────────────────────────────
    accentText: {
      color: theme.accent,
      fontWeight: '600',
    },
    footer: {
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 12,
    },
  });
