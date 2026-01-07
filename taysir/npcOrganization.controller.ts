// src/controllers/npcOrganization.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  createNpcOrganizationSchema,
  updateNpcOrganizationAdminSchema,
  updateNpcOrganizationSelfSchema,
} from '../schemas/npcOrganization.schema';
import { npcOrganizationService } from '../services/npcOrganization.service';

export class NpcOrganizationController {
  // NPC: GET /npc-organizations/me
  async getMyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const org = await npcOrganizationService.getMyOrganization(req.user.id);
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
  async createMyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const parsed = createNpcOrganizationSchema.parse(req.body);
      const org = await npcOrganizationService.createForNpc(req.user.id, parsed);

      res.status(201).json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // NPC: PATCH /npc-organizations/me
  async updateMyOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const parsed = updateNpcOrganizationSelfSchema.parse(req.body);
      const org = await npcOrganizationService.updateForNpc(req.user.id, parsed);

      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // NPC: GET /npc-organizations/me/trust
  async getMyTrustOverview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const org = await npcOrganizationService.getMyOrganization(req.user.id);
      if (!org) throw new AppError(404, 'Organization profile not found');

      const overview = await npcOrganizationService.getTrustOverview(org.id);
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }

  // GM: GET /npc-organizations
  async listOrganizations(req: Request, res: Response, next: NextFunction) {
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
  async getOrganizationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const org = await npcOrganizationService.getById(id);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }

  // GM: PATCH /npc-organizations/:id
  async updateOrganizationById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const parsed = updateNpcOrganizationAdminSchema.parse(req.body);
      const org = await npcOrganizationService.updateById(id, parsed);
      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }
}

export const npcOrganizationController = new NpcOrganizationController();
