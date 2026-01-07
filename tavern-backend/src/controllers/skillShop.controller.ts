// src/controllers/skillShop.controller.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { SkillShopItemModel } from '../models/skillShop.model';
import { UserModel } from '../models/user.model';
import { AdventurerProfileModel } from '../models/adventurerProfile.model';
import { AppError } from '../middleware/error.middleware';

export class SkillShopController {
  async getShopItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await SkillShopItemModel.find({ available: true })
        .sort({ category: 1, price: 1 })
        .exec();
      return res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  async purchaseSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthenticated' });
      }

      const { skillId } = req.params;

      // Get skill shop item
      const shopItem = await SkillShopItemModel.findById(skillId).exec();
      if (!shopItem || !shopItem.available) {
        return res.status(404).json({
          success: false,
          message: 'Skill not available in shop',
        });
      }

      // Get user and check gold
      const user = await UserModel.findById(req.userId).exec();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const userGold = user.gold || 0;
      if (userGold < shopItem.price) {
        return res.status(400).json({
          success: false,
          message: `Insufficient gold. You have ${userGold} gold, but this skill costs ${shopItem.price} gold.`,
        });
      }

      // Get or create adventurer profile (auto-create if doesn't exist)
      let profile = await AdventurerProfileModel.findOne({ userId: req.userId }).exec();
      if (!profile) {
        // Auto-create a basic profile with default values
        profile = await AdventurerProfileModel.create({
          userId: req.userId,
          title: "Novice Adventurer",
          summary: "A new adventurer just starting their journey.",
          class: "Fighter", // Default class, can be changed in dashboard
          level: 1,
          xp: 0,
          rank: "F",
          availableStatPoints: 0,
          attributes: {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            charisma: 10,
            vitality: 10,
            luck: 10,
          },
          skills: [],
        });
      }

      // Check if skill already exists
      const existingSkill = profile.skills.find(
        (s) => s.name.toLowerCase() === shopItem.name.toLowerCase()
      );
      if (existingSkill) {
        return res.status(400).json({
          success: false,
          message: 'You already have this skill. You can level it up instead.',
        });
      }

      // Deduct gold
      user.gold = (user.gold || 0) - shopItem.price;
      await user.save();

      // Add skill to profile
      profile.skills.push({
        name: shopItem.name,
        description: shopItem.description,
        level: shopItem.level,
        category: shopItem.category,
        cooldown: shopItem.cooldown,
      } as any);
      await profile.save();

      return res.json({
        success: true,
        data: {
          profile,
          remainingGold: user.gold,
        },
        message: `Successfully purchased ${shopItem.name}!`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const skillShopController = new SkillShopController();

