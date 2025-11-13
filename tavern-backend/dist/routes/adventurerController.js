import express from "express";
import { updateProfile } from "../controllers/adventurerController.js";
import { verifyToken, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Adventurers can call update profile
router.put(
  "/adventurer/profile",
  verifyToken,
  authorizeRole("Adventurer"),
  updateProfile
);

export default router;
