# System Notes for OpenClaw

Read this file directly at the start of each session. Do not use memory_search.

## Local model

- Qwen local model runs with OpenClaw, inspect OpenClaw's active model config in ~/.openclaw/openclaw.json
agents.defaults.model.primary
models.providers.<provider>.baseUrl
models.providers.<provider>.models[].id
models.providers.<provider>.models[].contextTokens
models.providers.<provider>.models[].maxTokens

- OpenAI-compatible endpoint:
models.providers.qwen-local.baseUrl

## Safety / shell rules

- Do not run `sudo` unless explicitly approved.
- If a command requires sudo, explain the command and ask for it to be run manually.
- Prefer read-only inspection commands first.
- Do not make broad destructive changes.
- Do not delete files without explicit confirmation.
- Do not run package installs automatically unless explicitly approved.

## Repo / project

OpenClaw workspace files:

~/.openclaw/workspace

Global files:

AGENTS.md
USER.md
TOOLS.md
MEMORY.md
system-notes.md
codex-worker-rules.md

Project-specific memory belongs under:

~/.openclaw/workspace/projects/<project-name>/

Expected project files:

CURRENT_STATE.md
DECISIONS.md
TASKS.md
HANDOFF.md
RUNBOOK.md
ARCHITECTURE.md

Do not assume there is only one active plan or project.

## Project selection

Before answering project setup, architecture, troubleshooting, or coding questions:

1. Identify the project from the path, repo, service, or user request.
2. Check the matching project folder under ~/.openclaw/workspace/projects/.
3. Read HANDOFF.md first after /new, crash, context overflow, or interrupted work.
4. Read CURRENT_STATE.md and DECISIONS.md before making architecture/config claims.
5. Update project notes when durable setup changes are made.

## Codex routing

Qwen/OpenClaw is the coordinator. Codex is the heavy code worker.

Read the detailed routing rules here:

~/.openclaw/workspace/codex-worker-rules.md

Use Codex for large files, broad refactors, code review, complex bug fixes, repo-level reasoning, or any task that causes local context/output/tool-loop failure.

Both computers have caveman installed. Use caveman full for Codex handoffs unless Alden asks for normal prose.

If a task should go to Codex, use the `codex_exec` OpenClaw tool for code work.

Use plain `exec` to run `codex exec` only as fallback when `codex_exec` is unavailable or being debugged.

If Codex fails because of model availability, auth, quota, MCP limits, context limits, or command failure, report the failure. Do not silently fall back to local write, edit, or apply_patch.

## Codex model catalog

Do not guess Codex model names.

Before specifying a Codex model, check:

~/.openclaw/agents/main/agent/plugins/openai/catalog.json

Use only model IDs listed there.

Default Codex worker model:

gpt-5.4-mini

If the model is missing from the catalog, stop and report the mismatch.

Local model discipline

Use bounded inspection commands:

rg -n "pattern" path
sed -n 'START,ENDp' file
head -80 file
tail -80 file
wc -l file

Avoid broad file reads, recursive dumps, long logs, and full diffs.

If a local code edit fails because exact text does not match, do not retry repeatedly. Either inspect a smaller range or route to Codex.

## Memory/search rules

- Do not use memory_search right now.
- OpenClaw memory indexing may fail because OpenAI embeddings quota is unavailable.
- Read important workspace files directly by path instead.
