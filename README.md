# Claudinho

<p align="center">
  <img src="claudinho.png" alt="Claudinho" width="600">
</p>

Use Claudinho with **any LLM** — powered by API keys only, no OAuth required.

Claudinho lets you use Claudinho with any LLM through OpenRouter, OpenAI, Anthropic, or Google Gemini API keys. Plug in GPT-4o, DeepSeek, Gemini, Llama, Mistral, Claude, or any model available through OpenRouter (200+ models).

All of Claudinho's tools work — bash, file read/write/edit, grep, glob, agents, tasks, MCP — just powered by whatever model you choose.

---

## Install

```bash
npm install -g claudinho
```

Then just run:

```bash
claudinho
```

On first run, Claudinho will ask you to choose a provider and enter your API key. That's it!

> If you see `ripgrep not found`, install ripgrep system-wide and confirm `rg --version` works before starting.

---

## Quick Start

### Option 1: Interactive Setup (Recommended)

Just run `claudinho` — it will guide you through choosing a provider and entering your API key.

### Option 2: Environment Variables

#### OpenRouter (recommended — 200+ models)

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-or-your-key-here
export OPENAI_BASE_URL=https://openrouter.ai/api/v1
claudinho
```

#### Anthropic (direct)

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
claudinho
```

#### OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o
claudinho
```

#### Google Gemini

```bash
export CLAUDE_CODE_USE_GEMINI=1
export GEMINI_API_KEY=your-key-here
claudinho
```

---

## Supported Providers

| Provider | Best For |
|----------|----------|
| **OpenRouter** | Access to 200+ models with a single API key |
| **Anthropic** | Direct access to Claude models |
| **OpenAI** | GPT-4o and other OpenAI models |
| **Gemini** | Google's models via API |
| **Ollama** | Run models locally on your machine |

---

## What Works

- **All tools**: Bash, FileRead, FileWrite, FileEdit, Glob, Grep, WebFetch, WebSearch, Agent, MCP, LSP, NotebookEdit, Tasks
- **Streaming**: Real-time token streaming
- **Tool calling**: Multi-step tool chains
- **Images**: Base64 and URL images passed to vision models
- **Slash commands**: /commit, /review, /compact, /diff, /doctor, etc.
- **Sub-agents**: AgentTool spawns sub-agents using the same provider
- **Memory**: Persistent memory system

---

## How It Works

```
Claudinho Tool System
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
  Any compatible model (via OpenRouter, OpenAI, etc.)
```

---

## Update

```bash
npm update -g claudinho
```

## Uninstall

```bash
npm uninstall -g claudinho
```

---

## License

MIT
