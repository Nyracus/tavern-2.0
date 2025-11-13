"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_config_1 = require("./config/db.config");
const PORT = Number(process.env.PORT) || 3000;
const start = async () => {
    await (0, db_config_1.connectDB)();
    app_1.default.listen(PORT, () => console.log(`Tavern backend running on port ${PORT}`));
};
start();
