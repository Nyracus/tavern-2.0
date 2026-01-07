// src/scripts/seedSkills.ts
import mongoose from 'mongoose';
import { SkillShopItemModel } from '../models/skillShop.model';
import dotenv from 'dotenv';

dotenv.config();

const skills = [
  // Combat Skills
  { name: "Sword Mastery", description: "Master the art of the blade. Increases damage with swords by 15%.", category: "Combat", price: 100, level: 1 },
  { name: "Dual Wielding", description: "Wield two weapons simultaneously. +10% attack speed, -5% accuracy.", category: "Combat", price: 150, level: 1 },
  { name: "Shield Bash", description: "Stun enemies with your shield. 2 second cooldown.", category: "Combat", price: 120, level: 1 },
  { name: "Power Strike", description: "Deliver a devastating blow. 200% damage, 5 second cooldown.", category: "Combat", price: 200, level: 1 },
  { name: "Whirlwind Attack", description: "Spin and strike all nearby enemies. Area damage.", category: "Combat", price: 250, level: 2 },
  { name: "Berserker Rage", description: "Enter a frenzy. +50% damage, -20% defense for 30 seconds.", category: "Combat", price: 300, level: 2 },
  { name: "Counter Attack", description: "Parry and counter enemy strikes. Reflect 50% damage.", category: "Combat", price: 180, level: 1 },
  { name: "Execution", description: "Finishing move on low-health enemies. Instant kill below 20% HP.", category: "Combat", price: 400, level: 3 },
  { name: "Bloodlust", description: "Gain health on kill. Restore 10% HP per enemy slain.", category: "Combat", price: 220, level: 1 },
  { name: "Weapon Mastery", description: "Proficiency with all weapon types. +10% damage with any weapon.", category: "Combat", price: 350, level: 2 },

  // Magic Skills
  { name: "Fireball", description: "Launch a ball of fire. 150% magic damage, 3 second cooldown.", category: "Magic", price: 150, level: 1 },
  { name: "Ice Bolt", description: "Freeze enemies with ice magic. Slows target by 30%.", category: "Magic", price: 140, level: 1 },
  { name: "Lightning Strike", description: "Call down lightning. Chain to 3 nearby enemies.", category: "Magic", price: 180, level: 1 },
  { name: "Healing Light", description: "Restore 30% of max HP. 10 second cooldown.", category: "Magic", price: 200, level: 1 },
  { name: "Mana Shield", description: "Absorb damage with mana. 1 damage = 0.5 mana cost.", category: "Magic", price: 250, level: 2 },
  { name: "Teleport", description: "Instantly move to a nearby location. 15 second cooldown.", category: "Magic", price: 300, level: 2 },
  { name: "Arcane Blast", description: "Powerful magic explosion. 300% magic damage, 8 second cooldown.", category: "Magic", price: 400, level: 3 },
  { name: "Summon Familiar", description: "Summon a magical companion to fight alongside you.", category: "Magic", price: 500, level: 3 },
  { name: "Time Slow", description: "Slow time around you. 50% speed reduction for 5 seconds.", category: "Magic", price: 450, level: 3 },
  { name: "Mana Surge", description: "Double mana regeneration for 60 seconds.", category: "Magic", price: 220, level: 1 },
  { name: "Elemental Mastery", description: "All elemental spells deal 25% more damage.", category: "Magic", price: 350, level: 2 },
  { name: "Dispel Magic", description: "Remove negative effects and enemy buffs.", category: "Magic", price: 180, level: 1 },

  // Stealth & Rogue Skills
  { name: "Stealth", description: "Become invisible to enemies. Lasts 30 seconds, breaks on attack.", category: "Stealth", price: 200, level: 1 },
  { name: "Backstab", description: "Critical strike from behind. 300% damage when attacking from rear.", category: "Stealth", price: 250, level: 1 },
  { name: "Pickpocket", description: "Steal gold from enemies. 10% chance per enemy.", category: "Stealth", price: 150, level: 1 },
  { name: "Poison Blade", description: "Apply poison to weapons. Deals 5% max HP damage over 10 seconds.", category: "Stealth", price: 180, level: 1 },
  { name: "Shadow Step", description: "Teleport behind target. 12 second cooldown.", category: "Stealth", price: 300, level: 2 },
  { name: "Assassinate", description: "Instant kill on unaware enemies. Only works from stealth.", category: "Stealth", price: 500, level: 3 },
  { name: "Smoke Bomb", description: "Create a smoke screen. Confuses enemies for 5 seconds.", category: "Stealth", price: 200, level: 1 },
  { name: "Lockpicking", description: "Open locked chests and doors without keys.", category: "Stealth", price: 120, level: 1 },
  { name: "Trap Detection", description: "See hidden traps and disarm them safely.", category: "Stealth", price: 160, level: 1 },
  { name: "Vanish", description: "Instantly enter stealth mode. 20 second cooldown.", category: "Stealth", price: 280, level: 2 },

  // Defense & Tank Skills
  { name: "Iron Skin", description: "Reduce all incoming damage by 20%.", category: "Defense", price: 200, level: 1 },
  { name: "Shield Wall", description: "Block all frontal attacks for 5 seconds. 30 second cooldown.", category: "Defense", price: 250, level: 1 },
  { name: "Taunt", description: "Force enemies to attack you. Draws aggro from all nearby foes.", category: "Defense", price: 150, level: 1 },
  { name: "Regeneration", description: "Slowly restore health over time. 1% HP per second.", category: "Defense", price: 180, level: 1 },
  { name: "Fortify", description: "Double your defense for 15 seconds. 45 second cooldown.", category: "Defense", price: 300, level: 2 },
  { name: "Last Stand", description: "When HP drops below 25%, gain 50% damage reduction.", category: "Defense", price: 350, level: 2 },
  { name: "Guardian's Aura", description: "Reduce damage taken by nearby allies by 15%.", category: "Defense", price: 400, level: 3 },
  { name: "Unbreakable", description: "Become immune to stuns and knockbacks for 10 seconds.", category: "Defense", price: 280, level: 2 },
  { name: "Armor Mastery", description: "All armor provides 25% more protection.", category: "Defense", price: 320, level: 2 },
  { name: "Second Wind", description: "Restore 50% HP when dropping below 10% health. Once per battle.", category: "Defense", price: 450, level: 3 },

  // Archery & Ranged Skills
  { name: "Precise Shot", description: "Next arrow deals 200% damage. 5 second cooldown.", category: "Archery", price: 150, level: 1 },
  { name: "Multi-Shot", description: "Fire 3 arrows at once. Each deals 80% damage.", category: "Archery", price: 200, level: 1 },
  { name: "Piercing Arrow", description: "Arrow pierces through multiple enemies.", category: "Archery", price: 180, level: 1 },
  { name: "Eagle Eye", description: "Double your attack range and accuracy.", category: "Archery", price: 250, level: 2 },
  { name: "Explosive Arrow", description: "Arrow explodes on impact. Area damage.", category: "Archery", price: 300, level: 2 },
  { name: "Rapid Fire", description: "Triple attack speed for 10 seconds. 30 second cooldown.", category: "Archery", price: 350, level: 2 },
  { name: "Headshot", description: "Critical hit chance increased by 25%.", category: "Archery", price: 280, level: 2 },
  { name: "Poison Arrow", description: "Arrows apply poison. Deals damage over time.", category: "Archery", price: 220, level: 1 },
  { name: "Arrow Storm", description: "Rain arrows on a large area. Massive damage.", category: "Archery", price: 500, level: 3 },
  { name: "Marksman", description: "All ranged attacks deal 30% more damage.", category: "Archery", price: 400, level: 3 },

  // Support & Utility Skills
  { name: "First Aid", description: "Bandage wounds. Restore 20% HP over 5 seconds.", category: "Support", price: 100, level: 1 },
  { name: "Group Heal", description: "Heal all nearby allies for 15% max HP.", category: "Support", price: 250, level: 2 },
  { name: "Blessing", description: "Grant +10% to all stats for 5 minutes.", category: "Support", price: 200, level: 1 },
  { name: "Resurrection", description: "Revive a fallen ally with 50% HP. 5 minute cooldown.", category: "Support", price: 600, level: 3 },
  { name: "Haste", description: "Increase movement and attack speed by 50% for 30 seconds.", category: "Support", price: 280, level: 2 },
  { name: "Protection Aura", description: "Reduce all damage taken by party by 10%.", category: "Support", price: 350, level: 2 },
  { name: "Mana Potion", description: "Instantly restore 50% mana. 1 minute cooldown.", category: "Support", price: 150, level: 1 },
  { name: "Detect Hidden", description: "Reveal hidden enemies and traps within 20 meters.", category: "Support", price: 180, level: 1 },
  { name: "Identify", description: "Identify properties of unknown items and equipment.", category: "Support", price: 120, level: 1 },
  { name: "Leadership", description: "Party members gain +5% to all stats when you're present.", category: "Support", price: 400, level: 3 },

  // Crafting & Gathering Skills
  { name: "Blacksmithing", description: "Craft and repair weapons and armor.", category: "Crafting", price: 200, level: 1 },
  { name: "Alchemy", description: "Brew potions and create magical elixirs.", category: "Crafting", price: 250, level: 1 },
  { name: "Enchanting", description: "Add magical properties to weapons and armor.", category: "Crafting", price: 300, level: 2 },
  { name: "Mining", description: "Extract ore and gems from mineral deposits.", category: "Crafting", price: 150, level: 1 },
  { name: "Herbalism", description: "Gather herbs and plants for alchemy.", category: "Crafting", price: 150, level: 1 },
  { name: "Leatherworking", description: "Craft leather armor and accessories.", category: "Crafting", price: 180, level: 1 },
  { name: "Jewelcrafting", description: "Create rings, amulets, and magical gems.", category: "Crafting", price: 280, level: 2 },
  { name: "Cooking", description: "Prepare meals that provide temporary stat bonuses.", category: "Crafting", price: 120, level: 1 },
  { name: "Master Craftsman", description: "All crafted items are 25% more effective.", category: "Crafting", price: 400, level: 3 },
  { name: "Resource Efficiency", description: "Use 20% fewer materials when crafting.", category: "Crafting", price: 320, level: 2 },

  // Beast Mastery & Pets
  { name: "Beast Taming", description: "Tame wild animals to serve as companions.", category: "Beast Mastery", price: 300, level: 2 },
  { name: "Pet Training", description: "Increase pet stats and abilities by 20%.", category: "Beast Mastery", price: 250, level: 1 },
  { name: "Animal Bond", description: "Share 10% of your stats with your pet.", category: "Beast Mastery", price: 350, level: 2 },
  { name: "Summon Wolf", description: "Summon a loyal wolf companion to fight with you.", category: "Beast Mastery", price: 400, level: 2 },
  { name: "Dragon Call", description: "Summon a young dragon. Ultimate companion skill.", category: "Beast Mastery", price: 800, level: 3 },
  { name: "Pack Leader", description: "Command multiple pets simultaneously.", category: "Beast Mastery", price: 500, level: 3 },
  { name: "Beast Form", description: "Transform into a powerful beast. +50% stats for 60 seconds.", category: "Beast Mastery", price: 600, level: 3 },

  // Special & Unique Skills
  { name: "Dragon Slayer", description: "Deal 50% more damage to dragons and drakes.", category: "Special", price: 500, level: 3 },
  { name: "Undead Bane", description: "Holy damage against undead enemies. 2x damage multiplier.", category: "Special", price: 400, level: 2 },
  { name: "Giant Killer", description: "Deal 30% more damage to large enemies.", category: "Special", price: 300, level: 2 },
  { name: "Lucky Strike", description: "5% chance to deal 500% damage on any attack.", category: "Special", price: 450, level: 3 },
  { name: "Phoenix Rebirth", description: "Resurrect upon death with 100% HP. Once per day.", category: "Special", price: 1000, level: 3 },
  { name: "Time Stop", description: "Freeze time for 3 seconds. Ultimate ability.", category: "Special", price: 1200, level: 3 },
  { name: "Reality Tear", description: "Open a portal to another dimension. Teleport anywhere.", category: "Special", price: 900, level: 3 },
  { name: "Divine Intervention", description: "Call upon the gods for aid. Random powerful effect.", category: "Special", price: 800, level: 3 },
];

async function seedSkills() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not set in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing skills (optional - comment out if you want to keep existing)
    // await SkillShopItemModel.deleteMany({});
    // console.log('Cleared existing skills');

    // Insert skills
    for (const skill of skills) {
      const existing = await SkillShopItemModel.findOne({ name: skill.name }).exec();
      if (!existing) {
        await SkillShopItemModel.create(skill);
        console.log(`✓ Added skill: ${skill.name}`);
      } else {
        console.log(`- Skipped (already exists): ${skill.name}`);
      }
    }

    console.log(`\n✅ Seeded ${skills.length} skills successfully!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding skills:', error);
    process.exit(1);
  }
}

seedSkills();




