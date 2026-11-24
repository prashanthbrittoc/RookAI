import mongoose from 'mongoose';

const MoveSchema = new mongoose.Schema(
  { ply: Number, moveNumber: Number, color: String, played: String, beforeCp: Number, afterCp: Number, loss: Number },
  { _id: false }
);
const MistakeSchema = new mongoose.Schema(
  { ply: Number, fenBefore: String, playedUci: String, bestUci: String, loss: Number, label: String },
  { _id: false }
);
const ItemSchema = new mongoose.Schema(
  { ply: Number, moveNumber: Number, played: String, label: String, theme: String, title: String, explanation: String, tip: String },
  { _id: false }
);

const GameAnalysisSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true }, // unique index = the safety net
    gameHash: { type: String, required: true, index: true },
    color: { type: String, enum: ['w', 'b'], required: true },
    depth: Number,
    level: String,
    model: String,
    promptVersion: String,
    analysisVersion: String,
    moves: [MoveSchema],       // lets the frontend draw an eval graph later without re-running Stockfish
    mistakes: [MistakeSchema], // FENs and moves for drawing arrows on the board
    items: [ItemSchema],       // the explanations
    usage: { input_tokens: Number, output_tokens: Number },
    costUsd: Number,
  },
  { timestamps: true }
);

export const GameAnalysis = mongoose.model('GameAnalysis', GameAnalysisSchema);