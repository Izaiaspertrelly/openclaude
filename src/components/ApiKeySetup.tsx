import React, { useState } from 'react'
import { Box, Text } from '../ink.js'
import { useTerminalSize } from '../hooks/useTerminalSize.js'
import { Select } from './CustomSelect/select.js'
import TextInput from './TextInput.js'
import { saveGlobalConfig } from '../utils/config.js'

type Provider = 'openrouter' | 'anthropic' | 'openai' | 'gemini'

const PROVIDER_OPTIONS = [
  { label: 'OpenRouter (recommended — 200+ models)', value: 'openrouter' },
  { label: 'Anthropic (Claude models)', value: 'anthropic' },
  { label: 'OpenAI (GPT models)', value: 'openai' },
  { label: 'Google Gemini', value: 'gemini' },
]

const PROVIDER_ENV_MAP: Record<
  Provider,
  { keyEnv: string; baseUrlEnv?: string; baseUrl?: string; useFlag?: string }
> = {
  openrouter: {
    keyEnv: 'OPENAI_API_KEY',
    baseUrlEnv: 'OPENAI_BASE_URL',
    baseUrl: 'https://openrouter.ai/api/v1',
    useFlag: 'CLAUDE_CODE_USE_OPENAI',
  },
  anthropic: {
    keyEnv: 'ANTHROPIC_API_KEY',
  },
  openai: {
    keyEnv: 'OPENAI_API_KEY',
    useFlag: 'CLAUDE_CODE_USE_OPENAI',
  },
  gemini: {
    keyEnv: 'GEMINI_API_KEY',
    useFlag: 'CLAUDE_CODE_USE_GEMINI',
  },
}

const PROVIDER_KEY_HINTS: Record<Provider, string> = {
  openrouter: 'sk-or-...  (get one at https://openrouter.ai/keys)',
  anthropic: 'sk-ant-...  (get one at https://console.anthropic.com)',
  openai: 'sk-...  (get one at https://platform.openai.com)',
  gemini: 'AI...  (get one at https://aistudio.google.com)',
}

const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
}

type Props = {
  onDone(): void
}

type Step = 'select-provider' | 'enter-key' | 'success'

export function ApiKeySetup({ onDone }: Props): React.ReactNode {
  const [step, setStep] = useState<Step>('select-provider')
  const [provider, setProvider] = useState<Provider>('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState('')
  const { columns } = useTerminalSize()

  function handleProviderSelect(value: string) {
    setProvider(value as Provider)
    setStep('enter-key')
    setError('')
  }

  function handleKeySubmit(value: string) {
    const key = value.trim()
    if (!key) {
      setError('A chave API não pode estar vazia')
      return
    }

    const envConfig = PROVIDER_ENV_MAP[provider]
    const envVars: Record<string, string> = {
      [envConfig.keyEnv]: key,
    }
    if (envConfig.baseUrl && envConfig.baseUrlEnv) {
      envVars[envConfig.baseUrlEnv] = envConfig.baseUrl
    }
    if (envConfig.useFlag) {
      envVars[envConfig.useFlag] = '1'
    }

    // Apply to current process so the rest of the session picks it up
    for (const [k, v] of Object.entries(envVars)) {
      process.env[k] = v
    }

    // Persist to global config so subsequent startups reload the key
    saveGlobalConfig(current => ({
      ...(current as Record<string, unknown>),
      claudinhoProvider: provider,
      claudinhoApiKey: key,
    }))

    setStep('success')
    setTimeout(onDone, 1200)
  }

  if (step === 'select-provider') {
    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Text bold>Bem-vindo ao Claudinho!</Text>
        <Text>Escolha seu provedor de IA:</Text>
        <Select
          options={PROVIDER_OPTIONS}
          onChange={handleProviderSelect}
        />
        <Text dimColor>
          Use ↑/↓ para navegar e Enter para selecionar.
        </Text>
      </Box>
    )
  }

  if (step === 'enter-key') {
    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Text bold>
          Insira sua chave API do {PROVIDER_LABELS[provider]}:
        </Text>
        <Text dimColor>Formato: {PROVIDER_KEY_HINTS[provider]}</Text>
        <Box
          borderStyle="round"
          borderColor="cyan"
          paddingX={1}
        >
          <Text>{'> '}</Text>
          <TextInput
            value={apiKey}
            onChange={setApiKey}
            onSubmit={handleKeySubmit}
            columns={Math.max(20, columns - 8)}
            showCursor={true}
            placeholder="cole sua chave aqui"
          />
        </Box>
        {error ? <Text color="red">{error}</Text> : null}
        <Text dimColor>Pressione Enter para confirmar.</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      <Text color="green" bold>
        ✓ Chave API salva com sucesso!
      </Text>
      <Text>Provedor: {PROVIDER_LABELS[provider]}</Text>
      <Text dimColor>Iniciando Claudinho...</Text>
    </Box>
  )
}
