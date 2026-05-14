import { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore, useFamilyStore } from '../../store';
import { familyService } from '../../services/familyService';
import { FamilyMember } from '../../types';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { Card } from '../../components';

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  spouse: { bg: '#FCE7F3', text: '#9D174D' },
  child: { bg: '#DCFCE7', text: '#14532D' },
  parent: { bg: '#DBEAFE', text: '#1E3A8A' },
  sibling: { bg: '#FEF3C7', text: '#78350F' },
  grandparent: { bg: '#EDE9FE', text: '#4C1D95' },
  default: { bg: colors.surfaceVariant, text: colors.primary },
};

function avatarColor(name: string): string {
  const palette = [colors.primary, '#7C3AED', '#0891B2', '#10B981', '#C2410C', '#B45309'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function FamilyCard({ member, onEdit, onDelete }: { member: FamilyMember; onEdit: () => void; onDelete: () => void }) {
  const relColor = RELATIONSHIP_COLORS[member.relationship] ?? RELATIONSHIP_COLORS.default;
  const bgColor = avatarColor(member.name);

  return (
    <Card style={styles.card} variant="elevated">
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.avatar, { backgroundColor: bgColor + '15' }]}>
            <Text style={[styles.avatarText, { color: bgColor }]}>{initials(member.name)}</Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: relColor.bg }]}>
                <Text style={[styles.badgeText, { color: relColor.text }]}>{member.relationship}</Text>
              </View>
              {member.isCaregiver && (
                <View style={[styles.badge, { backgroundColor: colors.success + '10' }]}>
                  <MaterialCommunityIcons name="shield-check" size={12} color={colors.success} />
                  <Text style={[styles.badgeText, { color: colors.success }]}>Caregiver</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardMenu}>
             <TouchableOpacity style={styles.menuBtn} onPress={onEdit}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={onDelete}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardFoot}>
          {member.phoneNumber ? (
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${member.phoneNumber}`)}
            >
              <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
              <Text style={styles.contactText}>{member.phoneNumber}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.flex} />
          )}
          {member.bloodGroup && (
            <View style={styles.bloodBadge}>
              <MaterialCommunityIcons name="water" size={14} color={colors.error} />
              <Text style={styles.bloodText}>{member.bloodGroup}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();
  const { members, setMembers, isLoading, setIsLoading, removeMember } = useFamilyStore();

  const loadMembers = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await familyService.getFamilyMembers(userId);
      setMembers(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load family members' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, setMembers, setIsLoading]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleDelete = (member: FamilyMember) => {
    Alert.alert('Remove Member', `Remove ${member.name} from your family list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await familyService.deleteFamilyMember(member.id);
            removeMember(member.id);
            Toast.show({ type: 'success', text1: `${member.name} removed` });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not remove member' });
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Family Care</Text>
          <Text style={styles.subtitle}>Manage your medical circle</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/family/add')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : members.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIllustration}>
            <MaterialCommunityIcons name="account-group" size={64} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No family members yet</Text>
          <Text style={styles.emptySub}>Add family members to coordinate care and share health updates</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/family/add')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FamilyCard
              member={item}
              onEdit={() => router.push(`/family/${item.id}` as any)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: { ...typography.h1 },
  subtitle: { ...typography.bodySm, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  card: { marginBottom: 16, padding: 0 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontWeight: '800', fontSize: 18 },
  memberInfo: { flex: 1 },
  memberName: { ...typography.h4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { ...typography.caption, fontWeight: '700' },
  cardMenu: { flexDirection: 'row', gap: 4 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary + '08',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  contactText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  bloodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error + '08',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  bloodText: { ...typography.caption, color: colors.error, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { ...typography.h2, marginBottom: 8 },
  emptySub: { ...typography.body, textAlign: 'center', marginBottom: 32, color: colors.textSecondary },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    ...shadows.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  flex: { flex: 1 },
});
