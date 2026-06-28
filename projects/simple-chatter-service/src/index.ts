import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import { MODEL_GROUPS, getAllModels } from './models/registry';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', chatRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/models', (_req, res) => {
  const defaultModel = process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash';
  res.json({
    default: defaultModel,
    groups: MODEL_GROUPS,
    models: getAllModels(),
  });
});

app.listen(PORT, () => {
  const configured: string[] = [];
  const providers = [
    { name: 'DeepSeek', prefix: 'ANTHROPIC' },
    { name: '通义千问',  prefix: 'QWEN' },
    { name: '豆包',     prefix: 'DOUBAO' },
    { name: 'Kimi',     prefix: 'KIMI' },
  ];
  for (const p of providers) {
    if (process.env[`${p.prefix}_API_KEY`]) {
      configured.push(`${p.name} ✅`);
    } else {
      configured.push(`${p.name} ❌`);
    }
  }

  console.log(`Simple Chatter Service running on http://localhost:${PORT}`);
  console.log(`Default model: ${process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash'}`);
  console.log(`Providers: ${configured.join('  ')}`);
});
