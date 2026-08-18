import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

// Routes
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import executeRoute from "./routes/executeRoute.js";
import authRoute from "./routes/authRoute.js";

// New Routes
import problemRoute from "./routes/problemRoute.js";
import adminRoute from "./routes/adminRoute.js";
import quizRoute from "./routes/quizRoute.js";
import jobRoute from "./routes/jobRoute.js";
import applicationRoute from "./routes/applicationRoute.js";
import aiGeneratorRoute from "./routes/aiGeneratorRoute.js";
import adminModulesRoute from "./routes/adminModulesRoute.js";
import subscriptionRoute from "./routes/subscriptionRoute.js";

const app = express();
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "https://intervue.site",
  "https://www.intervue.site",
];

// ================= Core Middleware =================

// CORS must run before body parsing — otherwise a request that's
// rejected for being too large (see below) never reaches this
// middleware, so its response has no Access-Control-Allow-Origin
// header, and the browser reports it as a CORS failure instead of the
// real error (a confusing red herring when debugging uploads).
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

// Raised from Express's 100kb default so base64-encoded uploads (profile
// pictures, and resumes up to 10MB — see /api/auth/profile-image and
// /api/auth/profile-resume) fit in a single JSON request. Base64 encoding
// itself inflates a file's size by ~37%, so a 10MB resume becomes ~14MB
// on the wire before the JSON envelope around it — 15mb leaves headroom
// for that plus the couple of other fields sent alongside it.
app.use(express.json({ limit: "15mb" }));

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

app.use(clerkMiddleware());

// ================= API Routes =================

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/execute", executeRoute);
app.use("/api/auth", authRoute);

// Admin APIs
app.use("/api/admin", adminRoute);
// Billing, Pipeline, Audit Log, Email Templates, System Health, Settings
app.use("/api/admin", adminModulesRoute);

// Problems APIs
app.use("/api/problems", problemRoute);

// Quiz APIs
app.use("/api/quizzes", quizRoute);

// Job Postings & Applications
app.use("/api/jobs", jobRoute);
app.use("/api/applications", applicationRoute);

// AI Generator API
app.use("/api/ai", aiGeneratorRoute);
app.use("/api/subscription", subscriptionRoute);

// ================= Health Check =================

app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// ================= Production =================

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// ================= Start Server =================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
      console.log(`Health: http://localhost:${ENV.PORT}/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

/*
============================================
InterVue Progress
============================================
✓ UI Changes
✓ Quiz Page
✓ Eye Ball Detection
✓ Meet Recording
✓ Interviewer Dashboard
✓ Admin Dashboard
✓ Admin Users
✓ Admin Sessions
✓ Admin Analytics
✓ Problem CRUD (Backend)
✓ Quiz CRUD
✓ AI Generator (Problems + Quiz)
⬜ Admin Settings
⬜ Reports
============================================
*/
