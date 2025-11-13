import Adventurer from "../models/Adventurer.js";

// Helper: compute rank from xp
const calculateRank = (xp) => {
  if (xp >= 5000) return "SSS";
  if (xp >= 3000) return "SS";
  if (xp >= 2000) return "S";
  if (xp >= 1500) return "A";
  if (xp >= 1000) return "B";
  if (xp >= 700) return "C";
  if (xp >= 400) return "D";
  if (xp >= 200) return "E";
  return "F";
};

// FR-5: Adventurer updates profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, skills, class: adventurerClass } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required." });
    }
    if (bio && bio.length > 300) {
      return res.status(400).json({ message: "Bio exceeds max length." });
    }

    const updated = await Adventurer.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        bio: bio?.trim(),
        skills: Array.isArray(skills) ? skills : [],
        class: adventurerClass
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Adventurer not found." });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      profile: updated
    });
  } catch (error) {
    console.error("Error updating adventurer profile:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Function to add XP (used via quest completion)
export const addXP = async (adventurerId, earnedXP) => {
  const adv = await Adventurer.findById(adventurerId);
  if (!adv) {
    throw new Error("Adventurer not found");
  }
  adv.xp += earnedXP;
  adv.rank = calculateRank(adv.xp);
  await adv.save();
  return adv;
};
