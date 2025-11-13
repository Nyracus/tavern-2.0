import mongoose from "mongoose";

const adventurerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 300
  },
  skills: {
    type: [String],
    default: []
  },
  class: {
    type: String,
    enum: ["Warrior","Mage","Rogue","Healer","Archer"],
    default: "Warrior"
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  rank: {
    type: String,
    enum: ["F","E","D","C","B","A","S","SS","SSS"],
    default: "F"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Adventurer", adventurerSchema);