import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adventurerProfileRoutes from './adventurerProfile.routes';  

const router = Router();

router.get('/ping', (_req, res) =>
  res.json({ message: '🏰 Tavern backend is alive!' })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/adventurers', adventurerProfileRoutes);               

export default router;


