# Claude Exec

`claude-exec` is a native OpenClaw tool plugin that exposes the Claude Code CLI
as an agent-callable tool named `claude_exec`.

It runs Claude in non-interactive JSON mode, uses the requested project as the
process working directory, disables session persistence, and enforces a
configurable process timeout.

## Requirements

- OpenClaw 2026.5.17 or newer
- Node.js 22 or newer
- Claude Code installed and authenticated

Install Claude Code without `sudo`:

```bash
npm install -g @anthropic-ai/claude-code
claude
```

Complete authentication in the interactive Claude session, then exit it.

## Build And Test

```bash
cd /path/to/claude-exec
npm install
npm run build
npm test
npm run plugin:validate
```

## Install Into OpenClaw

Transfer `claude-exec-0.1.0.tgz` to the target computer, then install it:

```bash
openclaw plugins install /path/to/claude-exec-0.1.0.tgz
```

For development from the unpacked source directory, use a link instead:

```bash
openclaw plugins install --link /path/to/claude-exec
```

Add the plugin tool to the active tool profile. Merge it with any existing
entries instead of replacing them:

```json
{
  "tools": {
    "profile": "coding",
    "alsoAllow": ["claude_exec"]
  }
}
```

Configure defaults if needed:

```json
{
  "plugins": {
    "entries": {
      "claude-exec": {
        "enabled": true,
        "config": {
          "defaultCwd": "/path/to/projects",
          "defaultModel": "sonnet",
          "defaultPermissionMode": "acceptEdits",
          "defaultMaxBudgetUsd": 2,
          "defaultTimeoutMs": 600000
        }
      }
    }
  }
}
```

Restart the OpenClaw gateway after changing plugin or tool configuration.

## Tool Parameters

`claude_exec` accepts:

- `prompt`
- `cwd`
- `model`
- `permissionMode`
- `maxBudgetUsd`
- `timeoutMs`
- `dangerouslySkipPermissions`

`dangerouslySkipPermissions` overrides `permissionMode` for that invocation.
Use it only inside an isolated environment.

## Verify

```bash
openclaw plugins inspect claude-exec --runtime --json
```

Runtime output should include:

```json
{
  "toolNames": ["claude_exec"]
}
```

Start a new OpenClaw session and ask it to call `claude_exec` directly for a
small no-write task. The resulting tool details should show a command beginning
with `claude --print --output-format json`.
