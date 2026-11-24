import { UsageEvent } from '../db/models/UsageEvent.mjs';

export async function getUsageReport({ since = new Date(0) } = {}) {
  const inRange = { $match: { createdAt: { $gte: since } } };

  const [overall] = await UsageEvent.aggregate([
    inRange,
    {
      $group: {
        _id: null,
        requests: { $sum: 1 },
        hits: { $sum: { $cond: ['$cached', 1, 0] } },
        spendUsd: { $sum: '$costUsd' },
        savedUsd: { $sum: '$savedUsd' },
        inputTokens: { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      },
    },
    {
      $project: {
        _id: 0, requests: 1, hits: 1, spendUsd: 1, savedUsd: 1, inputTokens: 1, outputTokens: 1,
        hitRate: { $cond: [{ $eq: ['$requests', 0] }, 0, { $divide: ['$hits', '$requests'] }] },
      },
    },
  ]);

  const byDay = await UsageEvent.aggregate([
    inRange,
    {
      $group: {
        _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, model: '$model' },
        fresh: { $sum: { $cond: ['$cached', 0, 1] } },
        hits: { $sum: { $cond: ['$cached', 1, 0] } },
        spendUsd: { $sum: '$costUsd' },
      },
    },
    { $sort: { '_id.day': 1 } },
  ]);

  const [perFresh] = await UsageEvent.aggregate([
    inRange,
    { $match: { cached: false } },
    { $group: { _id: null, avgCostUsd: { $avg: '$costUsd' }, avgMs: { $avg: '$durationMs' } } },
  ]);

  return { overall: overall ?? null, byDay, perFresh: perFresh ?? null };
}