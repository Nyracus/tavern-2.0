// src/routes/adventurerProfile.routes.ts
import { Router } from 'express';
import { adventurerProfileController } from '../controllers/adventurerProfile.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All routes below require the user to be an authenticated ADVENTURER
const onlyAdventurers = [requireAuth, requireRole('ADVENTURER')] as const;

router.get(
  '/me',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.getMyProfile(req, res, next)
);

router.post(
  '/me',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.createMyProfile(req, res, next)
);

router.patch(
  '/me',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.updateMyProfile(req, res, next)
);

// Skill management
router.post(
  '/me/skills',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.addSkill(req, res, next)
);

router.patch(
  '/me/skills/:skillId',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.updateSkill(req, res, next)
);

router.delete(
  '/me/skills/:skillId',
  ...onlyAdventurers,
  (req, res, next) => adventurerProfileController.deleteSkill(req, res, next)
);

export default router;
