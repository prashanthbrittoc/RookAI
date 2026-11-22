import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import { connectDb, disconnectDb } from './db.mjs';
import { GameAnalysis } from './model.mjs';

await connectDb();
await GameAnalysis.init(); // makes sure the unique index exists
console.log('connected, collection:', GameAnalysis.collection.name);
await disconnectDb();