// src/models/adventurerProfile.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IAdventurerSkill extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  level: number;          // e.g. 1–5
  category?: string;      // e.g. "Combat", "Magic"
  cooldown?: string;      // e.g. "Once per day"
}

export interface IAdventurerProfile extends Document {
  userId: string; // references User._id
  title: string;  // e.g. "Dragon Slayer"
  summary: string;
  class: string;  // e.g. "Mage", "Warrior"
  level: number;  // adventurer level

  race?: string;
  background?: string;

  attributes: {
    strength: number;
    dexterity: number;
    intelligence: number;
    charisma: number;
    vitality: number;
    luck: number;
  };

  skills: IAdventurerSkill[];

  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema<IAdventurerSkill>(
  {
    name: { type: String, required: true },
    description: { type: String },
    level: { type: Number, required: true, min: 1, max: 10 },
    category: { type: String },
    cooldown: { type: String },
  },
  { _id: true }
);

const AdventurerProfileSchema = new Schema<IAdventurerProfile>(
  {
    userId: { type: String, required: true, ref: 'User', unique: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    class: { type: String, required: true },
    level: { type: Number, required: true, min: 1 },

    race: { type: String },
    background: { type: String },

    attributes: {
      strength: { type: Number, required: true, min: 1, max: 20 },
      dexterity: { type: Number, required: true, min: 1, max: 20 },
      intelligence: { type: Number, required: true, min: 1, max: 20 },
      charisma: { type: Number, required: true, min: 1, max: 20 },
      vitality: { type: Number, required: true, min: 1, max: 20 },
      luck: { type: Number, required: true, min: 1, max: 20 },
    },

    skills: [SkillSchema],
  },
  { timestamps: true }
);

export const AdventurerProfileModel = model<IAdventurerProfile>(
  'AdventurerProfile',
  AdventurerProfileSchema
);
