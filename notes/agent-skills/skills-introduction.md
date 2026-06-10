## 一、什么是 Agent Skills？

**Agent Skills** 是一种轻量级的、开放的格式，用于扩展 AI 智能体的能力。Skill 是一个文件夹，里面放好了指令、脚本等材料。AI 可以自己找到并使用它，从而更准确地完成特定任务。

**Skill（技能）** 是一个**组织好的文件文件夹**，包含指令、脚本、资产和资源。智能体可以发现这些技能，从而准确地执行特定任务。
| 英文 | 中文 | 说明 |
|------|------|------|
| lightweight | 轻量级的 | 简单、不复杂，易于创建和使用 |
| open format | 开放的格式 | 不是私有格式，任何人都可以遵循 |
| extending | 扩展 | 增加原本没有的能力 |
| folder of organized files | 组织好的文件文件夹 | 有结构的文件夹，不是单个文件 |
| instructions | 指令 | 告诉 AI 该怎么做 |
| scripts | 脚本 | 可执行的代码（如 Python、Shell） |
| assets | 资产 | 图片、模板等资源文件 |
| discover | 发现 | AI 可以根据任务自动找到合适的技能 |
| accurately | 准确地 | 提高任务执行的准确性 |


## 二、为什么需要 Agent Skills？
Skills 让你不用每次都从头教 AI，而是把知识、流程和能力打包成一个可复用的"技能包"，让 AI 稳定、准确地完成任务。

### 使用场景

| 类别 | 具体示例 |
|------|---------|
| **领域专业知识** | 品牌指南和模板、法律审查流程、数据分析方法论 |
| **可重复的工作流** | 每周营销活动回顾、客户电话准备流程、季度业务回顾 |
| **新能力扩展** | 创建演示文稿、生成 Excel/PDF 报告、构建 MCP 服务器 |

### 没有 Skills 的问题

- 每次都要描述你的指令和要求
- 每次都要打包所有参考资料和支持文件
- 需要自己确保工作流或输出保持一致

---

## 三、Skills 的核心特性

### 1. 可移植（Portable）

你可以在不同的兼容 Skills 的智能体中复用同一个 skill。例如，可以在 Claude Code、Claude.ai、Claude Agent SDK 和 Claude API 中使用同一个 skill。

Agent Skills 现在是一个**开放标准**，已被越来越多的智能体产品所采用。

### 2. 可组合（Composable）

你可以组合多个 Skills 来构建复杂的工作流。把多个小的 Skill 像乐高积木一样拼在一起，完成一个更复杂的任务。

**示例**：生成营销活动分析 PPT，Claude 会自动调用并组合这四个 Skill
- Bigquery skill → 提供营销相关的数据库表结构
- Marketing campaign analysis skill → 分析营销数据
- Company brand skill → 提供品牌指南（字体、颜色、Logo）
- PowerPoint skill → 把分析结果生成 PPT 幻灯片

**为什么可组合很重要？**
| 传统方式 | Skills 方式 |
| :--- | :--- |
| 一个 Skill 做所有事情，又大又复杂 | 每个 Skill 专注做一件事 |
| 难以复用 | 每个小 Skill 可以被不同场景重复使用 |
| 修改麻烦 | 改一个小 Skill，所有用到它的地方自动受益 |

### 3. 渐进式披露（Progressive Disclosure）
渐进式披露 是一种按需加载的设计机制：Skills 不会一次性把所有内容都塞进上下文窗口，而是分层次、按需加载，避免浪费宝贵的 Token。
![](assets/17807220710830.jpg)

Skill 的内容分三层按需加载，避免 Token 浪费：

| 层次 | 内容 | 加载时机 | 图中的例子 |
| :--- | :--- | :--- | :--- |
| Layer 1: 元数据 | name + description | 始终加载（对话开始时） | name: analyzing-marketing-campaign<br>description: Analyze weekly marketing campaign performance |
| Layer 2: 指令 | SKILL.md 正文 | Skill 被触发时加载 | ## Input、 ## Funnel Metrics、 ## Output Table |
| Layer 3: 资源 | 脚本、参考文件、模板 | 按需加载（需要时才读） | 预算调整规则、优化框架等 |

