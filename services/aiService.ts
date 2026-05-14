// OpenAI integration — uncomment when EXPO_PUBLIC_OPENAI_API_KEY is set in .env
// import OpenAI from 'openai';
import { Medicine } from '../types';

// Keep system prompt for when OpenAI is enabled
const _SYSTEM_PROMPT = `You are MediPulse AI Care Companion, a helpful healthcare assistant for the MediPulse AI app.

Rules:
- Never diagnose, prescribe, or replace professional medical advice. Always recommend consulting a healthcare professional.
- Answer questions about medication adherence, health routines, app features, and general wellness.
- If someone describes emergency symptoms, immediately advise them to call emergency services (112/911).
- Be empathetic, warm, and concise. Keep responses under 150 words unless more detail is specifically requested.
- Do not discuss topics unrelated to health, medications, or wellness.`;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

class AIService {
  private history: ChatMessage[] = [];

  async sendMessage(userMessage: string, medicationContext?: string): Promise<string> {
    // Stub responses until OpenAI key is configured
    const lower = userMessage.toLowerCase();

    if (lower.includes('emergency') || lower.includes('chest pain') || lower.includes('can\'t breathe')) {
      return '🚨 This sounds like a medical emergency. Please call emergency services (112/911) immediately or go to the nearest hospital.';
    }

    if (lower.includes('medication') || lower.includes('medicine') || lower.includes('dose')) {
      return `💊 I can see you have ${medicationContext ? 'some medications recorded' : 'medications in your profile'}. For medication questions, always consult your doctor or pharmacist. Remember to take your medications on time and never skip doses without medical advice.`;
    }

    if (lower.includes('remind') || lower.includes('reminder')) {
      return '⏰ Great question about reminders! Make sure your medications are set up with correct timings in the Medications tab. The app will track your adherence there.';
    }

    if (lower.includes('side effect')) {
      return '⚠️ If you are experiencing side effects, contact your doctor or pharmacist immediately. Do not stop taking medications without medical advice.';
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! I'm your MediPulse AI Care Companion. I can help with medication adherence tips, health routine advice, and app guidance. What would you like to know?";
    }

    return `Thank you for your question. As your care companion, I encourage you to consult your healthcare provider for personalized medical advice. In the meantime, I can help you navigate the app — use the Medications tab to manage your medicines and the Adherence tab to track your progress.\n\n💡 To enable full AI responses, add your OpenAI API key (EXPO_PUBLIC_OPENAI_API_KEY) to the .env file.`;
  }

  injectMedicationContext(medicines: Medicine[]): string {
    if (medicines.length === 0) return '';
    const list = medicines
      .map((m) => `${m.name} (${m.dosage}, ${m.frequency.replace(/_/g, ' ')})`)
      .join('; ');
    return `User's active medications: ${list}.`;
  }

  async analyzeMedicationAdherence(medicines: Medicine[], _logs: any[]): Promise<string> {
    if (medicines.length === 0) return 'No active medications to analyze.';
    return `You have ${medicines.length} active medication(s). Keep up with your schedule for the best health outcomes!`;
  }

  async generateHealthTip(_userProfile: any): Promise<string> {
    const tips = [
      'Stay hydrated — drink at least 8 glasses of water daily.',
      'Take your medications at the same time each day for best results.',
      'Set up reminders in the app to never miss a dose.',
      'Keep your medication stock updated to avoid running out.',
      'Share your medication list with your doctor at every visit.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const aiService = new AIService();
