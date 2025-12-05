// src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db.config";

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () =>
    console.log(`Tavern backend running on port ${PORT}`)
  );
};

start();
