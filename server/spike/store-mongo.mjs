import { GameAnalysis } from './model.mjs';

export const mongoStore = {
  async find(cacheKey) {
    return GameAnalysis.findOne({ cacheKey }).lean();
  },
  async save(doc) {
    try {
      await GameAnalysis.create(doc);
      return { saved: true };
    } catch (e) {
      if (e.code === 11000) return { saved: false, duplicate: true }; // someone saved it first: fine
      throw e;
    }
  },
};