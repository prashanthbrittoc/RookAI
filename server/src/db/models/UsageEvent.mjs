import mongoose from 'mongoose';

const UsageEventSchema = new mongoose.Schema(
  {
    cacheKey: String,
    cached: { type: Boolean, required: true },
    model: String,
    level: String,
    promptVersion: String,
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },   // what this request actually cost
    savedUsd: { type: Number, default: 0 },  // on a hit: what the original run cost, i.e. money NOT spent
    durationMs: Number,
    failures: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
UsageEventSchema.index({ createdAt: 1 });

export const UsageEvent = mongoose.model('UsageEvent', UsageEventSchema);