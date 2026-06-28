import { generateText, streamText, isStepCount } from 'ai';
import type { ChatMessage } from '../types/chat';
import { weatherTool } from '../tools/definitions';
import { resolveModel } from '../models/providers';

export async function getChatResponseWithTools(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
  modelName?: string,
): Promise<string> {
  const model = resolveModel(modelName);

  if (onChunk) {
    const result = streamText({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools: { get_current_weather: weatherTool },
      stopWhen: isStepCount(5),
      temperature: 0.7,
    });

    let full = '';
    for await (const chunk of result.textStream) {
      full += chunk;
      onChunk(chunk);
    }
    return full;
  }

  const result = await generateText({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools: { get_current_weather: weatherTool },
    stopWhen: isStepCount(5),
    temperature: 0.7,
  });

  return result.text;
}
