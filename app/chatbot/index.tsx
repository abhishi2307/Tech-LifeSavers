import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useMedicationStore } from '../../store';
import { aiService } from '../../services/aiService';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Header } from '../../components';

/**
 * Custom simplified Chatbot screen to avoid TurboModule conflicts with GiftedChat
 * and provide a refined, premium medical assistant experience.
 */
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatbotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, userProfile } = useAuthStore();
  const { medicines } = useMedicationStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shareContext, setShareContext] = useState(true);

  useEffect(() => {
    const firstName = userProfile?.firstName || 'Aanchal';
    setMessages([
      {
        id: '1',
        text: `Hi ${firstName}! I'm your MediPulse AI Care Companion 🤖\n\nI can help with medication adherence, health routines, and wellness questions. How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    return () => { aiService.clearHistory(); };
  }, [userProfile]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const context = shareContext
        ? aiService.injectMedicationContext(medicines.filter((m) => m.isActive))
        : undefined;

      const reply = await aiService.sendMessage(userMessage.text, context);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === 'bot';
    return (
      <View style={[styles.messageWrapper, isBot ? styles.botWrapper : styles.userWrapper]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Care Companion" 
        subtitle="AI Health Assistant" 
        showBack 
        centered
      />

      <View style={styles.disclaimer}>
        <MaterialCommunityIcons name="information-outline" size={14} color={colors.info} />
        <Text style={styles.disclaimerText}>
          Not a substitute for professional medical advice.
        </Text>
      </View>

      <View style={styles.contextCard}>
        <View style={styles.contextInfo}>
          <Text style={styles.contextTitle}>Medical Context</Text>
          <Text style={styles.contextSub}>Allow AI to see your active medications</Text>
        </View>
        <Switch
          value={shareContext}
          onValueChange={setShareContext}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={shareContext ? colors.primary : '#ccc'}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>MediPulse AI is thinking...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your medications..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={22} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info + '10',
    paddingVertical: 8,
    gap: 6,
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  contextInfo: {
    flex: 1,
  },
  contextTitle: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text,
  },
  contextSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  botBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...typography.bodySm,
    lineHeight: 20,
  },
  botText: {
    color: colors.text,
  },
  userText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  typingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    ...typography.bodySm,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});
