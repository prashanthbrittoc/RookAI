import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false }, // never returned by default
    plan: { type: String, enum: ['free'], default: 'free' },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);