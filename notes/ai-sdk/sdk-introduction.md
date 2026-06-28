# AI SDK 介绍

## 什么是 AI SDK？

AI SDK 是“工具箱”，里面装着各种现成的工具函数，让你更方便地调用 AI 模型API，而不用自己从头写网络请求代码。
SDK帮我们做了以下工作：

> 封装了 HTTP 请求的细节（不用自己拼 URL、headers）

> 自动处理认证（API Key 放哪里）

> 处理重试、超时、错误等网络问题

> 把返回的 JSON 解析成方便操作的对象

> 支持流式输出（打字机效果）等高级功能

---

## SDK的种类

> 官方 SDK openai（OpenAI官方）、dashscope（阿里通义） 只针对自家模型，功能最全

> 统一 SDK（也称多模型 SDK） LangChain、LlamaIndex、Vercel AI SDK 一套 API 调多个模型，切换方便

> 兼容 SDK 用 openai 包去调通义、Kimi 借 OpenAI 的“点餐平板”去点川菜

---

## 三大 SDK 对比

|                 | @anthropic-ai/sdk  | openai (npm)         | Vercel AI SDK (ai)             |
| --------------- | ------------------ | -------------------- | ------------------------------ |
| **定位**        | Anthropic 官方 SDK | OpenAI 官方 SDK      | **统一抽象层**                 |
| **支持的模型**  | 仅 Claude          | 仅 OpenAI / 兼容接口 | 任意模型（通过 provider 插件） |
| **流式输出**    | 原生支持           | 原生支持             | 统一接口                       |
| **工具调用**    | 需手动处理循环     | 需手动处理循环       | **自动循环**                   |
| **多 provider** | ❌                 | ❌                   | ✅                             |
| **包体积**      | 小                 | 小                   | 较大（含抽象层）               |

---

## Vercel AI SDK 详解

### 核心概念

Vercel AI SDK 是一个**抽象层**，通过 provider 插件模式支持 20+ 模型提供商：

- 统一了不同模型的调用方式
- 工具调用循环内置（无需手写 while 循环）
- 只需改 model 名称就能切换模型
- 流式和非流式调用使用同一套 API

### 核心函数

| 函数             | 用途           | 返回              |
| ---------------- | -------------- | ----------------- |
| `generateText()` | 非流式文本生成 | 完整文本          |
| `streamText()`   | 流式文本生成   | textStream 迭代器 |

### 关键参数

| 参数          | 说明                                      |
| ------------- | ----------------------------------------- |
| `model`       | AI SDK model 实例（由 provider 创建）     |
| `messages`    | 消息数组 `[{role, content}]`              |
| `tools`       | 工具定义对象                              |
| `stopWhen`    | 控制工具调用循环次数，如 `isStepCount(5)` |
| `temperature` | 生成温度 (0-1)                            |

### Provider 插件

```typescript
import { createAnthropic } from "@ai-sdk/anthropic"; // Anthropic 协议
import { createOpenAI } from "@ai-sdk/openai"; // OpenAI 协议

// Anthropic 协议
const model = createAnthropic({ apiKey, baseURL })("model-name");

// OpenAI 协议（Chat Completions API）
const model = createOpenAI({ apiKey, baseURL }).chat("model-name");
```

### 工具定义

```typescript
import { tool } from "ai";
import { z } from "zod";

const weatherTool = tool({
  description: "获取指定城市的当前天气",
  inputSchema: z.object({
    city: z.string().describe("城市名称"),
  }),
  execute: async ({ city }) => {
    const res = await fetch(`https://wttr.in/${city}?format=%C+%t`);
    return res.text();
  },
});
```

### 完整调用示例

```typescript
// 非流式
const result = await generateText({
  model,
  messages: [{ role: "user", content: "北京天气？" }],
  tools: { get_weather: weatherTool },
  stopWhen: isStepCount(5),
});
return result.text;

