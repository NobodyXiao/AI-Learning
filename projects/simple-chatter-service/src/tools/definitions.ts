import type Anthropic from '@anthropic-ai/sdk';

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'get_current_weather',
    description: '获取指定城市的当前天气信息',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，如：北京、上海、深圳、Tokyo',
        },
      },
      required: ['city'],
    },
  },
];

export const toolNames = toolDefinitions.map((t) => t.name);
