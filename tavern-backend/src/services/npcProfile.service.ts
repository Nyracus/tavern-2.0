// src/services/npcProfile.service.ts
import { z } from "zod";
import { AppError } from "../middleware/error.middleware";
import { NPCProfileModel, INPCProfile } from "../models/npcProfile.model";
import { createNPCProfileSchema, updateNPCProfileSchema } from "../schemas/npcProfile.schema";
import { UserModel } from "../models/user.model";

export type CreateNPCProfileInput = z.infer<typeof createNPCProfileSchema>;
export type UpdateNPCProfileInput = z.infer<typeof updateNPCProfileSchema>;

class NPCProfileService {
  async getMyProfile(userId: string): Promise<INPCProfile | null> {
    return await NPCProfileModel.findOne({ userId }).exec();
  }

  async createProfileForUser(
    userId: string,
    data: CreateNPCProfileInput
  ): Promise<INPCProfile> {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      throw new AppError(404, "User not found for this profile");
    }
    if (user.role !== "NPC") {
      throw new AppError(
        403,
        "Only users with role NPC can have NPC profiles"
      );
    }

    const existing = await NPCProfileModel.findOne({ userId }).exec();
    if (existing) {
      throw new AppError(409, "NPC profile already exists for this user");
    }

    return await NPCProfileModel.create({
      userId,
      ...data,
    });
  }

  async updateProfileForUser(
    userId: string,
    data: UpdateNPCProfileInput
  ): Promise<INPCProfile> {
    const profile = await NPCProfileModel.findOneAndUpdate(
      { userId },
      { ...data },
      { new: true }
    ).exec();

    if (!profile) {
      throw new AppError(404, "NPC profile not found");
    }

    return profile;
  }
}

export const npcProfileService = new NPCProfileService();

