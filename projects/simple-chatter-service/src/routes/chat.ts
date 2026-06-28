import { Router, Request, Response } from "express";
import { getChatResponseWithTools } from "../services/anthropic";
import type { ChatRequest } from "../types/chat";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res
        .status(400)
        .json({ error: "messages array is required and must not be empty" });
      return;
    }

    const reply = await getChatResponseWithTools(messages);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

router.post("/chat/stream", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res
        .status(400)
        .json({ error: "messages array is required and must not be empty" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const messagesCopy = JSON.parse(JSON.stringify(messages));
    const onChunk = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    };

    await getChatResponseWithTools(messagesCopy, onChunk);

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get AI response" });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream failed" })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

export default router;
