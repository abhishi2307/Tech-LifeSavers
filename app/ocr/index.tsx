import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input, Header, Card } from '../../components';
import { ocrService } from '../../services/ocrService';
import { useAppTheme } from '../../hooks/useAppTheme';
import { typography, spacing, radius, shadows } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ParsedMed = { name: string; dosage: string; instructions: string; selected: boolean };

export default function OCRScannerScreen() {
  const router = useRouter();
  const { colors: c, isDark } = useAppTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsedMeds, setParsedMeds] = useState<ParsedMed[]>([]);

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setProcessing(true);
    setExtractedText('');
    setParsedMeds([]);
    try {
      const processed = await ocrService.preprocessImage(uri);
      const text = await ocrService.extractText(processed);
      setExtractedText(text);
      if (text) {
        const meds = ocrService.parseMedicationsFromText(text).map((m) => ({
          ...m,
          selected: true,
        }));
        setParsedMeds(meds);
        if (meds.length === 0) {
          Toast.show({ type: 'info', text1: 'No medications detected', text2: 'You can edit the text and add manually' });
        }
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Processing failed', text2: 'Could not analyze image' });
    } finally {
      setProcessing(false);
    }
  };

  const captureCamera = async () => {
    const uri = await ocrService.captureFromCamera();
    if (uri) processImage(uri);
  };

  const pickLibrary = async () => {
    const uri = await ocrService.pickFromLibrary();
    if (uri) processImage(uri);
  };

  const toggleMed = (idx: number) => {
    setParsedMeds((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, selected: !m.selected } : m))
    );
  };

  const addSelected = () => {
    const selected = parsedMeds.filter((m) => m.selected);
    if (selected.length === 0) {
      Toast.show({ type: 'info', text1: 'Select at least one medication' });
      return;
    }
    router.push('/medications/add');
    Toast.show({ type: 'success', text1: `${selected.length} medication(s) ready to add` });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header title="Scan Prescription" subtitle="AI Smart Extraction" showBack centered />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image preview */}
        <Card style={styles.previewCard}>
          <View style={styles.previewContent}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderBox}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color={c.textTertiary} />
                <Text style={[styles.placeholderText, { color: c.textSecondary }]}>No prescription selected</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Pick buttons */}
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={captureCamera}
            style={styles.halfButton}
            disabled={processing}
          >
            Camera
          </Button>
          <Button
            variant="outline"
            onPress={pickLibrary}
            style={styles.halfButton}
            disabled={processing}
          >
            Gallery
          </Button>
        </View>

        {processing && (
          <View style={styles.processingBox}>
            <ActivityIndicator color={c.primary} size="large" />
            <Text style={[styles.processingText, { color: c.textSecondary }]}>Analyzing prescription...</Text>
          </View>
        )}

        {extractedText && !processing && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Extracted Text</Text>
            <Input
              value={extractedText}
              onChangeText={setExtractedText}
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />
          </Card>
        )}

        {parsedMeds.length > 0 && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Detected Medications</Text>
            <Text style={[styles.sectionSub, { color: c.textSecondary }]}>Select which to add to your list</Text>
            {parsedMeds.map((med, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.medRow, 
                  { borderBottomColor: c.separator },
                  med.selected && { backgroundColor: c.primary + '14' }
                ]}
                onPress={() => toggleMed(idx)}
              >
                <MaterialCommunityIcons 
                  name={med.selected ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={24} 
                  color={med.selected ? c.primary : c.textTertiary} 
                />
                <View style={styles.medInfo}>
                  <Text style={[styles.medName, { color: c.text }]}>{med.name || 'Unknown'}</Text>
                  <Text style={[styles.medDosage, { color: c.primary }]}>{med.dosage}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Button onPress={addSelected} style={styles.addButton}>
              Add Selected to Medications
            </Button>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40 },
  previewCard: { marginBottom: 16, padding: 8 },
  previewContent: { alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: 220, borderRadius: radius.md },
  placeholderBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  placeholderText: { ...typography.bodySm },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  halfButton: { flex: 1 },
  processingBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  processingText: { ...typography.bodySm },
  section: { marginBottom: 16 },
  sectionTitle: { ...typography.h4, marginBottom: 4 },
  sectionSub: { ...typography.caption, marginBottom: 16 },
  textArea: { minHeight: 120 },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  medInfo: { flex: 1 },
  medName: { ...typography.h4 },
  medDosage: { ...typography.caption, fontWeight: '700' },
  addButton: { marginTop: 24 },
});

