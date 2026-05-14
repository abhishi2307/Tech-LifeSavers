import { FamilyMember } from '../types';
import { sqliteService } from './sqliteService';

class FamilyRepository {
  private mapRow(row: any): FamilyMember {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      relationship: row.relationship,
      dateOfBirth: row.date_of_birth ?? undefined,
      phoneNumber: row.phone_number ?? undefined,
      avatar: row.avatar ?? undefined,
      isCaregiver: row.is_caregiver === 1,
      allergies: row.allergies ? JSON.parse(row.allergies) : undefined,
      bloodGroup: row.blood_group ?? undefined,
      emergencyPriority: row.emergency_priority ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at ?? undefined,
      localOnly: row.local_only === 1,
    };
  }

  async insert(member: FamilyMember): Promise<void> {
    await sqliteService.insert('family_members', {
      id: member.id,
      user_id: member.userId,
      name: member.name,
      relationship: member.relationship,
      date_of_birth: member.dateOfBirth ?? null,
      phone_number: member.phoneNumber ?? null,
      avatar: member.avatar ?? null,
      is_caregiver: member.isCaregiver ? 1 : 0,
      allergies: member.allergies ? JSON.stringify(member.allergies) : null,
      blood_group: member.bloodGroup ?? null,
      emergency_priority: member.emergencyPriority ?? 0,
      created_at: member.createdAt,
      updated_at: member.updatedAt,
      synced_at: member.syncedAt ?? null,
      local_only: member.localOnly ? 1 : 0,
    });
  }

  async update(member: FamilyMember): Promise<void> {
    await sqliteService.update(
      'family_members',
      {
        name: member.name,
        relationship: member.relationship,
        date_of_birth: member.dateOfBirth ?? null,
        phone_number: member.phoneNumber ?? null,
        avatar: member.avatar ?? null,
        is_caregiver: member.isCaregiver ? 1 : 0,
        allergies: member.allergies ? JSON.stringify(member.allergies) : null,
        blood_group: member.bloodGroup ?? null,
        emergency_priority: member.emergencyPriority ?? 0,
        updated_at: member.updatedAt,
        synced_at: member.syncedAt ?? null,
        local_only: member.localOnly ? 1 : 0,
      },
      'id = ?',
      [member.id]
    );
  }

  async delete(id: string): Promise<void> {
    await sqliteService.delete('family_members', 'id = ?', [id]);
  }

  async getById(id: string): Promise<FamilyMember | null> {
    const rows = await sqliteService.query('family_members', 'id = ?', [id]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async getByUserId(userId: string): Promise<FamilyMember[]> {
    const rows = await sqliteService.query(
      'family_members',
      'user_id = ? ORDER BY emergency_priority DESC, name ASC',
      [userId]
    );
    return rows.map(this.mapRow);
  }
}

export const familyRepository = new FamilyRepository();
