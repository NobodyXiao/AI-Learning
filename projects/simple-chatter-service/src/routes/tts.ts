import { Router } from 'express';
import { synthesize } from '../services/tts';

const router = Router();

router.get('/tts', async (req, res) => {
  const text = req.query.text as string;
  if (!text || text.length > 500) {
    res.status(400).json({ error: 'Text is required and must be under 500 characters' });
    return;
  }

  try {
    const audio = await synthesize(text);
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audio.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(audio);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'TTS synthesis failed' });
  }
});

export default router;
