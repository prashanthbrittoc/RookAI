import { requireEnv } from './config/env.mjs';
import { connectDb } from './db/connect.mjs';
import { User } from './db/models/User.mjs';
import { mongoUserStore } from './db/user-store.mjs';
import { createAuthService } from './services/auth-service.mjs';
import { createApp } from './app.mjs';

requireEnv('MONGODB_URI', 'JWT_SECRET');
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

await connectDb();
await User.init(); // make sure the unique email index exists

const app = createApp({ auth: createAuthService({ users: mongoUserStore }) });
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`RookAI API on http://localhost:${port}`));