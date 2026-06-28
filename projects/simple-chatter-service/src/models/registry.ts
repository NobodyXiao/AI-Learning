export interface ModelEntry {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
}

export type ModelGroup = {
  provider: string;
  providerLabel: string;
  models: ModelEntry[];
};

// 按提供商分组的模型列表
export const MODEL_GROUPS: ModelGroup[] = [
  {
    provider: 'deepseek',
    providerLabel: 'DeepSeek',
    models: [
      { id: 'deepseek-v4-flash', name: 'Flash', provider: 'deepseek', providerLabel: 'DeepSeek' },
      { id: 'deepseek-chat', name: 'Chat', provider: 'deepseek', providerLabel: 'DeepSeek' },
    ],
  },
  {
    provider: 'qwen',
    providerLabel: '通义千问',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen', providerLabel: '通义千问' },
      { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen', providerLabel: '通义千问' },
      { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen', providerLabel: '通义千问' },
    ],
  },
  {
    provider: 'doubao',
    providerLabel: '豆包',
    models: [
      { id: 'doubao-pro-32k', name: 'Pro 32K', provider: 'doubao', providerLabel: '豆包' },
      { id: 'doubao-pro-128k', name: 'Pro 128K', provider: 'doubao', providerLabel: '豆包' },
      { id: 'doubao-lite-32k', name: 'Lite 32K', provider: 'doubao', providerLabel: '豆包' },
    ],
  },
  {
    provider: 'kimi',
    providerLabel: 'Kimi',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', provider: 'kimi', providerLabel: 'Kimi' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', provider: 'kimi', providerLabel: 'Kimi' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', provider: 'kimi', providerLabel: 'Kimi' },
    ],
  },
];

export function getAllModels(): ModelEntry[] {
  return MODEL_GROUPS.flatMap((g) => g.models);
}
