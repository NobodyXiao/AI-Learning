export interface ToolUse {
  id: string;
  type: 'tool_use';
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

async function getWeather(city: string): Promise<string> {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=%C+%t+%h+%w&lang=zh`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
  const text = await res.text();
  const trimmed = text.trim();
  return `[${city}] ${trimmed}`;
}

export class ToolExecutor {
  private implementations: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
    get_current_weather: async (args) => {
      const city = String(args.city || '');
      if (!city) throw new Error('请提供城市名称');
      return getWeather(city);
    },
  };

  async executeToolUses(toolUses: ToolUse[]): Promise<ToolResult[]> {
    return Promise.all(toolUses.map((t) => this.executeSingle(t)));
  }

  private async executeSingle(tool: ToolUse): Promise<ToolResult> {
    const impl = this.implementations[tool.name];
    if (!impl) {
      return {
        type: 'tool_result',
        tool_use_id: tool.id,
        content: `Unknown tool: ${tool.name}`,
      };
    }
    try {
      const content = await impl(tool.input);
      return { type: 'tool_result', tool_use_id: tool.id, content };
    } catch (err) {
      return {
        type: 'tool_result',
        tool_use_id: tool.id,
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
