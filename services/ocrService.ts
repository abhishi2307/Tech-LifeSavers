import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

class OCRService {
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  async requestLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async pickFromLibrary(): Promise<string | null> {
    const ok = await this.requestLibraryPermission();
    if (!ok) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  async captureFromCamera(): Promise<string | null> {
    const ok = await this.requestCameraPermission();
    if (!ok) return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  async preprocessImage(uri: string): Promise<string> {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 2000 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  }

  async extractText(imageUri: string): Promise<string> {
    try {
      // Tesseract.js works in a web environment; in React Native we use a simpler fallback
      // For production, integrate with a cloud OCR API (Google Cloud Vision, etc.)
      // This stub returns a placeholder until a native OCR bridge is added
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageUri);
      await worker.terminate();
      return text.trim();
    } catch (error) {
      console.warn('OCR extraction failed:', error);
      return '';
    }
  }

  parseMedicationsFromText(text: string): Array<{ name: string; dosage: string; instructions: string }> {
    // Basic pattern: look for common medication patterns
    const lines = text.split('\n').filter((l) => l.trim().length > 2);
    const results: Array<{ name: string; dosage: string; instructions: string }> = [];

    for (const line of lines) {
      const dosageMatch = line.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|%|IU)/i);
      if (dosageMatch) {
        const parts = line.split(dosageMatch[0]);
        results.push({
          name: parts[0].trim(),
          dosage: dosageMatch[0].trim(),
          instructions: parts[1]?.trim() ?? '',
        });
      }
    }

    return results;
  }
}

export const ocrService = new OCRService();
