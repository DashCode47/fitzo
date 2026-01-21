
import { AuthAPI } from '@/api/auth';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomModal } from '@/components/ui/CustomModal';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { goToRegister, goToHome } = useAppNavigation();
  const [nationalId, setNationalId] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'ID' | 'OTP'>('ID');
  
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
            // 1. Lookup Email
            const data = await AuthAPI.lookupEmailByCedula(nationalId);
            if (!data.email) throw new Error('Cédula no encontrada');
            setEmail(data.email);

            // 2. Send OTP
            await AuthAPI.signInWithOtp(data.email);
            
            setStep('OTP');
            setStep('OTP');
            setSuccessMessage(`Se ha enviado un código a su correo registrado: ${data.email}`);
            setSuccessVisible(true);
        } catch (error: any) {
            console.log(error);
            setErrorMessage(error.response?.data?.message || 'Cédula no registrada o inválida');
            setErrorVisible(true);
        } finally {
            setLoading(false);
        }
    } else {
        // Step === OTP
        if (!otp) {
            setErrorMessage('Por favor ingrese el código de verificación');
            setErrorVisible(true);
            return;
        }

        setLoading(true);
        try {
            console.log('[LoginScreen] Verifying OTP...');
            const result = await AuthAPI.verifyOtp(email, otp);
            console.log('[LoginScreen] OTP Verification Success:', result);
            
            console.log('[LoginScreen] Navigating to Home...');
            goToHome();
        } catch (error: any) {
            console.error('[LoginScreen] OTP Verification Failed:', error);
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
    <View style={styles.container}>
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
        onClose={() => setSuccessVisible(false)}
      />
      <ImageBackground 
        source={require('../assets/images/login.jpg')} 
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>IRON</Text>
          <Text style={styles.logoSubText}>BODY</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          
          {step === 'ID' ? (
              /* ID Input */
              <View style={styles.inputWrapper}>
                <FontAwesome name="id-card" size={20} color="#C5A356" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de Cédula"
                  maxLength={10}
                  placeholderTextColor="#888"
                  value={nationalId}
                  onChangeText={setNationalId}
                  keyboardType="numeric"
                />
              </View>
          ) : (
              /* OTP Input */
              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={20} color="#C5A356" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Código de Verificación (OTP)"
                  placeholderTextColor="#888"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                />
              </View>
          )}

          {/* Login Button */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.loginButtonText}>
                {step === 'ID' ? 'INGRESAR' : 'VERIFICAR'}
              </Text>
            )}
          </TouchableOpacity>
          
          {step === 'OTP' && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={loading}>
                 <Text style={styles.secondaryButtonText}>Volver</Text>
              </TouchableOpacity>
          )}

          {step === 'ID' && (
             <TouchableOpacity style={styles.registerLink} onPress={goToRegister}>
                <Text style={styles.registerText}>
                    ¿No tienes cuenta? <Text style={styles.linkText}>Crea una aquí</Text>
                </Text>
             </TouchableOpacity>
          )}

          <Text style={styles.disclaimerText}>
            Al continuar, aceptas nuestros <Text style={styles.linkText}>Términos y Condiciones</Text> y <Text style={styles.linkText}>Política de Privacidad</Text>.
          </Text>

        </View>
        </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -2,
    includeFontPadding: false,
  },
  logoSubText: {
    fontSize: 24,
    fontWeight: '300',
    color: 'white',
    letterSpacing: 8,
    marginTop: -10, // Pull it up closer to IRON
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25, // Pill shape
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#C5A356', // Gold color from image
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C5A356',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center', 
  },
  registerText: {
    color: '#ccc',
    fontSize: 14,
  },
  disclaimerText: {
    marginTop: 20,
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  linkText: {
    color: '#C5A356', // Gold color
    fontWeight: 'bold',
  },
});