| 层级 | 内容 | 加载时机 | Token 消耗 |
|------|------|---------|-----------|
| 元数据 | name + description | 始终加载 | ~50 tokens |
| 指令 | SKILL.md 正文 | Skill 被触发时加载 | ~500 tokens |
| 资源 | 脚本、参考文件、模板 | 需要时才加载 | ~5000 tokens |

> **核心目的**：节省 Token、降低成本、为对话留出空间、让 AI 响应更快。

---

## 四、Skill和Tool的区别

### 1. 核心区别
| 维度 | Tools | Skills |
| :--- | :--- | :--- |
| 本质 | 智能体的基础能力 | 智能体的专业知识 |
| 位置 | 始终在智能体中（always live in the agent） | 按需加载（loaded on demand） |
| 内容 | 通用操作：读、写、执行、搜索、抓取等 | 特定领域的指令、流程、模板、脚本 |
| 加载方式 | 始终存在，随时可用 | 渐进式披露，需要时才加载 |
| 例子 | Read、Write、Bash、Glob、Grep、WebFetch、Task | 营销分析、品牌规范、PPT生成、数据库查询 |

### 2. Tools介绍

Tools 是 Agent 天生具备的能力，始终在智能体的上下文中，随时可用。让Agent从只会说，变成能做事。Agent可以使用tools操作外部系统，实时搜索，读取数据库，也可以写文件，发邮件，跑脚本等等。
```text
Agent
├── LLM（大脑）
└── Tools（基础工具箱——始终存在）
    ├── Read, Write, Edit（文件操作）
    ├── Bash（命令行）
    ├── Glob, Grep（搜索）
    ├── WebFetch, WebSearch（网络）
    ├── NotebookRead, NotebookWrite（笔记）
    ├── Task（子任务）
    ├── Skill（技能调用器）← 特殊的 Tool
    └── ...
```
### 3. Skills的不同

Skills 存储在文件系统中，不在 Agent 的上下文里，只有需要时才被加载。Skills 用专业知识扩展 Agent 的能力。Skills 可以包含脚本，这些脚本按需作为工具使用，也就是说 Skill 内部可以封装自己的"小工具"。
```text
Filesystem（文件系统）
├── Skill A（专业知识包）
├── Skill B
├── Skill C
└── Skill D
```

### 4. Tools 和 Skills 如何协作？
Tools 是手脚，Skills 是脑中的 SOP（标准作业程序）。两者配合，Agent 才能专业又高效。

```text
用户: "分析营销数据并生成PPT报告"

     ↓

Agent (LLM) 理解需求

     ↓

Agent 判断需要用到 "marketing-analysis" Skill

     ↓

Agent 调用 Skill Tool → 从文件系统加载 Skill

     ↓

Skill 提供专业知识（如何分析、用什么指标、输出格式等）

     ↓

Agent 结合 Skill 的知识 + Tools 的能力执行任务

     ↓
   使用 Read Tool 读取数据
   使用 Bash Tool 运行脚本
   使用 Write Tool 生成报告
   使用 WebFetch Tool 获取补充信息
     ↓

返回结果给用户
```

## 五、Skill 的 Frontmatter 规范

### 1. 文件位置

```text
skill-name-folder/
└── SKILL.md
```
### 2. Frontmatter 示例

```text
---
name: analyzing-marketing-campaign
description: Analyze weekly marketing campaign performance data across channels. Use when analyzing multi-channel digital marketing data to calculate funnel metrics, compute cost and revenue efficiency metrics, or get budget reallocation.
---
```

### 3. 字段约束

| 字段 | 约束 |
| :--- | :--- |
| **name** | 最大 64 字符；只允许小写字母、数字、连字符 (`-`)；不能以连字符开头或结尾；必须与父目录名匹配；推荐使用动名词形式 (如 `analyzing`) |
| **description** | 最大 1024 字符；非空；应描述“做什么”和“何时用”；应包含关键词帮助 AI 识别相关任务 |

