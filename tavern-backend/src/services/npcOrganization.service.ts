// src/services/npcOrganization.service.ts
import { Types } from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import { UserModel } from '../models/user.model';
import {
  INpcOrganization,
  NpcOrganizationModel,
  TrustTier,
} from '../models/npcOrganization.model';
import { Quest } from '../models/quest.model';

function computeTrustTier(score: number): TrustTier {
  if (score >= 75) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

class NpcOrganizationService {
  async getMyOrganization(userId: string): Promise<INpcOrganization | null> {
    return NpcOrganizationModel.findOne({ userId }).exec();
  }

  async createForNpc(
    userId: string,
    data: {
      name: string;
      description?: string;
      domain?: string;
      website?: string;
    }
  ): Promise<INpcOrganization> {
    const user = await UserModel.findById(userId).exec();
    if (!user) throw new AppError(404, 'User not found');
    if (user.role !== 'NPC') {
      throw new AppError(403, 'Only NPC users can create organization profiles');
    }

    const existing = await NpcOrganizationModel.findOne({ userId }).exec();
    if (existing) {
      throw new AppError(409, 'Organization profile already exists for this NPC');
    }

    const trustScore = 50;
    const trustTier = computeTrustTier(trustScore);

    const org = await NpcOrganizationModel.create({
      userId,
      ...data,
      trustScore,
      trustTier,
    });

    return org;
  }

  async updateForNpc(
    userId: string,
    data: Partial<{
      name: string;
      description?: string;
      domain?: string;
      website?: string;
    }>
  ): Promise<INpcOrganization> {
    const org = await NpcOrganizationModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true }
    ).exec();

    if (!org) {
      throw new AppError(404, 'Organization profile not found');
    }

    return org;
  }

  async listAll(filters: {
    domain?: string;
    minTrust?: number;
    maxTrust?: number;
  }): Promise<INpcOrganization[]> {
    const query: any = {};
    if (filters.domain) query.domain = filters.domain;
    if (filters.minTrust !== undefined || filters.maxTrust !== undefined) {
      query.trustScore = {};
      if (filters.minTrust !== undefined) query.trustScore.$gte = filters.minTrust;
      if (filters.maxTrust !== undefined) query.trustScore.$lte = filters.maxTrust;
    }

    return NpcOrganizationModel.find(query).exec();
  }

  async getById(id: string): Promise<INpcOrganization> {
    const org = await NpcOrganizationModel.findById(id).exec();
    if (!org) throw new AppError(404, 'Organization profile not found');
    return org;
  }

  async updateById(
    id: string,
    data: Partial<INpcOrganization>
  ): Promise<INpcOrganization> {
    const updatedData: any = { ...data };

    if (data.trustScore !== undefined && data.trustTier === undefined) {
      updatedData.trustTier = computeTrustTier(data.trustScore);
    }

    const org = await NpcOrganizationModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    ).exec();

    if (!org) throw new AppError(404, 'Organization profile not found');
    return org;
  }

  async getTrustOverview(orgId: string): Promise<{
    trustScore: number;
    trustTier: TrustTier;
    verified: boolean;
    isFlagged: boolean;
    totalQuestsPosted: number;
    totalGoldSpent: number;
    completionRate: number; // 0..100
    disputeRate: number; // 0..100
    summary: string;
  }> {
    const org = await NpcOrganizationModel.findById(orgId).exec();
    if (!org) throw new AppError(404, 'Organization profile not found');

    // Pull quest stats for this NPC
    const npcObjectId = new Types.ObjectId(org.userId);
    const quests = await Quest.find({ npcId: npcObjectId })
      .select('status rewardGold')
      .lean()
      .exec();

    const total = quests.length;
    const completed = quests.filter((q: any) => q.status === 'Completed').length;
    const cancelled = quests.filter((q: any) => q.status === 'Cancelled').length;

    // Gold spent: sum rewards for completed quests
    const totalGoldSpent = quests
      .filter((q: any) => q.status === 'Completed')
      .reduce((sum: number, q: any) => sum + (Number(q.rewardGold) || 0), 0);

    // completionRate: among finished quests only (Completed + Cancelled)
    const finished = completed + cancelled;
    const completionRate = finished === 0 ? 0 : round2((completed / finished) * 100);

    // disputes not implemented yet
    const disputeRate = 0;

    // basic trust score formula
    const trustScore = clamp(
      Math.round(50 + completionRate * 0.4 - cancelled * 2),
      0,
      100
    );
    const trustTier = computeTrustTier(trustScore);

    let summary =
      trustTier === 'HIGH'
        ? 'Highly trusted NPC organization with strong completion history.'
        : trustTier === 'MEDIUM'
        ? 'Moderately trusted NPC organization with stable history.'
        : 'Low trust NPC organization. Review history carefully.';

    if (org.isFlagged) {
      summary += ' This organization is flagged for review.';
    }

    return {
      trustScore,
      trustTier,
      verified: org.verified,
      isFlagged: org.isFlagged,
      totalQuestsPosted: total,
      totalGoldSpent,
      completionRate,
      disputeRate,
      summary,
    };
  }
}

export const npcOrganizationService = new NpcOrganizationService();


