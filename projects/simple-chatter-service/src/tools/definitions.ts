export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export const weatherTool: ToolDefinition = {
  name: 'get_current_weather',
  description: '获取指定城市的当前天气信息，用户问天气时调用此工具',
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string', description: '城市名称，如：北京、上海、深圳、Tokyo' },
    },
    required: ['city'],
  },
  execute: async ({ city }) => {
    const url = `https://wttr.in/${encodeURIComponent(city as string)}?format=%C+%t+%h+%w&lang=zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const text = await res.text();
    return `[${city}] ${text.trim()}`;
  },
};
