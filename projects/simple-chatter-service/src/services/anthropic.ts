import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from '../types/chat';
import { toolDefinitions } from '../tools/definitions';
import { ToolExecutor, ToolUse } from '../tools/executor';

let client: Anthropic;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    });
  }
  return client;
}

const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || 1024;

const toolExecutor = new ToolExecutor();

// ===== 辅助函数 =====

function toAnthropicMessages(messages: ChatMessage[]) {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');

  return {
    system: systemMessages.map((m) => m.content).join('\n') || undefined,
    messages: nonSystem.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  };
}

function extractText(content: Anthropic.Message['content']): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

function extractToolUses(content: Anthropic.Message['content']): Anthropic.ToolUseBlock[] {
  return content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
}

// ===== 带工具调用的聊天 =====

export async function getChatResponseWithTools(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
): Promise<string> {
  let anthropicMessages: Anthropic.MessageParam[] = [];
  let systemPrompt: string | undefined;
  let fullResponse = '';

  const { system, messages: msgs } = toAnthropicMessages(messages);
  systemPrompt = system;
  anthropicMessages = msgs;

  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await getClient().messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: toolDefinitions,
    });

    const textContent = extractText(response.content);
    fullResponse += textContent;

    if (onChunk) onChunk(textContent);

    const toolBlocks = extractToolUses(response.content);
    if (toolBlocks.length === 0) break;

    if (onChunk) {
      onChunk(`\n\n[调用工具: ${toolBlocks.map((t) => t.name).join(', ')}]\n\n`);
    }

    const toolResults = await toolExecutor.executeToolUses(
      toolBlocks.map((t): ToolUse => ({
        id: t.id,
        type: 'tool_use',
        name: t.name,
        input: t.input as Record<string, unknown>,
      })),
    );

    anthropicMessages.push({ role: 'assistant', content: response.content });
    anthropicMessages.push({
      role: 'user',
      content: toolResults.map((r) => ({
        type: 'tool_result' as const,
        tool_use_id: r.tool_use_id,
        content: r.content,
      })),
    });

    if (onChunk) onChunk('[工具执行完成]\n\n');
  }

  return fullResponse;
}
