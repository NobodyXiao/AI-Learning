import { getAllModels } from './registry';

// ------- Types -------

type ProviderType = 'anthropic' | 'openai';

interface ProviderDef {
  type: ProviderType;
  envPrefix: string;
}

export interface ProviderConfig {
  type: ProviderType;
  baseURL: string;
  apiKey: string;
  model: string;
}

/** 规范化后的工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

/** 规范化后的 API 响应 */
export interface ChatResult {
  content: string;
  toolCalls: ToolCall[];
  /** 本轮完整 assistant 消息（用于追加到历史） */
  assistantMessage: Record<string, unknown>;
}

// ------- Provider 定义 -------

const PROVIDER_DEFS: Record<string, ProviderDef> = {
  deepseek: { type: 'anthropic', envPrefix: 'ANTHROPIC' },
  qwen:     { type: 'openai',    envPrefix: 'QWEN' },
  doubao:   { type: 'openai',    envPrefix: 'DOUBAO' },
  kimi:     { type: 'openai',    envPrefix: 'KIMI' },
};

function providerKeyForModel(modelName: string): string | undefined {
  return getAllModels().find((m) => m.id === modelName)?.provider;
}

function readEnv(prefix: string) {
  return {
    apiKey: process.env[`${prefix}_API_KEY`] || '',
    baseURL: process.env[`${prefix}_BASE_URL`] || '',
  };
}

// ------- 公共入口 -------

export function getProviderConfig(modelName?: string): ProviderConfig {
  const defaultModel = process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash';
  const finalModel = modelName || defaultModel;

  const pKey = providerKeyForModel(finalModel);
  const def = pKey ? PROVIDER_DEFS[pKey] : undefined;

  const prefix = def?.envPrefix || 'ANTHROPIC';
  const { apiKey, baseURL } = readEnv(prefix);

  return {
    type: def?.type || 'anthropic',
    baseURL,
    apiKey,
    model: finalModel,
  };
}

// ------- 消息/工具格式转换 -------

/** 把工具定义转为 API 格式 */
function toolsToApiFormat(type: ProviderType, tools: { name: string; description: string; inputSchema: Record<string, unknown> }[]) {
  if (type === 'anthropic') {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }
  return tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));
}

/** 生成 tool result 消息（追加到 messages 用，不含 assistant 消息） */
export function createToolResultMessages(
  type: ProviderType,
  results: { id: string; output: string }[],
): Record<string, unknown>[] {
  if (type === 'anthropic') {
    // Anthropic: tool results as user content with tool_result blocks
    return [
      {
        role: 'user',
        content: results.map((r) => ({
          type: 'tool_result',
          tool_use_id: r.id,
          content: r.output,
        })),
      },
    ];
  }

  // OpenAI: tool results as messages with role 'tool'
  return results.map((r) => ({
    role: 'tool',
    tool_call_id: r.id,
    content: r.output,
  }));
}

// ------- Anthropic API -------

async function anthropicChat(
  cfg: ProviderConfig,
  messages: Record<string, unknown>[],
  apiTools: Record<string, unknown>[],
  onChunk?: (text: string) => void,
): Promise<ChatResult> {
  const baseURL = cfg.baseURL.replace(/\/+$/, '');
  const url = `${baseURL}/v1/messages`;

  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: 2048,
    messages,
  };
  if (apiTools.length > 0) body.tools = apiTools;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': cfg.apiKey,
    'anthropic-version': '2023-06-01',
  };

  let fullText = '';
  const toolCalls: ToolCall[] = [];

  if (onChunk) {
    // 流式调用
    body.stream = true;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Anthropic API returned ${res.status}: ${errBody}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentToolIndex = -1;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('event:') && !line.startsWith('data:')) continue;

        if (line.startsWith('event: ')) {
          // event type line, next line will be data
          const eventType = line.slice(7).trim();
          // Wait for the data line
          continue;
        }

        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') break;

        let event: Record<string, unknown>;
        try { event = JSON.parse(jsonStr); } catch { continue; }

        const type = event.type as string;

        if (type === 'content_block_start') {
          const block = event.content_block as Record<string, unknown> || {};
          if (block.type === 'tool_use') {
            currentToolIndex = toolCalls.length;
            toolCalls.push({
              id: block.id as string,
              name: block.name as string,
              args: block.input as Record<string, unknown> || {},
            });
          }
        } else if (type === 'content_block_delta') {
          const delta = event.delta as Record<string, unknown> || {};
          if (delta.type === 'text_delta') {
            const text = delta.text as string || '';
            fullText += text;
            onChunk(text);
          } else if (delta.type === 'input_json_delta') {
            // accumulate partial JSON for tool calls
            if (currentToolIndex >= 0) {
              // We'll rely on the final complete input instead
            }
          }
        }
      }
    }
  } else {
    // 非流式
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Anthropic API returned ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const content = data.content as Array<Record<string, unknown>> || [];

    for (const block of content) {
      if (block.type === 'text') {
        fullText += (block.text as string) || '';
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id as string,
          name: block.name as string,
          args: block.input as Record<string, unknown> || {},
        });
      }
    }
  }

  // 构建 assistant 消息用于追加历史
  const assistantContent: Record<string, unknown>[] = [];
  if (fullText) assistantContent.push({ type: 'text', text: fullText });
  for (const tc of toolCalls) {
    assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
  }

  return {
    content: fullText,
    toolCalls,
    assistantMessage: {
      role: 'assistant',
      content: assistantContent.length === 1 && assistantContent[0].type === 'text'
        ? assistantContent[0].text
        : assistantContent,
    },
  };
}

