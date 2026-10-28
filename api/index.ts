import 'dotenv/config';
import { createApp } from '../server/app.js';

// Vercel serverless entry: same Express app used by `pnpm dev:server`.
export default createApp();
