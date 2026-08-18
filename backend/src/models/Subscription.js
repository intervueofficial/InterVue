import mongoose from "mongoose";

// Data model + admin visibility only — there is no real payment gateway
// wired up (no Stripe/Razorpay integration). Nothing in the candidate-
// facing app creates or mutates these yet; they exist so the admin
// Billing page has something real to read once a payment provider is
// plugged in later.
const subscriptionSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Interview-prep-flavored plan names rather than generic
    // free/pro/enterprise — chosen to match what this product actually
    // sells (mock interview access, AI question generation limits, etc.)
    plan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "past_due", "trialing"],
      default: "active",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
