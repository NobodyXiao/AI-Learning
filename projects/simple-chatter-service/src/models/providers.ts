import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { getAllModels } from './registry';

type ProviderType = 'anthropic' | 'openai';

interface ProviderDef {
  type: ProviderType;
  envPrefix: string;
}

const PROVIDER_DEFS: Record<string, ProviderDef> = {
  deepseek: { type: 'anthropic', envPrefix: 'ANTHROPIC' },
  qwen:     { type: 'openai',    envPrefix: 'QWEN' },
  doubao:   { type: 'openai',    envPrefix: 'DOUBAO' },
  kimi:     { type: 'openai',    envPrefix: 'KIMI' },
};

/** 获取一个模型所属的 provider key */
function providerKeyForModel(modelName: string): string | undefined {
  return getAllModels().find((m) => m.id === modelName)?.provider;
}

/** 根据 provider key 读取环境变量配置 */
function readEnv(prefix: string) {
  const apiKey = process.env[`${prefix}_API_KEY`] || undefined;
  const baseURL = process.env[`${prefix}_BASE_URL`] || undefined;
  return { apiKey, baseURL };
}

/**
 * 根据模型名称创建对应的 AI SDK model 实例。
 * 每个提供商可以有自己的 baseURL 和 API key。
 */
export function resolveModel(modelName?: string) {
  if (!modelName) {
    // 使用默认配置
    const { apiKey, baseURL } = readEnv('ANTHROPIC');
    return createAnthropic({ apiKey, baseURL })(process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash');
  }

  const pKey = providerKeyForModel(modelName);
  const def = pKey ? PROVIDER_DEFS[pKey] : undefined;

  if (!def) {
    // 未识别的模型，fallback 到默认 Anthropic 配置
    const { apiKey, baseURL } = readEnv('ANTHROPIC');
    return createAnthropic({ apiKey, baseURL })(modelName);
  }

  const { apiKey, baseURL } = readEnv(def.envPrefix);

  if (def.type === 'anthropic') {
    return createAnthropic({ apiKey, baseURL })(modelName);
  }

  // OpenAI 兼容接口使用 Chat Completions API，而非默认的 Responses API
  return createOpenAI({ apiKey, baseURL }).chat(modelName);
}
