# PertrellyClaude

Use Claude Code with **any LLM** — not just Claude.

PertrellyClaude lets you use Claude Code with any LLM through an OpenAI-compatible API shim. Plug in GPT-4o, DeepSeek, Gemini, Llama, Mistral, or any model that speaks the OpenAI chat completions API. It also supports the ChatGPT Codex backend for `codexplan` and `codexspark`, and local inference via [Atomic Chat](https://atomic.chat/) on Apple Silicon.

All of Claude Code's tools work — bash, file read/write/edit, grep, glob, agents, tasks, MCP — just powered by whatever model you choose.

---

## Install

```bash
npm install -g pertrellyclaude
```

Then just run:

```bash
pertrellyclaude
```

> If you see `ripgrep not found`, install ripgrep system-wide and confirm `rg --version` works before starting.

---

## Quick Start

### Windows PowerShell

```powershell
npm install -g pertrellyclaude

$env:CLAUDE_CODE_USE_OPENAI="1"
$env:OPENAI_API_KEY="sk-your-key-here"
$env:OPENAI_MODEL="gpt-4o"

pertrellyclaude
```

### macOS / Linux

```bash
npm install -g pertrellyclaude

export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o

pertrellyclaude
```

That's it. You're running Claude Code with OpenAI.

---

## Guides

- [Non-Technical Setup](docs/non-technical-setup.md) — easiest path, copy-paste steps
- [Windows Quick Start](docs/quick-start-windows.md)
- [macOS / Linux Quick Start](docs/quick-start-mac-linux.md)
- [Advanced Setup](docs/advanced-setup.md) — source builds, Bun, profiles, more providers

---

## Supported Providers

| Provider | Best For |
|----------|----------|
| **OpenAI** | Best default if you have an API key |
| **Ollama** | Run models locally on your machine |
| **Codex** | If you use the ChatGPT Codex backend |
| **Atomic Chat** | Local inference on Apple Silicon |
| **DeepSeek** | Great quality, fast |
| **Gemini** | Google's models via API |

---

## What Works

- **All tools**: Bash, FileRead, FileWrite, FileEdit, Glob, Grep, WebFetch, WebSearch, Agent, MCP, LSP, NotebookEdit, Tasks
- **Streaming**: Real-time token streaming
- **Tool calling**: Multi-step tool chains (the model calls tools, gets results, continues)
- **Images**: Base64 and URL images passed to vision models
- **Slash commands**: /commit, /review, /compact, /diff, /doctor, etc.
- **Sub-agents**: AgentTool spawns sub-agents using the same provider
- **Memory**: Persistent memory system

---

## Model Quality Notes

| Model | Tool Calling | Code Quality | Speed |
|-------|-------------|-------------|-------|
| GPT-4o | Excellent | Excellent | Fast |
| DeepSeek-V3 | Great | Great | Fast |
| Gemini 2.0 Flash | Great | Good | Very Fast |
| Llama 3.3 70B | Good | Good | Medium |
| Mistral Large | Good | Good | Fast |
| GPT-4o-mini | Good | Good | Very Fast |
| Qwen 2.5 72B | Good | Good | Medium |
| Smaller models (<7B) | Limited | Limited | Very Fast |

For best results, use models with strong function/tool calling support.

---

## How It Works

The shim sits between Claude Code and the LLM API:

```
Claude Code Tool System
        |
        v
  Anthropic SDK interface (duck-typed)
        |
        v
  openaiShim.ts  ← translates formats
        |
        v
  OpenAI Chat Completions API
        |
        v
  Any compatible model
```

It translates:
- Anthropic message blocks → OpenAI messages
- Anthropic tool_use/tool_result → OpenAI function calls
- OpenAI SSE streaming → Anthropic stream events
- Anthropic system prompt arrays → OpenAI system messages

The rest of Claude Code doesn't know it's talking to a different model.

---

## Update

```bash
npm update -g pertrellyclaude
```

## Uninstall

```bash
npm uninstall -g pertrellyclaude
```

---

## License

MIT
