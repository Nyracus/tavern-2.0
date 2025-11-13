import Quest from "./models/Quest.js";
import { addXP } from "./adventurerController.js";
import Certificate from "../models/Certificate.js";
import Adventurer from "../models/Adventurer.js";

// Helper: XP values per difficulty
const xpValues = {
  Easy: 100,
  Medium: 200,
  Hard: 400,
  Epic: 700
};

// FR-11 & FR-20: mark quest as completed, award XP & certificate
export const completeQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const npcId = req.user.id;

    const quest = await Quest.findById(questId);
    if (!quest) {
      return res.status(404).json({ message: "Quest not found." });
    }
    if (quest.npcId.toString() !== npcId) {
      return res.status(403).json({ message: "Not authorized." });
    }
    if (quest.status === "Completed" || quest.status === "Paid") {
      return res.status(400).json({ message: "Quest already completed or paid." });
    }

    quest.status = "Completed";
    await quest.save();

    const advId = quest.adventurerId;
    if (!advId) {
      return res.status(400).json({ message: "No adventurer assigned." });
    }

    const earnedXP = xpValues[quest.difficulty] || xpValues["Easy"];
    const adventurerUpdated = await addXP(advId, earnedXP);

    // Create certificate “Scroll of Deed”
    const scrollId = `SCROLL-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const certificate = await Certificate.create({
      adventurerId: advId,
      questId: quest._id,
      scrollId
    });

    res.status(200).json({
      message: `Quest completed. ${earnedXP} XP awarded.`,
      xp: adventurerUpdated.xp,
      rank: adventurerUpdated.rank,
      certificate
    });
  } catch (error) {
    console.error("Error completing quest:", error);
    res.status(500).json({ message: "Server error." });
  }
};
