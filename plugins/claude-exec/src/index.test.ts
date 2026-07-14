import { describe, expect, it } from "vitest";
import entry, { executeClaude } from "./index.js";
import { getToolPluginMetadata } from "openclaw/plugin-sdk/tool-plugin";

describe("claude-exec", () => {
  it("declares tool metadata", () => {
    expect(getToolPluginMetadata(entry)?.tools.map((tool) => tool.name)).toEqual(["claude_exec"]);
  });

  it("runs Claude in the requested directory and parses its JSON result", async () => {
    const invocation: Record<string, unknown> = {};
    const runner = async (
      command: string,
      args: string[],
      cwd: string,
      _signal: AbortSignal | undefined,
      timeoutMs: number
    ) => {
      Object.assign(invocation, { command, args, cwd, timeoutMs });
      return {
        exitCode: 0,
        timedOut: false,
        stderr: "",
        stdout: JSON.stringify({
          type: "result",
          subtype: "success",
          is_error: false,
          result: "Reviewed the file.",
          session_id: "test-session",
          total_cost_usd: 0.01,
          duration_ms: 25,
          num_turns: 1
        })
      };
    };

    const result = await executeClaude(
      { prompt: "Return the test result.", cwd: "/tmp/project", model: "sonnet", maxBudgetUsd: 0.5 },
      { claudeBin: "/usr/local/bin/claude", defaultTimeoutMs: 5000 },
      undefined,
      runner
    );

    expect(result.stderrTail).toBe("");
    expect(result.stdoutTail).toContain('"session_id":"test-session"');
    expect(result).toMatchObject({
      success: true,
      exitCode: 0,
      timedOut: false,
      sessionId: "test-session",
      costUsd: 0.01,
      durationMs: 25,
      numTurns: 1
    });
    expect(result.finalMessage).toBe("Reviewed the file.");
    expect(invocation).toEqual({
      command: "/usr/local/bin/claude",
      cwd: "/tmp/project",
      timeoutMs: 5000,
      args: [
        "--print",
        "--output-format",
        "json",
        "--no-session-persistence",
        "--model",
        "sonnet",
        "--max-budget-usd",
        "0.5",
        "Return the test result."
      ]
    });
  });

  it("does not report success when Claude returns malformed JSON", async () => {
    const result = await executeClaude(
      { prompt: "test" },
      {},
      undefined,
      async () => ({ exitCode: 0, timedOut: false, stdout: "not json", stderr: "" })
    );

    expect(result.success).toBe(false);
  });
});
