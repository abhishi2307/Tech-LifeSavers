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
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useMedicationStore } from '../../store';
import { aiService } from '../../services/aiService';
import { useAppTheme } from '../../hooks/useAppTheme';
import { typography, spacing, radius, shadows } from '../../constants/theme';
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
  const { colors: c, isDark } = useAppTheme();
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
          <View style={[styles.botAvatar, { backgroundColor: c.primary + '15' }]}>
            <MaterialCommunityIcons name="robot" size={20} color={c.primary} />
          </View>
        )}
        <View style={[
          styles.bubble, 
          isBot ? [styles.botBubble, { backgroundColor: c.surface, borderColor: c.separator }] : [styles.userBubble, { backgroundColor: c.primary }]
        ]}>
          <Text style={[styles.messageText, isBot ? { color: c.text } : { color: '#fff' }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Header 
        title="Care Companion" 
        subtitle="AI Health Assistant" 
        showBack 
        centered
      />

      <View style={[styles.disclaimer, { backgroundColor: c.info + '10' }]}>
        <MaterialCommunityIcons name="information-outline" size={14} color={c.info} />
        <Text style={[styles.disclaimerText, { color: c.info }]}>
          Not a substitute for professional medical advice.
        </Text>
      </View>

      <View style={[styles.contextCard, { backgroundColor: c.surface, borderBottomColor: c.separator }]}>
        <View style={styles.contextInfo}>
          <Text style={[styles.contextTitle, { color: c.text }]}>Medical Context</Text>
          <Text style={[styles.contextSub, { color: c.textSecondary }]}>Allow AI to see your active medications</Text>
        </View>
        <Switch
          value={shareContext}
          onValueChange={setShareContext}
          trackColor={{ false: c.border, true: c.primary + '80' }}
          thumbColor={shareContext ? c.primary : '#ccc'}
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
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.typingText, { color: c.textSecondary }]}>MediPulse AI is thinking...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: c.surface, 
            borderTopColor: c.separator,
            paddingBottom: Math.max(insets.bottom, 16) 
          }
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { backgroundColor: c.background, color: c.text }]}
              placeholder="Ask about your medications..."
              placeholderTextColor={c.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { backgroundColor: c.primary },
                !inputText.trim() && { backgroundColor: c.disabled }
              ]} 
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
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  disclaimerText: {
    ...typography.caption,
    fontWeight: '600',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  contextInfo: {
    flex: 1,
  },
  contextTitle: {
    ...typography.bodySm,
    fontWeight: '700',
  },
  contextSub: {
    ...typography.caption,
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
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...typography.bodySm,
    lineHeight: 20,
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
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    ...typography.bodySm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});