### 4. 为什么这些约束很重要？
| 约束 | 原因 |
| :--- | :--- |
| name 与父目录匹配 | Claude 通过目录名发现 Skill，不一致会导致找不到 |
| description 包含关键词 | AI 通过 description 判断是否触发该 Skill |
| name 使用动名词 | 统一命名规范，便于理解和维护 |
| description 描述"何时用" | 帮助 AI 在正确的场景自动调用 |


## 六、Skills和Sub Agent

### 1. 什么是Sub Agent？
Subagent（子代理） 是 Claude Code 中可以在当前会话里派出去的“分身”，每个分身有独立的上下文窗口和工具权限，干完活只把结果摘要返回给主对话，主对话不会被那些大量输出塞满。

### 2. 核心特征
| 特征 | 说明 |
| :--- | :--- |
| 独立上下文 | 完全独立的上下文窗口，与主对话隔离 |
| 选择性工具权限 | 可以限制只能使用特定的工具 |
| 并行执行 | 多个 Subagent 可以同时运行 |
| 单向通信 | 主对话分发任务，Subagent 上报结果，Subagent 之间不能直接通信 |

### 3. 如何创建 Sub Agent？
Subagent 是一个 Markdown 文件，放到对应目录里即可：

| 级别 | 路径 | 说明 |
| :--- | :--- | :--- |
| 项目级 | `.claude/agents/` | 只在当前项目生效，可提交 git 和团队共享 |
| 用户级 | `~/.claude/agents/` | 对你所有项目生效 |

**文件内容**

```text
---
name: code-reviewer
description: Expert code review specialist. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: sonnet
skills: migration-best-practices
---

You are a senior code reviewer ensuring high standards of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

## Review checklist:
- Code is clear and readable
- Functions and variables are well-named
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented
- Good test coverage
- Performance considerations addressed

## Output format:
Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)
```

**配置项说明**
| 字段 | 说明 |
| :--- | :--- |
| name | 唯一的名称（必需） |
| description | 描述什么时候触发，Claude 靠这个决定什么时候调用它（必需） |
| tools | 控制这个 Subagent 能用哪些工具，没列出的就用不了 |
| model | 用哪个模型：sonnet、opus、haiku、inherit |
| skills | 自动加载哪些 Skills（可选） |

**调用方式**
Subagent 只能通过主 Agent 唤起
```text
# 显式唤起：直接指定
帮我使用 code-reviewer subagent 进行代码审查

# 隐式唤起：让 Claude 自己选
帮我进行代码审查
```

## 七、Skills 与 Sub Agent的区别
简单来说：Skills 管“怎么做”，Subagents 管“谁来做“

| 维度 | Skills | Subagents |
| :--- | :--- | :--- |
| 核心定位 | 打包专业知识，提供操作指南 | 专门处理特定任务的独立执行者 |
| 执行方式 | 主 Agent 参考知识后自己执行 | 在独立进程中自主执行 |
| 上下文 | 共享主会话上下文 | 独立上下文，完全隔离 |
| 调用方式 | 自动发现加载 | 显式调用（Task 工具） |
| 通信 | 单向：Skill → Agent | 单向：主Agent → Subagent → 返回结果 |
| 可并行性 | 不并行，主 Agent 串行执行 | 可并行执行多个 Subagent |
| Token 成本 | 低（渐进式披露） | 中等（独立实例但结果摘要返回） |
| 权限控制 | 受主会话限制 | 精细白名单控制 |
| 配置复杂度 | 低（单文件 SKILL.md） | 中（可定义 tools/model/skills） |

### 1. 两者如何协作？
```text
主 Agent
    │
    ├── 自动加载 Skill A（提供专业知识）
    │
    └── 调用 Subagent（独立上下文）
              │
              ├── 使用 Skill B（专业知识）
              ├── 使用 Skill C（操作指南）
              │
              └── 返回结果给主 Agent
具体流程：

用户提出任务

主 Agent 判断需要什么 Skill，自动加载相关知识

主 Agent 调用 Task 工具，启动 Subagent

Subagent 在独立上下文中使用 Skills（渐进式加载）

Subagent 返回结构化结果

主 Agent 整合结果回复用户
```

