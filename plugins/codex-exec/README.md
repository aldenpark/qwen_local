# Codex Exec

`codex-exec` is a native OpenClaw tool plugin that exposes `codex exec` as an
agent-callable tool named `codex_exec`.

This is meant for the local Qwen + OpenClaw workflow where:

- Qwen handles cheap routing and small local tasks
- Codex handles heavier code work
- OpenClaw should use `codex exec` instead of calling `codex__*` MCP tools

## What It Adds

The plugin registers one OpenClaw tool:

- `codex_exec`

That tool shells out to:

```bash
codex exec
```

and returns:

- success
- exit code
- final message
- stdout tail
- stderr tail
- working directory
- full command

## Requirements

- OpenClaw 2026.5.17 or newer
- Node.js 22 or newer
- A working local Codex login:

```bash
codex login
```

## Build

From this plugin directory:

```bash
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

## Install Into OpenClaw

From this plugin directory:

```bash
openclaw plugins install --link .
```

Or from the repo root:

```bash
openclaw plugins install --link ~/models/plugins/codex-exec
```

Then restart the OpenClaw gateway.

## Configure For Local Qwen

If you want the local `qwen-local` provider to use this plugin instead of
direct Codex MCP tools:

```bash
openclaw config set 'plugins.entries["codex-exec"].config.defaultCwd' '"/home/aldenpark/models"' --strict-json
openclaw config set 'tools.byProvider["qwen-local"].deny' '["codex__*"]' --strict-json
```

That keeps Codex MCP installed for direct operator use, but prevents the local
Qwen coordinator from choosing `codex__*` tools.

## Tool Parameters

`codex_exec` accepts:

- `prompt`
- `cwd`
- `profile`
- `model`
- `sandbox`
- `skipGitRepoCheck`
- `dangerouslyBypassApprovalsAndSandbox`

## Verify

Check cold metadata:

```bash
openclaw plugins inspect codex-exec --json
```

Check runtime tool registration:

```bash
openclaw plugins inspect codex-exec --runtime --json
```

You should see:

```json
{
  "contracts": {
    "tools": ["codex_exec"]
  }
}
```

and runtime output containing:

```json
{
  "toolNames": ["codex_exec"]
}
```

## Notes

- This plugin is intentionally small. It adds one tool, not a full Codex
  runtime surface.
- It does not add `openclaw codex configure`, `openclaw codex doctor`, or other
  SDK-style commands.
- If you want the full packaged runtime UX, use `openclaw-codex-sdk` instead.
