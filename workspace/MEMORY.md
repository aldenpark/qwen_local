# MEMORY.md - Long-Term Memory

Use this file for global facts that apply across projects and sessions.

Project-specific facts belong in:

~/.openclaw/workspace/projects/<project-name>/

Do not put detailed project state here unless it affects multiple projects.

## Preferences

- Direct, technical communication
- Step-by-step commands
- Conservative on destructive actions — ask first
- Local/free tools for config, memory, shell work, small files only
- Local Qwen should not review or refactor large codebases directly. Use bounded inspection only; route large/broad code work to Codex.
- **All code review, refactoring, and edits MUST go through Codex** — OpenClaw inspects only with bounded `rg`/`sed`, Codex does everything else
- Codex is the only viable path — credit savings come from tight handoffs (one scope at a time, verify before next), not from avoiding Codex
- For local Qwen/OpenClaw work, keep reasoning short and emit tool calls early.
- After crashes, `/new`, or context overflow, read the active project `HANDOFF.md` before asking the user to restate work.
- **Approval prompts**: if `skill_workshop apply` or similar tool times out on approval, tell the user exactly what to do — including a CLI command or script they can run themselves (e.g., `openclaw skills workshop apply <id>`). Never silently give up on approvals.
- **Codex routing**: use the `codex_exec` OpenClaw tool for code review, refactors, edits, and other actual code work. Use `codex__codex` only for Codex login, configuration, plugin/MCP management, or Codex debugging.

## Codex Usage Rules

When user says "use codex" or requests heavy code work:

1. **Always use `codex_exec` tool** - Never use plain `exec` for code work
2. **Developer instructions**: Set `developer-instructions` to:
   ```
   Be concise. Use tool calls early. No filler. Final reply: files changed + verification only. No summaries, no raw dumps.
   ```
3. **Scope**: One file or one logical task per call. No global configs without per-call override.
4. **Handoffs**: Pass file paths, not large file contents. Let Codex open/read/edit files locally.
5. **Verification**: Always specify a verification command and expect compact output.
6. **Caveman**: Use full caveman for Codex handoffs unless prompted for normal prose.

## Failure handling

If Codex fails because of auth, quota, model availability, MCP limits, context limits, or command failure:

1. Stop.
2. Report the exact failure.
3. Suggest the next command or config check.
4. Do not locally edit the code as fallback unless explicitly approved.

- **Codex MCP handoff instructions**: when `codex__codex` is used for those narrow admin/debug cases, set `developer-instructions` to:

```
Be concise. Use tool calls early. No filler. Final reply: files changed + verification only. No summaries, no raw dumps.
```
Use caveman full for Codex handoffs unless prompted for normal prose.

OpenClaw should still provide Codex with:

- project root
- exact file paths or allowed directories
- task goal
- constraints
- verification command
- compact output requirement

Pass file paths, not large file contents.

Do not paste large files into Codex MCP. Tell Codex to open/read/edit files locally.

## Failure handling

If Codex fails because of auth, quota, model availability, MCP limits, context limits, or command failure:

1. Stop.
2. Report the exact failure.
3. Suggest the next command or config check.
4. Do not locally edit the code as fallback unless explicitly approved.

## One scope at a time  
No global config exists for this — must be per-call. Caveman style less important than bounded scope. Keep each Codex call to one file or one logical task.

Ask before using sudo, deleting files, changing public exposure, or making hard-to-reverse system changes.

## CRITICAL: Ask First Rule

**NEVER** make any file changes, config edits, system modifications, or external actions without explicit user confirmation FIRST. If user says "look at X crashing" or "fix X":

1. **STOP** - Do not make any changes yet
2. **READ** - Inspect current state only
3. **REPORT** - Show findings with diffs/showcase changes
4. **WAIT** - Do not proceed until user says "proceed", "go ahead", or similar explicit approval
5. **EXPLAIN** - Before each destructive action, show exact command and explain what it will do

This is non-negotiable. Default to asking, never assuming.

## Plan Creation Shortcut
When user says "create a plan", automatically:
1. Create project directory: `projects/<task-name>-packager` or `projects/<task-name>`
2. Write PROJECT.md with overview
3. Write PLAN.md with phased checklist
4. Ask clarifying questions for plan details

This creates consistent project structure for all planning tasks.