### 2. 选型指南
| 场景 | 推荐方案 | 原因 |
| :--- | :--- | :--- |
| 需要专业知识（品牌规范、审查流程） | Skill | 打包成可复用知识，自动加载 |
| 重复性工作流（周报、数据分析） | Skill | 标准化 SOP，确保一致性 |
| 代码审查、测试生成、文档更新 | Subagent | 独立上下文，不污染主对话 |
| 多个任务可并行 | Subagent | 同时派出去，比串行快 |
| 需要精细权限控制 | Subagent | 可限制 tools 白名单 |
| 需要来回调整/频繁交互 | 主对话 | Subagent 启动有延迟 |


## 八、Skills vs Prompts vs Subagents vs MCP比较

### 1. What it provides（提供什么）
| 类型 | 含义 | 通俗理解 |
| :--- | :--- | :--- |
| Skills | 程序性知识 | “怎么做”的操作指南（流程、规范、方法论） |
| Prompts | 即时指令 | 你现在马上要做什么（临时的、一次性的指令） |
| Subagents | 任务委派 | 把活派给别人干（独立执行，干完回来汇报） |
| MCP | 工具连接 | 接通外部数据源和工具（让 AI 能访问数据库、API 等） |

### 2. Persistence（持久性）
| 类型 | 持久性 | 通俗理解 |
| :--- | :--- | :--- |
| Skills | 跨对话 | 今天装的 Skill，明天、后天都还在 |
| Prompts | 单次对话 | 这一轮说完，下一轮就忘了 |
| Subagents | 跨会话 | 定义的 Subagent 可以反复使用 |
| MCP | 持续连接 | MCP 服务器一直连着，随时可用 |

### 3. Contains（包含什么）
| 类型 | 包含内容 | 通俗理解 |
| :--- | :--- | :--- |
| Skills | 指令 + 代码 + 资产 | 完整的“工作包”：说明书 + 脚本 + 模板图片等 |
| Prompts | 自然语言 | 就是一段话，没有代码，没有附件 |
| Subagents | 完整智能体逻辑 | 有自己的思考、工具、权限的“迷你 AI” |
| MCP | 工具定义 | 定义了“能做什么”（如：查数据库、发邮件） |

### 4. When it loads（加载时机）
| 类型 | 加载时机 | 通俗理解 |
| :--- | :--- | :--- |
| Skills | 动态按需加载 | 需要时才加载，不浪费 Token |
| Prompts | 每轮对话 | 每一轮都要重新说（或者说，它只在当轮生效） |
| Subagents | 被调用时 | 派出去干活时才启动 |
| MCP | 始终可用 | 一直连着，随时可以调用 |

### 5. Best for（最佳用途）
| 类型 | 最佳用途 | 通俗理解 |
| :--- | :--- | :--- |
| Skills | 专业化知识 | 公司规范、行业知识、复用的工作流 |
| Prompts | 快速请求 | 临时问个问题、简单的单次操作 |
| Subagents | 专业化任务 | 代码审查、测试生成、文档更新（需要独立执行的） |
| MCP | 数据访问 | 连数据库、调外部 API、读内部系统 |


### 6. 关系图谱

```text
┌─────────────────────────────────────────────────────────────┐
│                        时间维度                              │
│  短期 (一次性)                    长期 (可复用)               │
│  ┌──────────┐                    ┌──────────┐               │
│  │ Prompts  │                    │ Skills   │               │
│  └──────────┘                    └──────────┘               │
│                                      │                      │
│                                      ↓                      │
│                              ┌──────────────┐               │
│                              │  Subagents   │               │
│                              │ (可调用技能)  │               │
│                              └──────────────┘               │
│                                      │                      │
│                                      ↓                      │
│                              ┌──────────────┐               │
│                              │     MCP      │               │
│                              │  (基础设施)   │               │
│                              └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

