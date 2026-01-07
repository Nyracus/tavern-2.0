// src/controllers/npcOrganization.controller.ts
import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  createNpcOrganizationSchema,
  updateNpcOrganizationAdminSchema,
  updateNpcOrganizationSelfSchema,
} from '../schemas/npcOrganization.schema';
import { npcOrganizationService } from '../services/npcOrganization.service';

export class NpcOrganizationController {
  // NPC: GET /npc-organizations/me
  async getMyOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Not authenticated');
      const org = await npcOrganizationService.getMyOrganization(req.userId);
      if (!org) {
        return res.status(404).json({
          success: false,
          message: 'No organization profile found for this NPC',
        });
      }
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // NPC: POST /npc-organizations/me
  async createMyOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Not authenticated');
      const parsed = createNpcOrganizationSchema.parse(req.body);
      const org = await npcOrganizationService.createForNpc(req.userId, parsed);
      res.status(201).json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // NPC: PATCH /npc-organizations/me
  async updateMyOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Not authenticated');
      const parsed = updateNpcOrganizationSelfSchema.parse(req.body);
      const org = await npcOrganizationService.updateForNpc(req.userId, parsed);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // NPC: GET /npc-organizations/me/trust
  async getMyTrustOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) throw new AppError(401, 'Not authenticated');
      const myOrg = await npcOrganizationService.getMyOrganization(req.userId);
      if (!myOrg) throw new AppError(404, 'Organization profile not found');
      const overview = await npcOrganizationService.getTrustOverview(String(myOrg._id));
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  // GM: GET /npc-organizations
  async listOrganizations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { domain, minTrust, maxTrust } = req.query;
      const orgs = await npcOrganizationService.listAll({
        domain: domain as string | undefined,
        minTrust:
          typeof minTrust === 'string' ? Number.parseFloat(minTrust) : undefined,
        maxTrust:
          typeof maxTrust === 'string' ? Number.parseFloat(maxTrust) : undefined,
      });
      res.json({ success: true, data: orgs });
    } catch (err) {
      next(err);
    }
  }

  // GM: GET /npc-organizations/:id
  async getOrganizationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const org = await npcOrganizationService.getById(id);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // GM: PATCH /npc-organizations/:id
  async updateOrganizationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateNpcOrganizationAdminSchema.parse(req.body);
      const org = await npcOrganizationService.updateById(id, parsed as any);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }
}

export const npcOrganizationController = new NpcOrganizationController();


