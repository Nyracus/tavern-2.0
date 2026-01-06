// src/controllers/leaderboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { AdventurerProfileModel } from "../models/adventurerProfile.model";

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

    const items = profiles.map((p: any, index: number) => ({
      position: index + 1,
      userId: p.userId,
      title: p.title,
      class: p.class,
      level: p.level,
      xp: p.xp ?? 0,
      rank: p.rank ?? "F",
    }));

    return res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
};
