import { AuthAPI } from '@/api/auth';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
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

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const { goBack } = useAppNavigation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.nationalId || !formData.phone) {
      console.warn("[RegisterScreen] Validation failed: Missing required fields.");
      setErrorMessage('Por favor complete todos los campos obligatorios');
      setErrorVisible(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        password: formData.nationalId, // Default password
      };

      await AuthAPI.registerUser(payload);
      
      setSuccessMessage("¡Registro exitoso! Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y pulsa el enlace para activar tu cuenta.");
      setSuccessVisible(true);
    } catch (error: any) {
      console.error('[RegisterScreen] Registration failed:', error);
      console.error('[RegisterScreen] Error details:', JSON.stringify(error, null, 2));
      setErrorMessage(error.message || 'Error en el registro. Verifique sus datos.');
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        onClose={() => {
            setSuccessVisible(false);
            goBack();
        }}
      />
      <ImageBackground 
        source={require('../assets/images/login.jpg')} // Reusing login background
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
          style={styles.gradientOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
              {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>CREAR CUENTA</Text>
              <Text style={styles.subtitle}>Únete a Iron Body</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              
              <View style={styles.inputWrapper}>
                <FontAwesome name="envelope" size={18} color="#C5A356" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                    <FontAwesome name="user" size={18} color="#C5A356" style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    placeholderTextColor="#888"
                    value={formData.firstName}
                    onChangeText={(text) => handleChange('firstName', text)}
                    />
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <FontAwesome name="user" size={18} color="#C5A356" style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Apellido"
                    placeholderTextColor="#888"
                    value={formData.lastName}
                    onChangeText={(text) => handleChange('lastName', text)}
                    />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <FontAwesome name="id-card" size={18} color="#C5A356" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  maxLength={10}
                  placeholder="Cédula (National ID)"
                  placeholderTextColor="#888"
                  value={formData.nationalId}
                  onChangeText={(text) => handleChange('nationalId', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrapper}>
                <FontAwesome name="phone" size={18} color="#C5A356" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  placeholderTextColor="#888"
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Text style={styles.backButtonText}>Volver al Login</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#C5A356',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C5A356',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginTop: 20,
  },
  registerButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#C5A356',
    fontSize: 14,
    fontWeight: '600',
  },
});
