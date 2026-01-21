
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type?: 'error' | 'success' | 'info' | 'confirm';
  buttonText?: string;
  cancelText?: string;
}

const { width } = Dimensions.get('window');

export const CustomModal = ({ 
  visible, 
  title, 
  message, 
  onClose, 
  onConfirm,
  type = 'error', 
  buttonText,
  cancelText = 'CANCELAR'
}: CustomModalProps) => {
  const isConfirm = type === 'confirm';
  const isSuccess = type === 'success';
  const defaultButtonText = type === 'error' ? 'INTENTAR DE NUEVO' : isConfirm ? 'CONFIRMAR' : 'CONTINUAR';
  
  const getIcon = () => {
    switch(type) {
      case 'success': return 'check-circle';
      case 'confirm': return 'question-circle';
      case 'info': return 'info-circle';
      default: return 'exclamation-circle';
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.overlay} />
        
        <View style={[
          styles.modalView, 
          isSuccess && styles.successGlow,
          type === 'error' && styles.errorGlow
        ]}>
            <LinearGradient
                colors={['#1A1A1A', '#0A0A0A']}
                style={styles.gradientBorder}
            >
                <View style={styles.iconContainer}>
                     <FontAwesome 
                        name={getIcon()} 
                        size={50} 
                        color="#C5A356" 
                     />
                </View>
                
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalText}>{message}</Text>

                <View style={styles.buttonContainer}>
                    {isConfirm && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelTextStyle}>{cancelText}</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={[styles.button, isConfirm && styles.confirmButton]}
                        onPress={onConfirm || onClose}
                    >
                        <Text style={styles.textStyle}>{buttonText || defaultButtonText}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalView: {
    width: width * 0.85,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(197, 163, 86, 0.3)',
  },
  successGlow: {
    borderColor: '#C5A356',
    shadowColor: '#C5A356',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  errorGlow: {
    borderColor: '#FF4444',
  },
  gradientBorder: {
      padding: 30,
      alignItems: 'center',
  },
  iconContainer: {
      marginBottom: 20,
      shadowColor: '#C5A356',
      shadowOpacity: 0.8,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 0 },
  },
  modalTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  modalText: {
    marginBottom: 30,
    textAlign: 'center',
    fontSize: 15,
    color: '#AAA',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#C5A356',
    borderRadius: 25,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#C5A356',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textStyle: {
    color: 'black',
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  cancelTextStyle: {
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
    letterSpacing: 1,
  },
});
