// src/controllers/quest.controller.ts
import { Response } from "express";
import {Quest} from "../models/quest.model";
//import {Certificate} from "../models/Certificate";
import { addXP } from "./adventurerProfile.controller";
import { AuthRequest } from "../middleware/auth.middleware"; // or your own extended Request type

// XP values per difficulty (from questController.js)
const xpValues: Record<string, number> = {
  Easy: 100,
  Medium: 200,
  Hard: 400,
  Epic: 700,
};

// FR-11 & FR-20: mark quest as completed, award XP & certificate
export const completeQuest = async (req: AuthRequest, res: Response) => {
  try {
    const { questId } = req.params;
    const npcId = req.userId; // if your middleware uses req.user.id, change this line

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found." });
    }

    // ensure only the NPC who owns the quest can complete it
    if (quest.npcId.toString() !== String(npcId)) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (quest.status === "Completed" || quest.status === "Paid") {
      return res
        .status(400)
        .json({ message: "Quest already completed or paid." });
    }

    quest.status = "Completed";
    await quest.save();

    const advId = quest.adventurerId;
    if (!advId) {
      return res
        .status(400)
        .json({ message: "No adventurer assigned." });
    }

    const earnedXP = xpValues[quest.difficulty] ?? xpValues["Easy"];
    const adventurerUpdated = await addXP(String(advId), earnedXP);

    // Create certificate “Scroll of Deed”
    // const scrollId = `SCROLL-${Date.now()}-${Math.floor(
    //   Math.random() * 10000
    // )}`;

    // const certificate = await Certificate.create({
    //   adventurerId: advId,
    //   questId: quest._id,
    //   scrollId,
    // });

    // const updated: any = adventurerUpdated;

    // return res.status(200).json({
    //   message: `Quest completed. ${earnedXP} XP awarded.`,
    //   xp: updated.xp,
    //   rank: updated.rank,
    //   certificate,
    // });

  } catch (error) {
    console.error("Error completing quest:", error);
    return res.status(500).json({ message: "Server error." });
  }
};
