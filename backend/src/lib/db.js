import mongoose from "mongoose";

import { ENV } from "./env.js";

// Tracks an in-flight connection attempt so concurrent callers (e.g.
// two Inngest webhook deliveries landing at the same moment) share one
// connect() call instead of each kicking off their own.
let connectingPromise = null;

export const connectDB = async () => {
  // Already connected — nothing to do. Without this check, connectDB()
  // was being called fresh on every single Inngest function invocation
  // (sync-user, delete-user-from-db, the reminder cron all call it),
  // on top of the connection server.js already opened at boot.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = mongoose.connect(ENV.DB_URL);

  try {
    const conn = await connectingPromise;
    console.log("✅ Connected to MongoDB:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB", error);

    // Bug fix: this used to call process.exit(1) right here,
    // unconditionally. That's the correct move the ONE time this
    // function runs at server boot (server.js's startServer(), before
    // any traffic is being served — no point staying up without a
    // DB). But this same connectDB() is also invoked from inside every
    // Inngest function, in the SAME running process as the live web
    // server, on every webhook delivery and every 5-minute cron tick.
    // A single transient Mongo blip during any one of those was
    // calling process.exit(1) and killing the entire Express server
    // for every user currently using the site — which is what the
    // repeated back-to-back "Connected to MongoDB" logs were actually
    // showing: the process restarting, not just reconnecting.
    //
    // Instead, just throw and let the caller decide. server.js's own
    // startServer() already has a try/catch that exits on startup
    // failure — that behavior is unchanged. An Inngest function that
    // fails to connect will just fail that one invocation, which
    // Inngest already retries on its own, instead of taking down
    // everything else running in this process.
    connectingPromise = null;
    throw error;
  }
};