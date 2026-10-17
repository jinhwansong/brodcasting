import { createApp } from './create-app.js';
async function main() {
  const port = Number(process.env.PORT ?? 3002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  const app = await createApp();
  await app.listen(port, '127.0.0.1');
  console.info(`학습용 API: http://127.0.0.1:${port}/api/broadcasts`);
  const shutdown = () => { void app.close().then(() => process.exit(0)); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
