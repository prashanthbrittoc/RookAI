import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
import 'dotenv/config';
import mongoose from 'mongoose';

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 }); // fail fast, don't hang
  return mongoose.connection;
}

export const disconnectDb = () => mongoose.disconnect();