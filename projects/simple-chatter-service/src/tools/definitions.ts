import { tool } from 'ai';
import { z } from 'zod';

const weatherParams = z.object({
  city: z.string().describe('城市名称，如：北京、上海、深圳、Tokyo'),
});

export const weatherTool = tool({
  description: '获取指定城市的当前天气信息，用户问天气时调用此工具',
  inputSchema: weatherParams,
  execute: async ({ city }: z.infer<typeof weatherParams>) => {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%h+%w&lang=zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const text = await res.text();
    return `[${city}] ${text.trim()}`;
  },
});
