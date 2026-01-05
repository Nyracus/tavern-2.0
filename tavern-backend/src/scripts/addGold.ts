// src/scripts/addGold.ts
import mongoose from 'mongoose';
import { UserModel } from '../models/user.model';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI as string;

async function listUsers() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB\n");

    const users = await UserModel.find({}).select('username displayName email role gold').exec();
    
    if (users.length === 0) {
      console.log("No users found.");
    } else {
      console.log("Available users:");
      console.log("=".repeat(80));
      users.forEach((user) => {
        console.log(`Username: ${user.username} | Display: ${user.displayName} | Role: ${user.role} | Gold: ${user.gold || 0}`);
      });
      console.log("=".repeat(80));
    }
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

async function addGold(identifier: string, amount: number) {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not defined in .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Try to find by username first, then by displayName
    let user = await UserModel.findOne({ username: identifier }).exec();
    if (!user) {
      user = await UserModel.findOne({ displayName: identifier }).exec();
    }
    
    if (!user) {
      console.error(`\n❌ User with username or displayName "${identifier}" not found.`);
      console.log("\nRun 'npm run list-users' to see all available users.");
      process.exit(1);
    }

    const previousGold = user.gold || 0;
    user.gold = previousGold + amount;
    await user.save();

    console.log(`\n✅ Successfully added ${amount} gold to user "${user.username}"`);
    console.log(`   Previous gold: ${previousGold}`);
    console.log(`   New gold: ${user.gold}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Display Name: ${user.displayName}`);
  } catch (error) {
    console.error("Error adding gold:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Get command line arguments
const command = process.argv[2];

if (command === "list" || command === "list-users") {
  listUsers();
} else {
  const identifier = command;
  const amount = Number(process.argv[3]);

  if (!identifier || !amount || isNaN(amount)) {
    console.error("Usage:");
    console.error("  npm run add-gold <username|displayName> <amount>");
    console.error("  npm run add-gold list  (to see all users)");
    console.error("\nExamples:");
    console.error("  npm run add-gold Frost 1000");
    console.error("  npm run add-gold \"Frost The Mage\" 1000");
    process.exit(1);
  }

  addGold(identifier, amount);
}

