// src/controllers/leaderboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { AdventurerProfileModel } from "../models/adventurerProfile.model";
import { UserModel } from "../models/user.model";

export const getAdventurerLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 50,
      100
    ); // cap at 100

    const profiles = await AdventurerProfileModel.find()
      .sort({ xp: -1, level: -1, createdAt: 1 })
      .limit(limit)
      .lean<any>();

    // Get user information for each profile
    const userIds = profiles.map((p: any) => p.userId);
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select("_id username displayName")
      .lean<any>();

    // Create a map for quick lookup
    const userMap = new Map(
      users.map((u: any) => [String(u._id), u])
    );

    const items = profiles.map((p: any, index: number) => {
      const user: any = userMap.get(p.userId);
      return {
        position: index + 1,
        userId: p.userId,
        username: user?.username || "Unknown",
        displayName: user?.displayName || user?.username || "Unknown",
        title: p.title,
        class: p.class || "Unknown", // Use class from profile
        level: p.level,
        xp: p.xp ?? 0,
        rank: p.rank ?? "F",
      };
    });

    return res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
};
