# OpenClaw + Codex Worker Rules

Qwen/OpenClaw is the coordinator. Codex is the code worker.

Use this file for Codex routing and handoff behavior. Keep `AGENTS.md` short and reference this file instead of duplicating these details there.

## Use Qwen/OpenClaw directly for

* small targeted files
* short edits
* config changes
* shell commands
* plan tracking
* inspecting specific file ranges
* reviewing small diffs
* server/admin tasks

## Use Codex for

* large files
* multi-file refactors
* broad code cleanup
* complex bug fixes across several files
* repo-level code review
* tasks requiring long code understanding
* exact patching after a failed local edit
* changes where Qwen hits context/output limits

If Qwen sees `stopReason=length`, context overflow, repeated failed edit attempts, or tool-loop thrashing, stop local editing and route to Codex.

## Codex execution options

The `codex_exec` OpenClaw tool is the **preferred** way to communicate with Codex for code work.

Use `codex_exec` for:

* **ALL** code work — it's the default and most reliable method
* large files
* multi-file refactors
* complex bug fixes
* tasks requiring long code understanding

Only use Codex MCP directly (via the `codex__codex` tool) when:
* you need to interact with the interactive CLI
* you're managing Codex configuration (login, MCP servers, plugins)
* you're debugging Codex itself

Use plain `exec` to run `codex exec` only as fallback when `codex_exec` is unavailable or being debugged.

Do not silently fall back from failed Codex to local `write`, `edit`, or `apply_patch` unless Alden explicitly says to proceed without Codex.

## Active project root

Do not hard-code one repo.

For each Codex handoff, identify the active project root from the user request, file path, current task, or project memory.

Examples:

```text
/srv/repo/<project-root>
/srv/<project-name>
/home/username/dev/<project_name>
/home/username/<projectname>
```

If the project root is unclear, inspect with bounded shell commands before handing off.

## Codex prompt rules

Codex is a worker, not a chat partner.

Every Codex handoff should include:

* project root
* exact file paths or allowed directories
* task goal
* constraints
* verification command
* compact output requirement

Pass file paths, not large file contents.

Do not paste large files into Codex MCP. Tell Codex to open/read/edit files locally.

## Caveman

Use `caveman full` for Codex handoffs unless prompted for normal prose.

OpenClaw should still provide Codex with:

- project root
- exact file paths or allowed directories
- task goal
- constraints
- verification command

Pass file paths, not large file contents.

If `caveman full` is unavailable or fails, tell Codex to return only compact status: files changed, commands run, tests, notes, and next step.

## Codex model choice

Do not guess Codex model names.

Before specifying a Codex model, check the current OpenClaw/Codex catalog:
~/.openclaw/agents/main/agent/plugins/openai/catalog.json

Use only model IDs listed in that file.

Default Codex worker model:
gpt-5.4-mini

Use stronger models only when the task justifies it:
gpt-5.4   - harder edits, moderate refactors, failed mini attempt
gpt-5.5   - complex refactors, difficult debugging, repeated failed attempts

If the requested/default model is missing from the catalog, stop and report the catalog mismatch. Do not silently substitute an invented model.

## OpenClaw verification after Codex

After Codex finishes, OpenClaw should verify with bounded commands.

Preferred checks:

```bash
git status --short
git diff --stat
git diff -- path/to/file | sed -n '1,160p'
python3 -m py_compile path/to/file.py
```

Use targeted tests when available.

Do not read full files or dump full diffs unless Alden asks.

## One scope at a time

Keep each Codex call to one file or one logical task.

Avoid broad prompts like:

```text
clean up the repo
```

Prefer:

```text
Update /path/to/file.py by adding comments to non-obvious functions. Do not change behavior. Run py_compile.
```

Small, bounded Codex handoffs save credits and reduce failed runs.

## Failure handling

If Codex fails because of auth, quota, model availability, MCP limits, context limits, or command failure:

1. Stop.
2. Report the exact failure.
3. Suggest the next command or config check.
4. Do not locally edit the code as fallback unless Alden explicitly approves.

## Codex tool usage

Use the `codex__codex` tool for:
* Interactive Codex sessions with custom prompts
* Managing Codex configuration
* Debugging Codex

Use the `codex_exec` OpenClaw tool for actual code work:
* Pass the task prompt
* Pass project paths and file locations
* Specify model/profile options if needed

Use plain `exec` with `codex exec` only as fallback when `codex_exec` is unavailable or being debugged

Example:
```
codex_exec:
  prompt: Update /path/to/file.py by adding comments to non-obvious functions. Do not change behavior. Run py_compile.
  cwd: /path/to/project
```

The `developer-instructions` parameter on `codex__codex` should be set to:

```
Be concise. Use tool calls early. No filler. Final reply: files changed + verification only. No summaries, no raw dumps.
```

For Caveman mode with Codex, set `caveman full` in developer-instructions.

## Memory

Do not use memory search for Codex routing rules.
