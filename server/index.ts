import path from 'node:path';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 3005);
const databasePath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data/erph.sqlite');
const staticDir = process.env.NODE_ENV === 'production' ? path.resolve(process.cwd(), 'dist') : null;

createApp({ databasePath, staticDir }).listen(port, () => {
  console.log(`eRPH server listening on ${port}`);
});
