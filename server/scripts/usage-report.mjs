import { requireEnv } from '../src/config/env.mjs';
import { connectDb, disconnectDb } from '../src/db/connect.mjs';
import { getUsageReport } from '../src/reports/usage-report.mjs';

requireEnv('MONGODB_URI');
const days = Number(process.argv[2] || 0); // 0 = all time
const since = days ? new Date(Date.now() - days * 86400_000) : undefined;

await connectDb();
const r = await getUsageReport({ since });

if (!r.overall) {
  console.log('No usage events yet.');
} else {
  const o = r.overall;
  console.log(`Requests: ${o.requests} | cache hits: ${o.hits} (${(o.hitRate * 100).toFixed(0)}%)`);
  console.log(`Spent: $${o.spendUsd.toFixed(4)} | saved by cache: $${o.savedUsd.toFixed(4)}`);
  console.log(`Tokens: ${o.inputTokens} in / ${o.outputTokens} out`);
  console.log(`Avg per fresh analysis: $${r.perFresh?.avgCostUsd?.toFixed(4)} in ${Math.round(r.perFresh?.avgMs ?? 0)} ms`);
  console.table(r.byDay.map((d) => ({ day: d._id.day, model: d._id.model, fresh: d.fresh, hits: d.hits, spendUsd: +d.spendUsd.toFixed(4) })));
}
await disconnectDb();