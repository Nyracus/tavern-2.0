// src/routes/leaderboard.routes.ts
import { Router } from "express";
import { getAdventurerLeaderboard } from "../controllers/leaderboard.controller";

const router = Router();

// Public leaderboard (no auth required, or add verifyToken if you want)
router.get("/leaderboard/adventurers", getAdventurerLeaderboard);

export default router;
