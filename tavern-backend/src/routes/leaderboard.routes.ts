// src/routes/leaderboard.routes.ts
import { Router } from "express";
import { getAdventurerLeaderboard } from "../controllers/leaderboard.controller";
import { cacheMiddleware } from "../middleware/cache.middleware";

const router = Router();

// Public leaderboard (cached for 5 minutes)
router.get(
  "/leaderboard/adventurers",
  cacheMiddleware({
    ttl: 300, // 5 minutes
    prefix: 'leaderboard',
    tags: ['leaderboard'],
  }),
  getAdventurerLeaderboard
);

export default router;
