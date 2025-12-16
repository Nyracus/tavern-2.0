// src/routes/skillShop.routes.ts
import { Router } from 'express';
import { verifyToken, authorizeRole } from '../middleware/auth.middleware';
import { skillShopController } from '../controllers/skillShop.controller';

const router = Router();

router.get(
  '/skills/shop',
  verifyToken,
  authorizeRole('ADVENTURER'),
  skillShopController.getShopItems.bind(skillShopController)
);

router.post(
  '/skills/shop/:skillId/purchase',
  verifyToken,
  authorizeRole('ADVENTURER'),
  skillShopController.purchaseSkill.bind(skillShopController)
);

export default router;

