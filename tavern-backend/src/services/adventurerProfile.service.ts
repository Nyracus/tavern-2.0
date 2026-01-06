// src/services/adventurerProfile.service.ts
import { AppError } from '../middleware/error.middleware';
import { UserModel } from '../models/user.model';
import {
  AdventurerProfileModel,
  IAdventurerProfile,
} from '../models/adventurerProfile.model';
import {
  AddSkillInput,
  CreateAdventurerProfileInput,
  UpdateAdventurerProfileInput,
  UpdateSkillInput,
} from '../schemas/adventurerProfile.schema';

class AdventurerProfileService {
  async getMyProfile(userId: string): Promise<IAdventurerProfile | null> {
    return AdventurerProfileModel.findOne({ userId }).exec();
  }

  async createProfileForUser(
    userId: string,
    data: CreateAdventurerProfileInput
  ): Promise<IAdventurerProfile> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new AppError(404, 'User not found for this profile');
    }
    if (user.role !== 'ADVENTURER') {
      throw new AppError(
        403,
        'Only users with role ADVENTURER can have adventurer profiles'
      );
    }

    const existing = await AdventurerProfileModel.findOne({ userId }).exec();
    if (existing) {
      throw new AppError(409, 'Profile already exists for this user');
    }

    const profile = await AdventurerProfileModel.create({
      userId,
      ...data,
    });

    return profile;
  }

  async updateProfileForUser(
    userId: string,
    data: UpdateAdventurerProfileInput
  ): Promise<IAdventurerProfile> {
    const profile = await AdventurerProfileModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true }
    ).exec();

    if (!profile) {
      throw new AppError(404, 'Adventurer profile not found');
    }

    return profile;
  }

  async addSkill(userId: string, skill: AddSkillInput): Promise<IAdventurerProfile> {
    const profile = await AdventurerProfileModel.findOne({ userId }).exec();
    if (!profile) {
      throw new AppError(404, 'Adventurer profile not found');
    }

    profile.skills.push(skill as any);
    await profile.save();
    return profile;
  }

async updateSkill(
  userId: string,
  skillId: string,
  data: UpdateSkillInput
): Promise<IAdventurerProfile> {
  const profile = await AdventurerProfileModel.findOne({ userId }).exec();
  if (!profile) {
    throw new AppError(404, 'Adventurer profile not found');
  }

  const skill: any = profile.skills.find(
    (s: any) => s._id?.toString() === skillId
  );

  if (!skill) {
    throw new AppError(404, 'Skill not found');
  }

  if (data.name !== undefined) skill.name = data.name;
  if (data.description !== undefined) skill.description = data.description;
  if (data.level !== undefined) skill.level = data.level;
  if (data.category !== undefined) skill.category = data.category;
  if (data.cooldown !== undefined) skill.cooldown = data.cooldown;

  await profile.save();
  return profile;
}


async deleteSkill(
  userId: string,
  skillId: string
): Promise<IAdventurerProfile> {
  const profile = await AdventurerProfileModel.findOne({ userId }).exec();
  if (!profile) {
    throw new AppError(404, 'Adventurer profile not found');
  }

  const skillIndex = profile.skills.findIndex(
    (s: any) => s._id?.toString() === skillId
  );

  if (skillIndex === -1) {
    throw new AppError(404, 'Skill not found');
  }

  profile.skills.splice(skillIndex, 1);

  await profile.save();
  return profile;
}

}

export const adventurerProfileService = new AdventurerProfileService();

