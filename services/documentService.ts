import * as ImagePicker from 'expo-image-picker';
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import { MedDocument, DocumentType } from '../types';
import { sqliteService } from '../database/sqliteService';

class DocumentService {
  async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  async pickImage(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  async captureImage(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return null;
    return result.assets[0].uri;
  }

  async saveDocument(doc: MedDocument): Promise<MedDocument> {
    const docsDir = `${documentDirectory}medipulse_docs/`;
    const dirInfo = await getInfoAsync(docsDir);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(docsDir, { intermediates: true });
    }

    const ext = doc.fileName.split('.').pop() ?? 'jpg';
    const destPath = `${docsDir}${doc.id}.${ext}`;

    if (doc.fileUri !== destPath) {
      await copyAsync({ from: doc.fileUri, to: destPath });
    }

    const saved: MedDocument = { ...doc, fileUri: destPath };

    await sqliteService.insert('documents', {
      id: saved.id,
      user_id: saved.userId,
      title: saved.title,
      type: saved.type,
      file_uri: saved.fileUri,
      file_name: saved.fileName,
      file_size: saved.fileSize ?? null,
      thumbnail_uri: saved.thumbnailUri ?? null,
      notes: saved.notes ?? null,
      tags: saved.tags ? JSON.stringify(saved.tags) : null,
      created_at: saved.createdAt,
      synced_at: saved.syncedAt ?? null,
    });

    return saved;
  }

  async getDocuments(userId: string): Promise<MedDocument[]> {
    const rows = await sqliteService.queryRaw(
      `SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      type: r.type as DocumentType,
      fileUri: r.file_uri,
      fileName: r.file_name,
      fileSize: r.file_size ?? undefined,
      thumbnailUri: r.thumbnail_uri ?? undefined,
      notes: r.notes ?? undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      createdAt: r.created_at,
      syncedAt: r.synced_at ?? undefined,
    }));
  }

  async getDocumentsByType(userId: string, type: DocumentType): Promise<MedDocument[]> {
    const rows = await sqliteService.queryRaw(
      `SELECT * FROM documents WHERE user_id = ? AND type = ? ORDER BY created_at DESC`,
      [userId, type]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      type: r.type as DocumentType,
      fileUri: r.file_uri,
      fileName: r.file_name,
      fileSize: r.file_size ?? undefined,
      thumbnailUri: r.thumbnail_uri ?? undefined,
      notes: r.notes ?? undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      createdAt: r.created_at,
      syncedAt: r.synced_at ?? undefined,
    }));
  }

  async deleteDocument(doc: MedDocument): Promise<void> {
    try {
      const info = await getInfoAsync(doc.fileUri);
      if (info.exists) {
        await deleteAsync(doc.fileUri, { idempotent: true });
      }
    } catch { /* ignore file delete errors */ }
    await sqliteService.delete('documents', 'id = ?', [doc.id]);
  }
}

export const documentService = new DocumentService();
