/**
 * Claudinho build script — bundles the TypeScript source into a single
 * distributable JS file using Bun's bundler.
 *
 * Handles:
 * - bun:bundle feature() flags → all false (disables internal-only features)
 * - MACRO.* globals → inlined version/build-time constants
 * - src/ path aliases
 */

import { existsSync, readFileSync } from 'fs'
import { dirname, resolve as pathResolve } from 'path'
import { noTelemetryPlugin } from './no-telemetry-plugin'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

// Feature flags — all disabled for the open build.
// These gate Anthropic-internal features (voice, proactive, kairos, etc.)
const featureFlags: Record<string, boolean> = {
  VOICE_MODE: false,
  PROACTIVE: false,
  KAIROS: false,
  BRIDGE_MODE: false,
  DAEMON: false,
  AGENT_TRIGGERS: false,
  MONITOR_TOOL: false,
  ABLATION_BASELINE: false,
  DUMP_SYSTEM_PROMPT: false,
  CACHED_MICROCOMPACT: false,
  COORDINATOR_MODE: false,
  CONTEXT_COLLAPSE: false,
  COMMIT_ATTRIBUTION: false,
  TEAMMEM: false,
  UDS_INBOX: false,
  BG_SESSIONS: false,
  AWAY_SUMMARY: false,
  TRANSCRIPT_CLASSIFIER: false,
  WEB_BROWSER_TOOL: false,
  MESSAGE_ACTIONS: false,
  BUDDY: false,
  CHICAGO_MCP: false,
  COWORKER_TYPE_TELEMETRY: false,
}

