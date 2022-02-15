import mongoose from "mongoose";
import { app } from "./app";

// DB CONNECTION & SERVER START
(async () => {
  console.log("Starting Auth service");
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Connected to MongoDB");
  } catch (err) {
    console.error("🛑", err);
  }

  // START SERVER
  app.listen(3000, () =>
    console.log(`✅✅✅ Listening at http://localhost:3000`)
  );
})();