// ------- OpenAI API -------

async function openAIChat(
  cfg: ProviderConfig,
  messages: Record<string, unknown>[],
  apiTools: Record<string, unknown>[],
  onChunk?: (text: string) => void,
): Promise<ChatResult> {
  const baseURL = cfg.baseURL.replace(/\/+$/, '');
  const url = `${baseURL}/chat/completions`;

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
  };
  if (apiTools.length > 0) {
    body.tools = apiTools;
    body.tool_choice = 'auto';
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cfg.apiKey}`,
  };

  let fullText = '';
  const toolCalls: ToolCall[] = [];

  if (onChunk) {
    // 流式
    body.stream = true;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI API returned ${res.status}: ${errBody}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let pendingToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        let chunk: Record<string, unknown>;
        try { chunk = JSON.parse(jsonStr); } catch { continue; }

        const choices = chunk.choices as Array<Record<string, unknown>> || [];
        for (const choice of choices) {
          const delta = choice.delta as Record<string, unknown> || {};
          const content = delta.content as string | undefined;
          if (content) {
            fullText += content;
            onChunk(content);
          }

          const tcDeltas = delta.tool_calls as Array<Record<string, unknown>> | undefined;
          if (tcDeltas) {
            for (const tcd of tcDeltas) {
              const idx = tcd.index as number;
              if (!pendingToolCalls.has(idx)) {
                pendingToolCalls.set(idx, { id: '', name: '', args: '' });
              }
              const tc = pendingToolCalls.get(idx)!;
              const fn = tcd.function as Record<string, unknown> || {};
              if (fn.name) tc.name = fn.name as string;
              if (fn.arguments) tc.args += fn.arguments as string;
              if (tcd.id) tc.id = tcd.id as string;
            }
          }
        }
      }
    }

    // Convert pending tool calls
    for (const [, tc] of pendingToolCalls) {
      try {
        toolCalls.push({ id: tc.id, name: tc.name, args: JSON.parse(tc.args || '{}') });
      } catch {
        toolCalls.push({ id: tc.id, name: tc.name, args: {} });
      }
    }
  } else {
    // 非流式
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI API returned ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const choices = data.choices as Array<Record<string, unknown>> || [];
    const msg = choices[0]?.message as Record<string, unknown> || {};
    fullText = (msg.content as string) || '';

    const rawCalls = msg.tool_calls as Array<Record<string, unknown>> | undefined;
    if (rawCalls) {
      for (const c of rawCalls) {
        const fn = c.function as Record<string, unknown> || {};
        try {
          toolCalls.push({
            id: c.id as string,
            name: fn.name as string,
            args: JSON.parse(fn.arguments as string || '{}'),
          });
        } catch {
          toolCalls.push({ id: c.id as string, name: fn.name as string, args: {} });
        }
      }
    }
  }

  // 构建 assistant 消息用于追加历史
  const assistantMsg: Record<string, unknown> = { role: 'assistant', content: fullText || null };
  if (toolCalls.length > 0) {
    assistantMsg.tool_calls = toolCalls.map((tc) => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.args) },
    }));
  }

  return {
    content: fullText,
    toolCalls,
    assistantMessage: assistantMsg,
  };
}

// ------- 统一入口 -------

export async function chat(
  cfg: ProviderConfig,
  messages: Record<string, unknown>[],
  apiTools: Record<string, unknown>[],
  onChunk?: (text: string) => void,
): Promise<ChatResult> {
  if (cfg.type === 'anthropic') return anthropicChat(cfg, messages, apiTools, onChunk);
  return openAIChat(cfg, messages, apiTools, onChunk);
}

export { toolsToApiFormat };
