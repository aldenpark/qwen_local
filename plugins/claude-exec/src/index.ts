import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { Type, type Static } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const permissionModeSchema = Type.Union([
  Type.Literal("acceptEdits"),
  Type.Literal("bypassPermissions"),
  Type.Literal("default"),
  Type.Literal("delegate"),
  Type.Literal("dontAsk"),
  Type.Literal("plan")
]);

const configSchema = Type.Object({
  claudeBin: Type.Optional(Type.String({ description: "Path to the Claude Code binary." })),
  defaultCwd: Type.Optional(Type.String({ description: "Default working directory for Claude Code." })),
  defaultModel: Type.Optional(Type.String({ description: "Default Claude model or alias." })),
  defaultPermissionMode: Type.Optional(permissionModeSchema),
  defaultMaxBudgetUsd: Type.Optional(
    Type.Number({ minimum: 0, description: "Default maximum spend per Claude invocation in USD." })
  ),
  defaultTimeoutMs: Type.Optional(
    Type.Integer({ minimum: 1000, description: "Default process timeout in milliseconds." })
  )
});

const parametersSchema = Type.Object({
  prompt: Type.String({ description: "Instructions to send to Claude Code." }),
  cwd: Type.Optional(Type.String({ description: "Working directory for the Claude Code run." })),
  model: Type.Optional(Type.String({ description: "Optional Claude model or alias override." })),
  permissionMode: Type.Optional(permissionModeSchema),
  maxBudgetUsd: Type.Optional(
    Type.Number({ minimum: 0, description: "Maximum spend for this invocation in USD." })
  ),
  timeoutMs: Type.Optional(Type.Integer({ minimum: 1000, description: "Process timeout in milliseconds." })),
  dangerouslySkipPermissions: Type.Optional(
    Type.Boolean({ description: "Pass --dangerously-skip-permissions. Use only in an isolated environment." })
  )
});

export default defineToolPlugin({
  id: "claude-exec",
  name: "Claude Exec",
  description: "Expose the Claude Code CLI as an OpenClaw tool.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "claude_exec",
      label: "Claude Exec",
      description: "Run Claude Code non-interactively for bounded coding work.",
      parameters: parametersSchema,
      async execute(params, config, context) {
        return await executeClaude(params, config, context.signal);
      }
    })
  ]
});

export async function executeClaude(
  params: Static<typeof parametersSchema>,
  config: Static<typeof configSchema>,
  signal?: AbortSignal,
  commandRunner: CommandRunner = runCommand
) {
  signal?.throwIfAborted();

  const cwd = resolve(params.cwd ?? config.defaultCwd ?? process.cwd());
  const claudeBin = config.claudeBin?.trim() || "claude";
  const timeoutMs = params.timeoutMs ?? config.defaultTimeoutMs ?? 600_000;
  const args = ["--print", "--output-format", "json", "--no-session-persistence"];
  const model = params.model ?? config.defaultModel;
  const permissionMode = params.permissionMode ?? config.defaultPermissionMode;
  const maxBudgetUsd = params.maxBudgetUsd ?? config.defaultMaxBudgetUsd;

  if (model) {
    args.push("--model", model);
  }
  if (params.dangerouslySkipPermissions) {
    args.push("--dangerously-skip-permissions");
  } else if (permissionMode) {
    args.push("--permission-mode", permissionMode);
  }
  if (maxBudgetUsd !== undefined) {
    args.push("--max-budget-usd", String(maxBudgetUsd));
  }

  args.push(params.prompt);

  const result = await commandRunner(claudeBin, args, cwd, signal, timeoutMs);
  const parsed = parseClaudeJson(result.stdout);
  const claudeReportedError = parsed?.is_error === true;

  return {
    success: result.exitCode === 0 && !result.timedOut && parsed !== null && !claudeReportedError,
    command: [claudeBin, ...args],
    cwd,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    timeoutMs,
    finalMessage: typeof parsed?.result === "string" ? parsed.result : null,
    sessionId: typeof parsed?.session_id === "string" ? parsed.session_id : null,
    costUsd: typeof parsed?.total_cost_usd === "number" ? parsed.total_cost_usd : null,
    durationMs: typeof parsed?.duration_ms === "number" ? parsed.duration_ms : null,
    numTurns: typeof parsed?.num_turns === "number" ? parsed.num_turns : null,
    stdoutTail: tailText(result.stdout, 12000),
    stderrTail: tailText(result.stderr, 6000)
  };
}

type CommandRunner = (
  command: string,
  args: string[],
  cwd: string,
  signal: AbortSignal | undefined,
  timeoutMs: number
) => Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }>;

function parseClaudeJson(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  signal: AbortSignal | undefined,
  timeoutMs: number
) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let timedOut = false;
  let stopped = false;
  let forceKillTimer: ReturnType<typeof setTimeout> | undefined;

  const stopChild = () => {
    if (stopped) {
      return;
    }
    stopped = true;
    child.kill("SIGTERM");
    forceKillTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
    forceKillTimer.unref();
  };
  const onAbort = () => stopChild();
  const timeout = setTimeout(() => {
    timedOut = true;
    stopChild();
  }, timeoutMs);
  timeout.unref();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const [exitCode, stdout, stderr] = await Promise.all([
      new Promise<number>((resolvePromise, reject) => {
        child.once("error", reject);
        child.once("close", (code) => resolvePromise(code ?? 1));
      }),
      readStream(child.stdout),
      readStream(child.stderr)
    ]);
    return { exitCode, stdout, stderr, timedOut };
  } finally {
    clearTimeout(timeout);
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
    signal?.removeEventListener("abort", onAbort);
  }
}

async function readStream(stream: NodeJS.ReadableStream) {
  let text = "";
  for await (const chunk of stream) {
    text += chunk.toString();
  }
  return text;
}

function tailText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(text.length - maxChars);
}
