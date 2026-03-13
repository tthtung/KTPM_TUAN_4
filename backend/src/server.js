import { buildApp } from './app.js';

const port = Number(process.env.PORT || 3001);

const app = await buildApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});
