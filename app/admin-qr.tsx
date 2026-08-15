
import { CustomModal } from '@/components/ui/CustomModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const REWARD_TYPES = [
  { id: 'PURCHASE', label: 'Compra de Suplemento', points: 200, icon: 'cart' },
  { id: 'REVIEW', label: 'Reseña Google/RRSS', points: 150, icon: 'star' },
  { id: 'REFERRAL', label: 'Referido Inscrito', points: 500, icon: 'person-add' },
  { id: 'EARLY_RENEWAL', label: 'Renovación Anticipada', points: 300, icon: 'calendar' },
];

export default function AdminGenerateQR() {
  const router = useRouter();
  const theme = useAppTheme();
  const { profile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const generateRewardQR = async () => {
    if (!selectedReward) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_qrs')
        .insert({
          action_type: selectedReward.id,
          points_value: selectedReward.points,
          created_by: profile?.email,
        })
        .select()
        .single();

      if (error) throw error;
      setGeneratedQR(data.id);
    } catch (e: any) {
      console.error(e);
      setModalTitle('ERROR');
      setModalMessage('No se pudo generar el código QR.');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={theme.bgDeep === "#FAFAFA" ? "dark" : "light"} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GENERAR RECOMPENSA</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {!generatedQR ? (
            <>
              <Text style={styles.sectionTitle}>Selecciona el tipo de acción:</Text>
              <View style={styles.grid}>
                {REWARD_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.rewardCard,
                      selectedReward?.id === type.id && styles.selectedCard
                    ]}
                    onPress={() => setSelectedReward(type)}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={32} 
                      color={selectedReward?.id === type.id ? "#000" : "#C5A356"} 
                    />
                    <Text style={[styles.rewardLabel, selectedReward?.id === type.id && styles.selectedText]}>
                      {type.label}
                    </Text>
                    <Text style={[styles.rewardPoints, selectedReward?.id === type.id && styles.selectedText]}>
                      +{type.points} PTS
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.generateButton, !selectedReward && styles.disabledButton]} 
                onPress={generateRewardQR}
                disabled={!selectedReward || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.generateButtonText}>GENERAR QR ÚNICO</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.qrContainer}>
                <Text style={styles.qrTitle}>{selectedReward?.label}</Text>
                <Text style={styles.qrSubtitle}>Escanea este código para recibir {selectedReward?.points} puntos</Text>
                
                <View style={styles.qrFrame}>
                    <QRCode
                        value={generatedQR}
                        size={220}
                        color="black"
                        backgroundColor="white"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={() => {
                        setGeneratedQR(null);
                        setSelectedReward(null);
                    }}
                >
                    <Text style={styles.resetButtonText}>GENERAR OTRO</Text>
                </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <CustomModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: { padding: 5 },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  scrollContent: { padding: 20 },
  sectionTitle: {
    color: '#CCC',
    fontSize: 16,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardCard: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedCard: {
    backgroundColor: '#C5A356',
    borderColor: '#C5A356',
  },
  rewardLabel: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  rewardPoints: {
    color: '#C5A356',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  selectedText: { color: '#000' },
  generateButton: {
    backgroundColor: '#C5A356',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: { opacity: 0.5 },
  generateButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#111',
    padding: 30,
    borderRadius: 20,
  },
  qrTitle: {
    color: '#CAA356',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  qrSubtitle: {
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 30,
  },
  qrFrame: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
  },
  resetButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#C5A356',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#C5A356',
    fontWeight: 'bold',
  }
});