const result = await Bun.build({
  entrypoints: ['./src/entrypoints/cli.tsx'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  splitting: false,
  sourcemap: 'external',
  minify: false,
  naming: 'cli.mjs',
  define: {
    // MACRO.* build-time constants
    // Keep the internal compatibility version high enough to pass
    // first-party minimum-version guards, but expose the real package
    // version separately in Claudinho branding.
    'MACRO.VERSION': JSON.stringify('99.0.0'),
    'MACRO.DISPLAY_VERSION': JSON.stringify(version),
    'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'MACRO.ISSUES_EXPLAINER':
      JSON.stringify('report the issue at https://github.com/Izaiaspertrelly/openclaude/issues'),
    'MACRO.PACKAGE_URL': JSON.stringify('claudinho'),
    'MACRO.NATIVE_PACKAGE_URL': 'undefined',
  },
  plugins: [
    noTelemetryPlugin,
    {
      name: 'bun-bundle-shim',
      setup(build) {
        const internalFeatureStubModules = new Map([
          [
            '../daemon/workerRegistry.js',
            'export async function runDaemonWorker() { throw new Error("Daemon worker is unavailable in the open build."); }',
          ],
          [
            '../daemon/main.js',
            'export async function daemonMain() { throw new Error("Daemon mode is unavailable in the open build."); }',
          ],
          [
            '../cli/bg.js',
            `
export async function psHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function logsHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function attachHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function killHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function handleBgFlag() { throw new Error("Background sessions are unavailable in the open build."); }
`,
          ],
          [
            '../cli/handlers/templateJobs.js',
            'export async function templatesMain() { throw new Error("Template jobs are unavailable in the open build."); }',
          ],
          [
            '../environment-runner/main.js',
            'export async function environmentRunnerMain() { throw new Error("Environment runner is unavailable in the open build."); }',
          ],
          [
            '../self-hosted-runner/main.js',
            'export async function selfHostedRunnerMain() { throw new Error("Self-hosted runner is unavailable in the open build."); }',
          ],
        ] as const)

        // Resolve `import { feature } from 'bun:bundle'` to a shim
        build.onResolve({ filter: /^bun:bundle$/ }, () => ({
          path: 'bun:bundle',
          namespace: 'bun-bundle-shim',
        }))
        build.onLoad(
          { filter: /.*/, namespace: 'bun-bundle-shim' },
          () => ({
            contents: `export function feature(name) { return false; }`,
            loader: 'js',
          }),
        )

        build.onResolve(
          { filter: /^\.\.\/(daemon\/workerRegistry|daemon\/main|cli\/bg|cli\/handlers\/templateJobs|environment-runner\/main|self-hosted-runner\/main)\.js$/ },
          args => {
            if (!internalFeatureStubModules.has(args.path)) return null
            return {
              path: args.path,
              namespace: 'internal-feature-stub',
            }
          },
        )
        build.onLoad(
          { filter: /.*/, namespace: 'internal-feature-stub' },
          args => ({
            contents:
              internalFeatureStubModules.get(args.path) ??
              'export {}',
            loader: 'js',
          }),
        )

        // Claudinho: Stub all internal Anthropic feature-gated modules that
        // were stripped from the open-source fork. These are all behind
        // feature() flags that always return false, so they're dead code —
        // but Bun still tries to resolve them at bundle time.
        const MISSING_INTERNAL_MODULES = [
          // proactive
          'proactive/index',
          // assistant / kairos
          'assistant/index',
          'assistant/gate',
          'assistant/sessionDiscovery',
          // server / remote control
          'server/parseConnectUrl',
          'server/server',
          'server/sessionManager',
          'server/backends/dangerousBackend',
          'server/serverBanner',
          'server/serverLog',
          'server/lockfile',
          'server/connectHeadless',
          // ssh
          'ssh/createSSHSession',
          // skillSearch
          'services/skillSearch/featureCheck',
          'services/skillSearch/prefetch',
          'services/skillSearch/localSearch',
          // compact internals
          'services/compact/cachedMCConfig',
          'services/compact/snipProjection',
          'services/compact/reactiveCompact',
          // sessionTranscript
          'services/sessionTranscript/sessionTranscript',
          // jobs
          'jobs/classifier',
          // utils
          'utils/taskSummary',
          'utils/attributionHooks',
          'utils/systemThemeWatcher',
          // attribution trailer (feature-gated)
          'attributionTrailer',
          // coordinator
          'coordinator/workerAgent',
          // skills
          'skills/mcpSkills',
          // tools (feature-gated)
          'tools/SleepTool/SleepTool',
          'tools/MonitorTool/MonitorTool',
          'tools/SendUserFileTool/SendUserFileTool',
          'tools/SendUserFileTool/prompt',
          'tools/PushNotificationTool/PushNotificationTool',
          'tools/SubscribePRTool/SubscribePRTool',
          'tools/OverflowTestTool/OverflowTestTool',
          'tools/CtxInspectTool/CtxInspectTool',
          'tools/TerminalCaptureTool/TerminalCaptureTool',
          'tools/TerminalCaptureTool/prompt',
          'tools/WebBrowserTool/WebBrowserTool',
          'tools/SnipTool/SnipTool',
          'tools/SnipTool/prompt',
          'tools/ListPeersTool/ListPeersTool',
          'tools/WorkflowTool/createWorkflowCommand',
          'tools/WorkflowTool/bundled/index',
          'tools/WorkflowTool/WorkflowTool',
          'tools/DiscoverSkillsTool/prompt',
          'tools/VerifyPlanExecutionTool/constants',
          // commands (feature-gated)
          'commands/proactive',
          'commands/assistant/index',
          'commands/remoteControlServer/index',
          'commands/force-snip',
          'commands/workflows/index',
          'commands/subscribe-pr',
          'commands/torch',
          'commands/peers/index',
          'commands/fork/index',
          'commands/buddy/index',
          // computer-use
          'computerUse/mcpServer',
          // tasks (feature-gated)
          'tasks/MonitorMcpTask/MonitorMcpTask',
          'tasks/LocalWorkflowTask/LocalWorkflowTask',
          // components (feature-gated)
          'components/tasks/MonitorMcpDetailDialog',
          'components/messages/SnipBoundaryMessage',
          'messages/SnipBoundaryMessage',
          'MonitorMcpDetailDialog',
          // session transcript
          'sessionTranscript/sessionTranscript',
          // workflows
          'components/tasks/WorkflowDetailDialog',
          'WorkflowDetailDialog',
          // memdir
          'memdir/memoryShapeTelemetry',
          // messages
          'components/messages/UserGitHubWebhookMessage',
          'components/messages/UserForkBoilerplateMessage',
          'components/messages/UserCrossSessionMessage',
          'messages/UserGitHubWebhookMessage',
          'messages/UserForkBoilerplateMessage',
          'messages/UserCrossSessionMessage',
          'UserGitHubWebhookMessage',
          'UserForkBoilerplateMessage',
          'UserCrossSessionMessage',
        ]

        // Build a regex that matches any relative import ending in one of
        // these paths (with optional .js extension).
        const missingModulesRegex = new RegExp(
          '(^|/)(' +
            MISSING_INTERNAL_MODULES.map(m =>
              m.replace(/\//g, '\\/'),
            ).join('|') +
            ')\\.js$',
        )

        // Extract the named imports for a given (importer, path) pair by
        // parsing the importer source.
        const extractImportedNames = (
          importerPath: string,
          importPath: string,
        ): Set<string> => {
          const names = new Set<string>()
          try {
            const src = readFileSync(importerPath, 'utf-8')
            const escaped = importPath.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )
            const re = new RegExp(
              `import\\s*(?:type\\s*)?\\{([^}]+)\\}\\s*from\\s*['"]${escaped}['"]`,
              'g',
            )
            let m: RegExpExecArray | null
            while ((m = re.exec(src)) !== null) {
              for (const part of m[1].split(',')) {
                const name = part
                  .trim()
                  .replace(/^type\s+/, '')
                  .split(/\s+as\s+/)[0]
                  .trim()
                if (name && /^[A-Za-z_$][\w$]*$/.test(name)) {
                  names.add(name)
                }
              }
            }
          } catch {
            // ignore
          }
          return names
        }

        // Unique-path encoding: stub path = `${importPath}::${importerHash}`
        // so each (importer, path) pair becomes its own onLoad invocation with
        // the right named exports. This avoids races when multiple importers
        // stub the same module with different names.
        const stubInfo = new Map<
          string,
          { origPath: string; names: Set<string> }
        >()
        let stubCounter = 0

        const makeStub = (args: {
          path: string
          importer: string
        }) => {
          const names = args.importer
            ? extractImportedNames(args.importer, args.path)
            : new Set<string>()
          const id = `stub${stubCounter++}`
          stubInfo.set(id, { origPath: args.path, names })
          return {
            path: id,
            namespace: 'claudinho-missing-stub',
          }
        }

        build.onResolve({ filter: missingModulesRegex }, makeStub)

        // Claudinho catch-all: any relative import from within src/ whose
        // target file does not exist on disk gets stubbed.
        build.onResolve({ filter: /^\.\.?\// }, args => {
          if (!args.importer) return null
          if (!args.importer.includes('/claudinho/src/')) return null
          const importerDir = dirname(args.importer)
          const targetPath = pathResolve(importerDir, args.path)
          const candidates = [
            targetPath,
            targetPath.replace(/\.jsx?$/, '.ts'),
            targetPath.replace(/\.jsx?$/, '.tsx'),
            targetPath.replace(/\.jsx?$/, '.js'),
            targetPath.replace(/\.jsx?$/, '/index.ts'),
            targetPath.replace(/\.jsx?$/, '/index.tsx'),
            targetPath.replace(/\.jsx?$/, '/index.js'),
          ]
          for (const candidate of candidates) {
            if (existsSync(candidate)) return null
          }
          return makeStub(args)
        })

        // Also stub the @ant/* external packages
        build.onResolve({ filter: /^@ant\// }, makeStub)

        build.onLoad(
          { filter: /.*/, namespace: 'claudinho-missing-stub' },
          args => {
            const info = stubInfo.get(args.path)
            const names = info?.names ?? new Set<string>()
            const exportsCode = Array.from(names)
              .map(n => `export const ${n} = stub;`)
              .join('\n')
            return {
              contents: `
// Claudinho stub: this module (${info?.origPath ?? args.path}) was stripped from the open build.
const noop = () => null;
const handler = {
  get(_, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy(noop, handler);
    if (prop === 'then') return undefined;
    return new Proxy(noop, handler);
  },
  apply() { return new Proxy(noop, handler); },
  construct() { return new Proxy({}, handler); },
};
const stub = new Proxy(noop, handler);
export default stub;
export const __claudinhoStub = true;
${exportsCode}
`,
              loader: 'js',
            }
          },
        )

        // Resolve react/compiler-runtime to the standalone package
        build.onResolve({ filter: /^react\/compiler-runtime$/ }, () => ({
          path: 'react/compiler-runtime',
          namespace: 'react-compiler-shim',
        }))
        build.onLoad(
          { filter: /.*/, namespace: 'react-compiler-shim' },
          () => ({
            contents: `export function c(size) { return new Array(size).fill(Symbol.for('react.memo_cache_sentinel')); }`,
            loader: 'js',
          }),
        )

        // NOTE: @opentelemetry/* kept as external deps (too many named exports to stub)

        // Resolve native addon and missing snapshot imports to stubs
        for (const mod of [
          'audio-capture-napi',
          'audio-capture.node',
          'image-processor-napi',
          'modifiers-napi',
          'url-handler-napi',
          'color-diff-napi',
          'sharp',
          '@anthropic-ai/mcpb',
          '@ant/claude-for-chrome-mcp',
          '@anthropic-ai/sandbox-runtime',
          'asciichart',
          'plist',
          'cacache',
          'fuse',
          'code-excerpt',
          'stack-utils',
        ]) {
          build.onResolve({ filter: new RegExp(`^${mod}$`) }, () => ({
            path: mod,
            namespace: 'native-stub',
          }))
        }
        build.onLoad(
          { filter: /.*/, namespace: 'native-stub' },
          () => ({
            // Comprehensive stub that handles any named export via Proxy
            contents: `
const noop = () => null;
const noopClass = class {};
const handler = {
  get(_, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy({}, handler);
    if (prop === 'ExportResultCode') return { SUCCESS: 0, FAILED: 1 };
    if (prop === 'resourceFromAttributes') return () => ({});
    if (prop === 'SandboxRuntimeConfigSchema') return { parse: () => ({}) };
    return noop;
  }
};
const stub = new Proxy(noop, handler);
export default stub;
export const __stub = true;
// Named exports for all known imports
export const SandboxViolationStore = null;
export const SandboxManager = new Proxy({}, { get: () => noop });
export const SandboxRuntimeConfigSchema = { parse: () => ({}) };
export const BROWSER_TOOLS = [];
export const getMcpConfigForManifest = noop;
export const ColorDiff = null;
export const ColorFile = null;
export const getSyntaxTheme = noop;
export const plot = noop;
export const createClaudeForChromeMcpServer = noop;
// OpenTelemetry exports
export const ExportResultCode = { SUCCESS: 0, FAILED: 1 };
export const resourceFromAttributes = noop;
export const Resource = noopClass;
export const SimpleSpanProcessor = noopClass;
export const BatchSpanProcessor = noopClass;
export const NodeTracerProvider = noopClass;
export const BasicTracerProvider = noopClass;
export const OTLPTraceExporter = noopClass;
export const OTLPLogExporter = noopClass;
export const OTLPMetricExporter = noopClass;
export const PrometheusExporter = noopClass;
export const LoggerProvider = noopClass;
export const SimpleLogRecordProcessor = noopClass;
export const BatchLogRecordProcessor = noopClass;
export const MeterProvider = noopClass;
export const PeriodicExportingMetricReader = noopClass;
export const trace = { getTracer: () => ({ startSpan: () => ({ end: noop, setAttribute: noop, setStatus: noop, recordException: noop }) }) };
export const context = { active: noop, with: (_, fn) => fn() };
export const SpanStatusCode = { OK: 0, ERROR: 1, UNSET: 2 };
export const ATTR_SERVICE_NAME = 'service.name';
export const ATTR_SERVICE_VERSION = 'service.version';
export const SEMRESATTRS_SERVICE_NAME = 'service.name';
export const SEMRESATTRS_SERVICE_VERSION = 'service.version';
export const AggregationTemporality = { CUMULATIVE: 0, DELTA: 1 };
export const DataPointType = { HISTOGRAM: 0, SUM: 1, GAUGE: 2 };
export const InstrumentType = { COUNTER: 0, HISTOGRAM: 1, UP_DOWN_COUNTER: 2 };
export const PushMetricExporter = noopClass;
export const SeverityNumber = {};
`,
            loader: 'js',
          }),
        )

        // Resolve .md and .txt file imports to empty string stubs
        build.onResolve({ filter: /\.(md|txt)$/ }, (args) => ({
          path: args.path,
          namespace: 'text-stub',
        }))
        build.onLoad(
          { filter: /.*/, namespace: 'text-stub' },
          () => ({
            contents: `export default '';`,
            loader: 'js',
          }),
        )
      },
    },
  ],
  external: [
    // OpenTelemetry — too many named exports to stub, kept external
    '@opentelemetry/api',
    '@opentelemetry/api-logs',
    '@opentelemetry/core',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/exporter-trace-otlp-proto',
    '@opentelemetry/exporter-logs-otlp-http',
    '@opentelemetry/exporter-logs-otlp-proto',
    '@opentelemetry/exporter-logs-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-proto',
    '@opentelemetry/exporter-metrics-otlp-grpc',
    '@opentelemetry/exporter-metrics-otlp-http',
    '@opentelemetry/exporter-prometheus',
    '@opentelemetry/resources',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/sdk-trace-node',
    '@opentelemetry/sdk-logs',
    '@opentelemetry/sdk-metrics',
    '@opentelemetry/semantic-conventions',
    // Cloud provider SDKs
    '@aws-sdk/client-bedrock',
    '@aws-sdk/client-bedrock-runtime',
    '@aws-sdk/client-sts',
    '@aws-sdk/credential-providers',
    '@azure/identity',
    'google-auth-library',
  ],
})

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log(`✓ Built claudinho v${version} → dist/cli.mjs`)
