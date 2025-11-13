import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'; 

const router = Router();

router.get('/ping', (_req, res) => res.json({ message: '🏰 Tavern backend is alive!' }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes); 

export default router;
