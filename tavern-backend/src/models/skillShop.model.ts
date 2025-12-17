// src/models/skillShop.model.ts
import { Schema, model, Document } from 'mongoose';

export interface SkillShopItemDocument extends Document {
  name: string;
  description: string;
  category: string;
  price: number; // Gold cost
  level: number; // Skill level when purchased
  cooldown?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SkillShopItemSchema = new Schema<SkillShopItemDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    level: { type: Number, required: true, min: 1, max: 10, default: 1 },
    cooldown: { type: String },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SkillShopItemModel = model<SkillShopItemDocument>(
  'SkillShopItem',
  SkillShopItemSchema
);

