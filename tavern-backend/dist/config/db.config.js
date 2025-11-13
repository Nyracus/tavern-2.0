"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
// src/config/db.config.ts
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const mongoUri = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ MongoDB connected');
    }
    catch (err) {
        console.warn('⚠️  MongoDB connection failed:', err instanceof Error ? err.message : err);
        console.warn('⚠️  Server will start without database. Please start MongoDB or configure Atlas.');
        // Don't exit - allow server to start for testing API structure
    }
};
exports.connectDB = connectDB;
