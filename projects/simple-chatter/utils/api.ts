const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
}

export interface ModelGroup {
  provider: string;
  providerLabel: string;
  models: ModelInfo[];
}

export async function fetchModels(): Promise<{ default: string; groups: ModelGroup[]; models: ModelInfo[] }> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function sendChatMessage(messages: ChatMessage[], model?: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function streamChatMessage(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  model?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) onChunk(parsed.content);
      } catch { /* skip malformed */ }
    }
  }

  onDone();
}
