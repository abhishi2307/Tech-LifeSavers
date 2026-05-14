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
    return familyRepository.getByUserId(userId);
  }

  async getFamilyMemberById(id: string): Promise<FamilyMember | null> {
    return familyRepository.getById(id);
  }
}

export const familyService = new FamilyService();
