import { createApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await createApp();
  app.listen(env.apiPort, () => {
    console.log(`API listening on http://localhost:${env.apiPort}`);
  });
}

main().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
