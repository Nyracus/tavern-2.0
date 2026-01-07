// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adventurerProfileRoutes from './adventurerProfile.routes';

// 🔽 NEW
import npcOrganizationRoutes from './npcOrganization.routes';
import questRoutes from './quest.routes';

const router = Router();

router.get('/ping', (_req, res) => {
  res.json({ message: '🏰 Tavern backend is alive!' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/adventurers', adventurerProfileRoutes);

// 🔽 NEW mount points
router.use('/npc-organizations', npcOrganizationRoutes);
router.use('/quests', questRoutes);

export default router;




