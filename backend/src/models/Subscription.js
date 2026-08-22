import mongoose from "mongoose";






const subscriptionSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    
    
    
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
