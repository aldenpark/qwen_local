import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const configSchema = Type.Object({
  codexBin: Type.Optional(Type.String({ description: "Path to the codex binary." })),
  defaultCwd: Type.Optional(Type.String({ description: "Default working directory for codex exec." })),
  defaultProfile: Type.Optional(Type.String({ description: "Default Codex profile." })),
  defaultSandbox: Type.Optional(Type.String({ description: "Default Codex sandbox mode." }))
});

const sandboxSchema = Type.Optional(
  Type.Union([
    Type.Literal("read-only"),
    Type.Literal("workspace-write"),
    Type.Literal("danger-full-access")
  ])
);

export default defineToolPlugin({
  id: "codex-exec",
  name: "Codex Exec",
  description: "Expose codex exec as an OpenClaw tool.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "codex_exec",
      label: "Codex Exec",
      description: "Run codex exec non-interactively for larger coding work.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Instructions to send to codex exec." }),
        cwd: Type.Optional(Type.String({ description: "Working directory for the Codex run." })),
        profile: Type.Optional(Type.String({ description: "Optional Codex profile name." })),
        model: Type.Optional(Type.String({ description: "Optional Codex model override." })),
        sandbox: sandboxSchema,
        skipGitRepoCheck: Type.Optional(Type.Boolean({ description: "Pass --skip-git-repo-check." })),
        dangerouslyBypassApprovalsAndSandbox: Type.Optional(
          Type.Boolean({ description: "Pass --dangerously-bypass-approvals-and-sandbox." })
        )
      }),
      async execute(params, config, context) {
        context.signal?.throwIfAborted();

        const cwd = resolve(params.cwd ?? config.defaultCwd ?? process.cwd());
        const codexBin = config.codexBin?.trim() || "codex";
        const outputDir = await mkdtemp(join(tmpdir(), "codex-exec-"));
        const outputFile = join(outputDir, "last-message.txt");

        const args = ["exec", "--json", "-o", outputFile, "-C", cwd];

        if (params.profile ?? config.defaultProfile) {
          args.push("-p", params.profile ?? config.defaultProfile ?? "");
        }
        if (params.model) {
          args.push("-m", params.model);
        }
        if (params.sandbox ?? config.defaultSandbox) {
          args.push("-s", params.sandbox ?? config.defaultSandbox ?? "");
        }
        if (params.skipGitRepoCheck) {
          args.push("--skip-git-repo-check");
        }
        if (params.dangerouslyBypassApprovalsAndSandbox) {
          args.push("--dangerously-bypass-approvals-and-sandbox");
        }

        args.push(params.prompt);

        try {
          const result = await runCommand(codexBin, args, context.signal);
          const finalMessage = await readOptionalFile(outputFile);

          return {
            success: result.exitCode === 0,
            command: [codexBin, ...args],
            cwd,
            exitCode: result.exitCode,
            finalMessage,
            stdoutTail: tailText(result.stdout, 12000),
            stderrTail: tailText(result.stderr, 6000)
          };
        } finally {
          await rm(outputDir, { recursive: true, force: true });
        }
      }
    })
  ]
});

async function runCommand(command: string, args: string[], signal?: AbortSignal) {
  return await new Promise<{ exitCode: number; stdout: string; stderr: string }>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolvePromise({
        exitCode: code ?? 1,
        stdout,
        stderr
      });
    });

    signal?.addEventListener(
      "abort",
      () => {
        child.kill("SIGTERM");
      },
      { once: true }
    );
  });
}

async function readOptionalFile(path: string) {
  try {
    const text = await readFile(path, "utf8");
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

function tailText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(text.length - maxChars);
}
