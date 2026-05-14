import { FamilyMember } from '../types';
import { familyRepository } from '../database/familyRepository';

class FamilyService {
  async addFamilyMember(member: FamilyMember): Promise<FamilyMember> {
    await familyRepository.insert(member);
    return member;
  }

  async updateFamilyMember(member: FamilyMember): Promise<FamilyMember> {
    await familyRepository.update(member);
    return member;
  }

  async deleteFamilyMember(id: string): Promise<void> {
    await familyRepository.delete(id);
  }

  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    const members = await familyRepository.getByUserId(userId);
    if (members.length === 0) {
      return [
        {
          id: 'fam-1',
          name: 'Om',
          relationship: 'Sibling',
          phoneNumber: '+91 9876543210',
          email: 'om@family.ai',
          bloodGroup: 'O+',
          isCaregiver: false,
          emergencyPriority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        {
          id: 'fam-2',
          name: 'Aarti',
          relationship: 'Spouse',
          phoneNumber: '+91 9876543211',
          email: 'aarti@family.ai',
          bloodGroup: 'B+',
          isCaregiver: true,
          emergencyPriority: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any
      ];
    }
    return members;
  }

  async getFamilyMemberById(id: string): Promise<FamilyMember | null> {
    return familyRepository.getById(id);
  }
}

export const familyService = new FamilyService();
