import { Linking } from 'react-native';
import * as Location from 'expo-location';
import { FamilyMember } from '../types';

class SOSService {
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  }

  formatSOSMessage(
    userName: string,
    location?: { latitude: number; longitude: number } | null
  ): string {
    let msg = `🚨 EMERGENCY SOS: ${userName} needs immediate help! This is an automated alert from MediPulse AI.`;
    if (location) {
      msg += ` Location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    }
    return msg;
  }

  async sendSOSToContact(phoneNumber: string, message: string): Promise<void> {
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }

  async sendSOSAlert(userName: string, contacts: FamilyMember[]): Promise<void> {
    const location = await this.getCurrentLocation();
    const message = this.formatSOSMessage(userName, location);

    const priority = [...contacts].sort(
      (a, b) => (b.emergencyPriority ?? 0) - (a.emergencyPriority ?? 0)
    );
    const first = priority.find((c) => c.phoneNumber);
    if (first?.phoneNumber) {
      await this.sendSOSToContact(first.phoneNumber, message);
    }
  }

  callEmergencyServices(): void {
    Linking.openURL('tel:112');
  }
}

export const sosService = new SOSService();
