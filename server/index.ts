import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3005);

createApp().listen(port, () => {
  console.log(`eRPH API listening on ${port}`);
});
