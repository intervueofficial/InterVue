import mongoose from "mongoose";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import { getGenerationStatsToday } from "./aiGeneratorController.js";
import { ENV } from "../lib/env.js";

const DB_STATE_LABELS = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

// ==========================
// System Health snapshot
// ==========================
// Every check here is best-effort: a failed or unconfigured third-party
// check must never crash this endpoint or the whole page — it just comes
// back with available: false so the UI can show "unavailable" instead of
// a fabricated number.
export const getSystemHealth = async (req, res) => {
  const health = {
    app: {
      available: true,
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeLabel: formatUptime(process.uptime()),
      nodeEnv: ENV.NODE_ENV || "development",
    },
    database: {
      available: true,
      status: DB_STATE_LABELS[mongoose.connection.readyState] || "unknown",
      connected: mongoose.connection.readyState === 1,
    },
    aiGeneration: {
      available: true,
      ...getGenerationStatsToday(),
    },
    cloudinary: {
      available: false,
      configured: isCloudinaryConfigured,
    },
    codeExecution: {
      available: true,
      configured: Boolean(process.env.JDOODLE_CLIENT_ID && process.env.JDOODLE_CLIENT_SECRET),
    },
    email: {
      available: true,
      configured: Boolean(ENV.RESEND_API_KEY),
    },
  };

  // Cloudinary usage requires a real API round-trip — only attempt it if
  // credentials exist, and never let a failure (network, expired key,
  // rate limit on their side) take the endpoint down.
  if (isCloudinaryConfigured) {
    try {
      const usage = await cloudinary.api.usage();
      health.cloudinary = {
        available: true,
        configured: true,
        credits: usage.credits, // { usage, limit, used_percent }
        storageBytes: usage.storage?.usage ?? null,
        bandwidthBytes: usage.bandwidth?.usage ?? null,
        requests: usage.requests ?? null,
        plan: usage.plan ?? null,
      };
    } catch (error) {
      console.error("getSystemHealth — cloudinary.api.usage() failed:", error.message);
      health.cloudinary = { available: false, configured: true };
    }
  }

  return res.status(200).json({ success: true, health });
};
