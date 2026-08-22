import mongoose from "mongoose";

import { ENV } from "./env.js";

let connectingPromise = null;

export const connectDB = async () => {

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = mongoose.connect(ENV.DB_URL, {
    readPreference: "primary",
  });

  try {
    const conn = await connectingPromise;
    console.log("✅ Connected to MongoDB:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB", error);

    connectingPromise = null;
    throw error;
  }
};