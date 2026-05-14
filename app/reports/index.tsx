import { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Card, FAB, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Input } from '../../components';
import { useAuthStore } from '../../store';
import { documentService } from '../../services/documentService';
import { MedDocument, DocumentType } from '../../types';
import { colors } from '../../constants/theme';

const DOC_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'prescription', label: 'Prescriptions', icon: '📋' },
  { value: 'lab_report', label: 'Lab Reports', icon: '🧪' },
  { value: 'scan', label: 'Scans', icon: '🫁' },
  { value: 'vaccination', label: 'Vaccination', icon: '💉' },
  { value: 'other', label: 'Other', icon: '📄' },
];

function DocumentCard({
  doc,
  onDelete,
}: {
  doc: MedDocument;
  onDelete: () => void;
}) {
  const typeInfo = DOC_TYPES.find((t) => t.value === doc.type) ?? DOC_TYPES[4];
  return (
    <Card style={styles.docCard}>
      <Card.Content style={styles.docContent}>
        {doc.fileUri && doc.fileUri.match(/\.(jpg|jpeg|png|heic)/i) ? (
          <Image source={{ uri: doc.fileUri }} style={styles.docThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.docThumb, styles.docThumbPlaceholder]}>
            <Text style={styles.docThumbIcon}>{typeInfo.icon}</Text>
          </View>
        )}
        <View style={styles.docInfo}>
          <Text style={styles.docTitle} numberOfLines={2}>{doc.title}</Text>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>{typeInfo.label}</Text>
          </View>
          <Text style={styles.docDate}>{new Date(doc.createdAt).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.docDelete}>
          <Text style={styles.docDeleteIcon}>🗑</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuthStore();

  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<DocumentType | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>('prescription');
  const [addingDoc, setAddingDoc] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!userId) return;
    try {
      const docs = await documentService.getDocuments(userId);
      setDocuments(docs);
    } catch { /* silent */ }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async () => {
    if (!docTitle.trim()) {
      Toast.show({ type: 'info', text1: 'Enter a title for the document' });
      return;
    }
    if (!userId) return;
    setAddingDoc(true);
    try {
      const uri = await documentService.pickImage();
      if (!uri) { setAddingDoc(false); return; }

      const now = new Date().toISOString();
      const fileName = uri.split('/').pop() ?? 'document';
      const doc = await documentService.saveDocument({
        id: `doc-${userId}-${Date.now()}`,
        userId,
        title: docTitle.trim(),
        type: docType,
        fileUri: uri,
        fileName,
        createdAt: now,
      });
      setDocuments((prev) => [doc, ...prev]);
      setDocTitle('');
      setShowAddForm(false);
      Toast.show({ type: 'success', text1: 'Document saved!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to save document' });
    } finally {
      setAddingDoc(false);
    }
  };

  const handleDelete = (doc: MedDocument) => {
    Alert.alert('Delete Document', `Delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await documentService.deleteDocument(doc);
          setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
          Toast.show({ type: 'success', text1: 'Document deleted' });
        },
      },
    ]);
  };

  const filtered =
    activeType === 'all' ? documents : documents.filter((d) => d.type === activeType);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={[{ value: 'all' as const, label: 'All', icon: '📁' }, ...DOC_TYPES]}
        keyExtractor={(i) => i.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeType === item.value && styles.filterChipActive]}
            onPress={() => setActiveType(item.value as any)}
          >
            <Text style={styles.filterIcon}>{item.icon}</Text>
            <Text style={[styles.filterText, activeType === item.value && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      />

      {/* Add form */}
      {showAddForm && (
        <Card style={styles.addForm}>
          <Card.Content>
            <Text style={styles.addFormTitle}>Add Document</Text>
            <Input
              label="Document Title"
              value={docTitle}
              onChangeText={setDocTitle}
              style={styles.addInput}
            />
            <View style={styles.typeChips}>
              {DOC_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, docType === t.value && styles.typeChipActive]}
                  onPress={() => setDocType(t.value)}
                >
                  <Text style={[styles.typeChipText, docType === t.value && styles.typeChipTextActive]}>
                    {t.icon} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addBtns}>
              <Button onPress={handleUpload} loading={addingDoc} style={styles.uploadBtn}>
                📷 Pick Image
              </Button>
              <Button mode="outlined" onPress={() => setShowAddForm(false)} style={styles.cancelUploadBtn}>
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Document list */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          numColumns={2}
          renderItem={({ item }) => (
            <DocumentCard doc={item} onDelete={() => handleDelete(item)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySub}>Upload prescriptions, lab reports & more</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => setShowAddForm(true)}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  filterRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterIcon: { fontSize: 14 },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  addForm: { margin: 16, borderRadius: 14, elevation: 2 },
  addFormTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  addInput: { marginBottom: 12 },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  typeChipText: { fontSize: 12, color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary, fontWeight: '600' },
  addBtns: { flexDirection: 'row', gap: 10 },
  uploadBtn: { flex: 1 },
  cancelUploadBtn: { flex: 1, borderColor: colors.border },
  loader: { marginTop: 60 },
  list: { padding: 8, paddingBottom: 80 },
  docCard: { flex: 1, margin: 6, borderRadius: 12, elevation: 2 },
  docContent: { padding: 8 },
  docThumb: { width: '100%', height: 100, borderRadius: 8, marginBottom: 8 },
  docThumbPlaceholder: { backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  docThumbIcon: { fontSize: 36 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  docBadge: { backgroundColor: colors.primary + '18', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  docBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  docDate: { fontSize: 11, color: colors.textSecondary },
  docDelete: { position: 'absolute', top: 0, right: 0, padding: 4 },
  docDeleteIcon: { fontSize: 18 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  fab: { position: 'absolute', right: 20, backgroundColor: colors.primary },
});
