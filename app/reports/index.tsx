import { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Image,
  Alert,
  StatusBar,
  Platform,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Portal, Modal, TextInput as PaperInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input, Header, Card } from '../../components';
import { useAuthStore } from '../../store';
import { documentService } from '../../services/documentService';
import { MedDocument, DocumentType } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { colors, shadows, radius, typography, spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DOC_TYPES: { value: DocumentType; label: string; icon: MCIName; color: string }[] = [
  { value: 'prescription', label: 'Prescriptions', icon: 'file-document-outline', color: '#007AFF' },
  { value: 'lab_report',   label: 'Lab Reports',   icon: 'test-tube',             color: '#5856D6' },
  { value: 'scan',         label: 'Scans',          icon: 'image-outline',         color: '#0891B2' },
  { value: 'vaccination',  label: 'Vaccination',    icon: 'needle',                color: '#34C759' },
  { value: 'other',        label: 'Other',          icon: 'paperclip',             color: '#8E8E93' },
];

const ALL_FILTERS = [{ value: 'all' as const, label: 'All', icon: 'folder-outline' as MCIName, color: '#FF9500' }, ...DOC_TYPES];

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, isDark } = useAppTheme();
  const { userId } = useAuthStore();

  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('prescription');
  const [addingDoc, setAddingDoc] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await documentService.getDocuments(userId);
      setDocuments(data);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleSave = async (mode: 'camera' | 'library') => {
    if (!docTitle.trim()) {
      Toast.show({ type: 'info', text1: 'Please enter a title' });
      return;
    }
    if (!userId) return;

    setAddingDoc(true);
    try {
      const uri = mode === 'camera' 
        ? await documentService.captureImage() 
        : await documentService.pickImage();
        
      if (!uri) {
        setAddingDoc(false);
        return;
      }

      const doc = await documentService.saveDocument({
        id: `doc-${userId}-${Date.now()}`,
        userId,
        title: docTitle.trim(),
        type: docType,
        fileUri: uri,
        fileName: uri.split('/').pop() ?? 'doc',
        createdAt: new Date().toISOString(),
      });

      setDocuments((prev) => [doc, ...prev]);
      setDocTitle('');
      setShowAddModal(false);
      Toast.show({ type: 'success', text1: 'Report added successfully!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to save document' });
    } finally {
      setAddingDoc(false);
    }
  };

  const handleDelete = (doc: MedDocument) => {
    Alert.alert('Delete Report', `Are you sure you want to delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentService.deleteDocument(doc);
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            Toast.show({ type: 'success', text1: 'Report deleted' });
          } catch {
            Toast.show({ type: 'error', text1: 'Failed to delete' });
          }
        },
      },
    ]);
  };

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesType = activeType === 'all' || d.type === activeType;
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [documents, activeType, searchQuery]);

  const renderDocCard = ({ item: doc }: { item: MedDocument }) => {
    const typeInfo = DOC_TYPES.find((t) => t.value === doc.type) ?? DOC_TYPES[4];
    const isImage = doc.fileUri && doc.fileUri.match(/\.(jpg|jpeg|png|heic)/i);

    return (
      <Card style={styles.docCard} variant="elevated">
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.cardPressable}
          onPress={() => {/* View Document Detail - could be a modal or new screen */}}
        >
          {isImage ? (
            <Image source={{ uri: doc.fileUri }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardPlaceholder, { backgroundColor: typeInfo.color + '10' }]}>
              <MaterialCommunityIcons name={typeInfo.icon} size={48} color={typeInfo.color} />
            </View>
          )}
          
          <View
            style={[styles.cardOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{doc.title}</Text>
              <View style={styles.cardFooter}>
                <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
                  <Text style={styles.typeBadgeText}>{typeInfo.label.slice(0, -1)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(doc)} hitSlop={12}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Header 
        title="Health Reports" 
        subtitle="Manage your medical records"
        showBack
        rightAction={{
          icon: 'plus',
          onPress: () => setShowAddModal(true)
        }}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: c.surface, ...shadows.sm }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={c.textTertiary} />
          <PaperInput
            placeholder="Search reports..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            style={[styles.searchInput, { backgroundColor: c.surface, color: c.text }]}
            placeholderTextColor={c.textTertiary}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={c.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {ALL_FILTERS.map((f) => {
            const isActive = activeType === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setActiveType(f.value as any)}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? f.color : c.surface },
                  !isActive && shadows.sm
                ]}
              >
                <MaterialCommunityIcons 
                  name={f.icon as MCIName} 
                  size={16} 
                  color={isActive ? '#fff' : f.color} 
                />
                <Text style={[
                  styles.filterLabel, 
                  { color: isActive ? '#fff' : c.textSecondary }
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={styles.loadingText}>Fetching your records...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: c.primary + '15' }]}>
            <MaterialCommunityIcons name="folder-open-outline" size={48} color={c.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>
            {searchQuery ? 'No matching reports' : 'Your medical vault is empty'}
          </Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            {searchQuery 
              ? 'Try adjusting your search or filters' 
              : 'Securely store prescriptions, lab reports, and vaccination certificates here.'}
          </Text>
          {!searchQuery && (
            <Button 
              onPress={() => setShowAddModal(true)}
              style={styles.emptyBtn}
            >
              Add Your First Report
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={renderDocCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Add Document Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => !addingDoc && setShowAddModal(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: c.background }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Add New Report</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={addingDoc}>
                <MaterialCommunityIcons name="close" size={24} color={c.textTertiary} />
              </TouchableOpacity>
            </View>

            <Input 
              label="Document Title" 
              placeholder="e.g. Blood Test - May 2024"
              value={docTitle} 
              onChangeText={setDocTitle} 
              style={styles.modalInput}
            />

            <Text style={[styles.typeLabel, { color: c.textSecondary }]}>Category</Text>
            <View style={styles.typeGrid}>
              {DOC_TYPES.map((t) => {
                const isActive = docType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setDocType(t.value)}
                    style={[
                      styles.typeItem,
                      { 
                        backgroundColor: isActive ? t.color : c.surface,
                        borderColor: isActive ? t.color : c.borderLight
                      }
                    ]}
                  >
                    <MaterialCommunityIcons 
                      name={t.icon} 
                      size={20} 
                      color={isActive ? '#fff' : t.color} 
                    />
                    <Text style={[
                      styles.typeItemText, 
                      { color: isActive ? '#fff' : c.textSecondary }
                    ]}>
                      {t.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: c.primary }]}
                onPress={() => handleSave('camera')}
                disabled={addingDoc}
              >
                <MaterialCommunityIcons name="camera" size={22} color="#fff" />
                <Text style={styles.actionBtnText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: c.secondary }]}
                onPress={() => handleSave('library')}
                disabled={addingDoc}
              >
                <MaterialCommunityIcons name="image-multiple" size={22} color="#fff" />
                <Text style={styles.actionBtnText}>Choose File</Text>
              </TouchableOpacity>
            </View>

            {addingDoc && (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={c.primary} size="small" />
                <Text style={[styles.modalLoadingText, { color: c.textSecondary }]}>Processing...</Text>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* FAB (only show if not empty and modal not visible) */}
      {!showAddModal && filtered.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.fab, { backgroundColor: c.primary, ...shadows.lg }]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    marginLeft: 8,
  },
  filterWrapper: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  docCard: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.3,
    padding: 0,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyBtn: {
    paddingHorizontal: 24,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalInput: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  typeItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 8,
    ...shadows.md,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  modalLoadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

