import type { ChatMessage } from '../types/chat';
import { weatherTool } from '../tools/definitions';
import { getProviderConfig, chat, createToolResultMessages, toolsToApiFormat } from '../models/providers';
import type { ToolDefinition } from '../tools/definitions';

const MAX_STEPS = 5;
const tools: ToolDefinition[] = [weatherTool];

export async function getChatResponseWithTools(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
  modelName?: string,
): Promise<string> {
  const cfg = getProviderConfig(modelName);
  const apiTools = toolsToApiFormat(cfg.type, tools);

  // 消息历史（可变，会在工具循环中追加数据）
  const history: Record<string, unknown>[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let fullText = '';

  for (let step = 0; step < MAX_STEPS; step++) {
    const result = await chat(cfg, history, apiTools, onChunk);

    // 追加 assistant 回复到历史
    history.push(result.assistantMessage);

    if (result.toolCalls.length === 0) {
      // 没有工具调用，本轮就是最终回复
      fullText += result.content;
      return fullText;
    }

    // 累积文字部分（后续步骤不触发 onChunk，工具结果不应暴露给用户）
    fullText += result.content;

    // 执行工具
    const toolResults: { id: string; output: string }[] = [];
    for (const call of result.toolCalls) {
      const tool = tools.find((t) => t.name === call.name);
      if (!tool) {
        toolResults.push({ id: call.id, output: `Unknown tool: ${call.name}` });
        continue;
      }
      try {
        const output = await tool.execute(call.args);
        toolResults.push({ id: call.id, output });
      } catch (err) {
        toolResults.push({ id: call.id, output: `Error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    // 将工具结果追加到历史
    const resultMessages = createToolResultMessages(cfg.type, toolResults);
    for (const msg of resultMessages) {
      history.push(msg);
    }
  }

  return fullText;
}