// 流式
const result = streamText({ model, messages, tools, stopWhen: isStepCount(5) });
for await (const chunk of result.textStream) {
  console.log(chunk);
}
```

---

## Anthropic SDK vs OpenAI SDK

### Anthropic SDK (@anthropic-ai/sdk)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey });
const msg = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

特点：

- 仅支持 Anthropic API 格式（`/v1/messages`）
- 工具调用需手写循环

### OpenAI SDK (openai)

```typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey, baseURL });
const chat = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello" }],
});
```

特点：

- 仅支持 OpenAI API 格式（`/v1/chat/completions`）
- 许多国产模型（通义千问、豆包、Kimi）提供 OpenAI 兼容接口
- 工具调用需手写循环

---

“兼容 OpenAI”意味着什么？
因为 OpenAI 的 API 接口在行业内使用非常广泛，它的调用格式、参数（比如消息列表messages、模型名称model）和认证方式（如 API Key）已经成了一种“事实标准”。当一个国产模型说它“兼容OpenAI”，就意味着它的“前台”也学会了这套标准工作流程。

> 这对开发者有三个很直接的好处：

> 1. 代码几乎不用改：你只需要在使用 OpenAI 官方 SDK 时，把请求地址（base_url）换成国产模型服务商的地址，再把 API Key 换成在它那里申请的，就可以像调用 OpenAI 模型一样调用它了。

> > 举个实际的例子：你对接通义千问时，base_url会设置为 https://dashscope.aliyuncs.com/compatible-mode/v1；对接腾讯混元时，base_url则是 https://api.hunyuan.cloud.tencent.com/v1。

> 2. 工具生态无缝接入：许多流行的 AI 开发框架和工具（如 LangChain、LlamaIndex，甚至一些 AI 编程插件）都是优先适配 OpenAI 接口的。国产模型兼容这个标准，意味着这些工具基本都能“开箱即用”。

> 3. 切换模型变得简单：因为接口都一样，你在程序里切换模型时，很多时候只需要改一下model参数（比如从gpt-3.5-turbo换成qwen-plus），再改一下对应的base_url和 API Key 就行，大大降低了多模型对比和切换的成本。

从技术上讲，它是如何工作的？
国产模型服务商通过部署一套兼容 OpenAI API 规范的中间层适配服务（Adapter Layer），复用了 OpenAI 的 SDK 调用方式。该服务负责将标准的 OpenAI 请求参数（如 messages、model）实时转换为各模型原生接口所需的私有格式，并在收到模型返回后，再将响应结果封装为 OpenAI 的标准数据结构（如 choices）回传给客户端。借此，开发者只需修改 base_url（网关地址）与 model（模型名称）参数，即可在不改变原有代码逻辑的前提下，完成从 OpenAI 到国产模型的无缝迁移。

## 实际项目架构

```
前端 (Next.js)                   后端 (Express + Vercel AI SDK)
┌─────────────────┐             ┌──────────────────────────────────┐
│ Model Select     │──model──→  │ providers.ts                     │
│ Chat UI          │──msg───→  │  ├─ createAnthropic()            │── DeepSeek
│ SSE Stream       │←──reply── │  │    (Anthropic 协议)            │
└─────────────────┘             │  └─ createOpenAI().chat(model)   │── 通义千问
                                │     (OpenAI Chat Completions)    │── 豆包
                                │                                  │── Kimi
                                └──────────────────────────────────┘
```

- DeepSeek 使用 **Anthropic 协议**（`@ai-sdk/anthropic`）
- 通义千问、豆包、Kimi 使用 **OpenAI Chat Completions 协议**（`@ai-sdk/openai`）
- Vercel AI SDK 统一管理工具调用循环，开发者只需定义工具

---

## 为什么不直接用官方 SDK？

| 场景         | 官方 SDK              | Vercel AI SDK        |
| ------------ | --------------------- | -------------------- |
| 只用一个模型 | ✅ 简单直接           | 也可以，但多了抽象层 |
| 多模型切换   | ❌ 需要维护多个客户端 | ✅ 统一接口          |
| 工具调用     | ❌ 手写循环           | ✅ 内置循环          |
| 流式处理     | ⚠️ 各 SDK 格式不同    | ✅ 统一              |
