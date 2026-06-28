import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', chatRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Simple Chatter Service running on http://localhost:${PORT}`);
  console.log(`Model: ${process.env.ANTHROPIC_MODEL || process.env.OPENAI_MODEL || 'claude-sonnet-4-20250514'}`);
  console.log(`API key set: ${Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)}`);
  console.log(`Base URL: ${process.env.ANTHROPIC_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.anthropic.com'}`);
});
